import asyncio
import json
import sys
from pathlib import Path

from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client

PROJECT_ROOT = Path(__file__).resolve().parents[2]

SERVER_PARAMS = StdioServerParameters(
    command=sys.executable,
    args=["-m", "backend.mcp_servers.data_server"],
    cwd=str(PROJECT_ROOT),
)

_tools_cache = None


async def _with_session(fn):
    async with stdio_client(SERVER_PARAMS) as (read, write):
        async with ClientSession(read, write) as session:
            await session.initialize()
            return await fn(session)


def _strip_role(schema: dict) -> dict:
    """Remove user_role from the schema the LLM sees."""
    s = json.loads(json.dumps(schema))
    s.pop("title", None)
    s.get("properties", {}).pop("user_role", None)
    s["required"] = [r for r in s.get("required", []) if r != "user_role"]
    return s


def _fetch_tools() -> list[dict]:
    global _tools_cache
    if _tools_cache is None:
        async def go(session):
            result = await session.list_tools()
            return [
                {
                    "name": t.name,
                    "description": t.description or "",
                    "parameters": _strip_role(t.inputSchema),
                }
                for t in result.tools
            ]
        _tools_cache = asyncio.run(_with_session(go))
    return _tools_cache


def llm_tools_for_role(allowed_names) -> list[dict]:
    """Tool schemas for the LLM, filtered to what this role may use."""
    return [t for t in _fetch_tools() if t["name"] in allowed_names]


def call_mcp_tool(name: str, args: dict, role: str) -> str:
    """Call a tool on the MCP server. The role is injected here, never by the LLM."""
    safe_args = {k: v for k, v in (args or {}).items() if k != "user_role"}
    safe_args["user_role"] = role

    async def go(session):
        res = await session.call_tool(name, safe_args)
        text = "\n".join(
            c.text for c in res.content if getattr(c, "type", None) == "text"
        )
        return f"ERROR: {text}" if res.isError else text

    return asyncio.run(_with_session(go))