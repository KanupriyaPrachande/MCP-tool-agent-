from mcp.server.fastmcp import FastMCP
from backend.permissions import run_query, allowed_tables, POLICY

mcp = FastMCP("sentinel-data")

@mcp.tool()
def list_tables(user_role: str) -> list[str]:
    """List tables the current user is allowed to query."""
    return allowed_tables(user_role)

@mcp.tool()
def query_data(user_role: str, sql: str) -> dict:
    """Run a read-only SELECT on tables the user may access (employees, tickets)."""
    try:
        return run_query(user_role, sql)
    except Exception as e:
        return {"error": f"DENIED/FAILED: {e}"}

@mcp.tool()
def create_ticket(user_role: str, title: str, description: str) -> dict:
    """Create a ticket (write action - requires human approval upstream)."""
    return {"status": "created", "id": "TKT-1042", "title": title}

if __name__ == "__main__":
    mcp.run()