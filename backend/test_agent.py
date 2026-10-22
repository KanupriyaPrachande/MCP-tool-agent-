from backend.agent.graph import graph
from langgraph.types import Command


def text_of(msg):
    c = msg.content
    if isinstance(c, str):
        return c
    return "".join(b.get("text", "") for b in c if isinstance(b, dict))


def ask(role, question, thread):
    print(f"\n===== [{role}] {question} =====")
    cfg = {"configurable": {"thread_id": something}, "recursion_limit": 12}
    inp = {"messages": [("user", question)], "role": role}
    while True:
        interrupted = False
        for chunk in graph.stream(inp, cfg, stream_mode="updates"):
            for node, upd in chunk.items():
                if node == "__interrupt__":
                    print("APPROVAL NEEDED:", upd[0].value)
                    answer = input("Approve? (y/n) ").strip().lower() == "y"
                    inp = Command(resume={"approved": answer})
                    interrupted = True
                elif upd and upd.get("trace"):
                    print("TRACE:", upd["trace"])
                elif node == "agent" and not upd["messages"][-1].tool_calls:
                    print("ANSWER:", text_of(upd["messages"][-1]))
        if not interrupted:
            break


if __name__ == "__main__":
    # ask("hr", "What is the average salary by department?", "t1")
    # ask("intern", "What is the average salary by department?", "t2")
    ask("intern", "Create a ticket titled Test", "t3")
    ask("hr", "Create a ticket titled Fix churn dashboard", "t4")