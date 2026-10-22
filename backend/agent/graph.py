import os
import json
import time
import operator
from typing import Annotated, TypedDict

from dotenv import load_dotenv
from langchain_core.rate_limiters import InMemoryRateLimiter
from langchain_core.messages import SystemMessage, ToolMessage
from langchain_google_genai import ChatGoogleGenerativeAI
from langgraph.graph import StateGraph, START, END
from langgraph.graph.message import add_messages
from langgraph.checkpoint.memory import MemorySaver
from langgraph.types import interrupt, Command

from backend.agent.mcp_client import llm_tools_for_role, call_mcp_tool

load_dotenv()

WRITE_TOOLS = {"create_ticket"}

ROLE_TOOLS = {
    "hr": {"list_tables", "query_data", "create_ticket"},
    "manager": {"list_tables", "query_data", "create_ticket"},
    "intern": {"list_tables", "query_data"},
}


# ---------- State ----------
class State(TypedDict):
    messages: Annotated[list, add_messages]
    role: str
    trace: Annotated[list, operator.add]


# ---------- Model ----------
# Free tier allows ~5 requests/min, so stay just under it (0.07 req/s is about 4/min)
limiter = InMemoryRateLimiter(requests_per_second=0.07, check_every_n_seconds=0.5, max_bucket_size=1)

# Tools are NOT bound here. They are bound per role inside the agent node,
# using the schemas fetched from the MCP server (with user_role stripped out).
llm = ChatGoogleGenerativeAI(
    model=os.getenv("MODEL", "gemini-3.5-flash"),
    temperature=0,
    google_api_key=os.getenv("GOOGLE_API_KEY"),
    rate_limiter=limiter,
    max_retries=6,
)


# ---------- Nodes ----------
def agent(state: State):
    system = SystemMessage(content=(
        f"You are Sentinel, an enterprise data assistant. The current user has the role '{state['role']}'. "
        "Use tools to get data; never guess numbers. If a tool returns DENIED or masked values (***), "
        "tell the user they lack access and do not try to work around it. "
        "For write actions call create_ticket; the user will be asked to approve. "
        "Keep answers concise and state which tables you used."
        "Do not explore the schema. Use at most 2 query_data calls per question, then answer. "
    ))

    allowed = ROLE_TOOLS.get(state["role"], set())
    llm_with_tools = llm.bind_tools(llm_tools_for_role(allowed))

    response = llm_with_tools.invoke([system] + state["messages"])
    return {"messages": [response]}


def route(state: State):
    calls = state["messages"][-1].tool_calls
    if not calls:
        return END
    allowed = ROLE_TOOLS.get(state["role"], set())
    if any(c["name"] in WRITE_TOOLS and c["name"] in allowed for c in calls):
        return "approval"
    return "tools"


def approval(state: State):
    calls = state["messages"][-1].tool_calls
    writes = [{"tool": c["name"], "args": c["args"]} for c in calls if c["name"] in WRITE_TOOLS]
    decision = interrupt({"type": "approval", "actions": writes})

    if decision.get("approved"):
        return Command(
            goto="tools",
            update={"trace": [{"tool": "approval", "status": "approved", "ms": 0, "args": {}}]},
        )

    msgs = [
        ToolMessage(content="REJECTED by user. Do not retry.", tool_call_id=c["id"], name=c["name"])
        for c in calls
    ]
    return Command(
        goto="agent",
        update={
            "messages": msgs,
            "trace": [{"tool": "approval", "status": "rejected", "ms": 0, "args": {}}],
        },
    )


def _status_from_result(text: str) -> str:
    """MCP tools return text. Work out whether it represents an error."""
    if text.startswith("ERROR:"):
        return "error"
    try:
        parsed = json.loads(text)
        if isinstance(parsed, dict) and "error" in parsed:
            return "error"
    except (ValueError, TypeError):
        pass
    return "ok"


def tools_node(state: State):
    role, out, trace = state["role"], [], []
    for c in state["messages"][-1].tool_calls:
        t0 = time.time()
        if c["name"] not in ROLE_TOOLS.get(role, set()):
            content = json.dumps({"error": f"DENIED: role '{role}' cannot use {c['name']}"})
            status = "denied"
        else:
            try:
                # Goes over the MCP protocol. The role comes from the JWT-derived
                # state and is injected inside call_mcp_tool, never chosen by the LLM.
                content = call_mcp_tool(c["name"], c["args"], role)
                status = _status_from_result(content)
            except Exception as e:
                content = json.dumps({"error": str(e)})
                status = "error"

        out.append(ToolMessage(
            content=content,
            tool_call_id=c["id"],
            name=c["name"],
        ))
        trace.append({
            "tool": c["name"],
            "args": c["args"],
            "status": status,
            "ms": int((time.time() - t0) * 1000),
        })
    return {"messages": out, "trace": trace}


# ---------- Graph ----------
g = StateGraph(State)
g.add_node("agent", agent)
g.add_node("approval", approval)
g.add_node("tools", tools_node)

g.add_edge(START, "agent")
g.add_conditional_edges("agent", route, {"approval": "approval", "tools": "tools", END: END})
g.add_edge("tools", "agent")

graph = g.compile(checkpointer=MemorySaver())