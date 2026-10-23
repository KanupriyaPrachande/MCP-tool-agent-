import os, json, sqlite3, time
import jwt
from dotenv import load_dotenv
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from langgraph.types import Command
from backend.agent.graph import graph


load_dotenv()
SECRET = os.getenv("JWT_SECRET", "dev-secret")
AUDIT_DB = "backend/data/audit.db"

DEMO_USERS = {  # username: (password, role)
    "hr_user": ("demo123", "hr"),
    "manager_user": ("demo123", "manager"),
    "intern_user": ("demo123", "intern"),
}

app = FastAPI(title="Sentinel")
ALLOWED_ORIGINS = [
    o.strip()
    for o in os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(",")
    if o.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
bearer = HTTPBearer()

def init_audit():
    con = sqlite3.connect(AUDIT_DB)git grep -n "^import os" backend/api/main.py
    con.execute("CREATE TABLE IF NOT EXISTS audit(ts REAL, user TEXT, role TEXT, event TEXT, detail TEXT)")
    con.commit(); con.close()
init_audit()

def audit(user, role, event, detail):
    con = sqlite3.connect(AUDIT_DB)
    con.execute("INSERT INTO audit VALUES (?,?,?,?,?)", (time.time(), user, role, event, json.dumps(detail, default=str)))
    con.commit(); con.close()

def current_user(cred: HTTPAuthorizationCredentials = Depends(bearer)):
    try:
        return jwt.decode(cred.credentials, SECRET, algorithms=["HS256"])
    except Exception:
        raise HTTPException(401, "Invalid or expired token")

class Login(BaseModel):
    username: str
    password: str

class Chat(BaseModel):
    message: str
    session_id: str = "default"

class Approval(BaseModel):
    approved: bool
    session_id: str = "default"

@app.post("/login")
def login(body: Login):
    u = DEMO_USERS.get(body.username)
    if not u or u[0] != body.password:
        raise HTTPException(401, "Bad credentials")
    token = jwt.encode({"sub": body.username, "role": u[1], "exp": time.time() + 8 * 3600}, SECRET, algorithm="HS256")
    return {"token": token, "role": u[1], "username": body.username}

def sse(event, data):
    return f"event: {event}\ndata: {json.dumps(data, default=str)}\n\n"

def text_of(msg):
    c = msg.content
    if isinstance(c, str):
        return c
    return "".join(b.get("text", "") for b in c if isinstance(b, dict))

def stream_graph(inp, cfg, user, role):
    for chunk in graph.stream(inp, cfg, stream_mode="updates"):
        for node, upd in chunk.items():
            if node == "__interrupt__":
                payload = upd[0].value
                audit(user, role, "approval_requested", payload)
                yield sse("approval", payload)
                return
            if not upd:
                continue
            for t in upd.get("trace", []):
                audit(user, role, "tool_" + t["status"], t)
                yield sse("trace", t)
            if node == "agent":
                m = upd["messages"][-1]
                if not m.tool_calls:
                    yield sse("answer", {"text": text_of(m)})
    yield sse("done", {})

@app.post("/chat")
def chat(body: Chat, user=Depends(current_user)):

    cfg = {"configurable": {"thread_id": f"{user['sub']}:{body.session_id}"}, "recursion_limit": 12}
    audit(user["sub"], user["role"], "question", {"q": body.message})
    inp = {"messages": [("user", body.message)], "role": user["role"]}  # role comes from the JWT only
    return StreamingResponse(stream_graph(inp, cfg, user["sub"], user["role"]), media_type="text/event-stream")

@app.post("/approve")
def approve(body: Approval, user=Depends(current_user)):

    cfg = {"configurable": {"thread_id": f"{user['sub']}:{body.session_id}"}, "recursion_limit": 12}
    audit(user["sub"], user["role"], "approval_" + ("granted" if body.approved else "rejected"), {})
    return StreamingResponse(stream_graph(Command(resume={"approved": body.approved}), cfg, user["sub"], user["role"]),
                             media_type="text/event-stream")

@app.get("/audit")
def get_audit(user=Depends(current_user)):
    if user["role"] != "hr":
        raise HTTPException(403, "Audit log is restricted to HR/admin")
    con = sqlite3.connect(AUDIT_DB)
    rows = con.execute("SELECT ts,user,role,event,detail FROM audit ORDER BY ts DESC LIMIT 200").fetchall()
    con.close()
    return [{"ts": r[0], "user": r[1], "role": r[2], "event": r[3], "detail": json.loads(r[4])} for r in rows]