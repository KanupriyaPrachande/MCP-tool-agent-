import sqlite3, re

DB = "backend/data/company.db"

# role -> table -> (column expressions, row filter)
POLICY = {
    "hr": {
        "employees": ("id, name, department, salary, email", "1=1"),
        "tickets":   ("id, title, department, status, churn_related", "1=1"),
    },
    "manager": {
        "employees": ("id, name, department, '***' AS salary, email", "department = 'Engineering'"),
        "tickets":   ("id, title, department, status, churn_related", "1=1"),
    },
    "intern": {
        "employees": ("id, name, department, '***' AS salary, '***' AS email", "department = 'Engineering'"),
        # no tickets access at all
    },
}

def allowed_tables(role: str) -> list[str]:
    return list(POLICY.get(role, {}).keys())

def run_query(role: str, sql: str, limit: int = 50):
    if role not in POLICY:
        raise PermissionError(f"Unknown role: {role}")
    if not re.match(r"^\s*select\b", sql, re.I) or ";" in sql.strip().rstrip(";"):
        raise PermissionError("Only a single SELECT statement is allowed")

    con = sqlite3.connect(f"file:{DB}?mode=ro", uri=True)

    # Per-role governed views (the "Unity Catalog" layer)
    for table, (cols, row_filter) in POLICY[role].items():
        con.execute(f"CREATE TEMP VIEW {table} AS SELECT {cols} FROM raw_{table} WHERE {row_filter}")

    # Block direct access to raw tables from user SQL (views may still read them)
    def authorizer(action, arg1, arg2, dbname, source):
        if action == sqlite3.SQLITE_READ and arg1 and arg1.startswith("raw_") and source is None:
            return sqlite3.SQLITE_DENY
        return sqlite3.SQLITE_OK
    con.set_authorizer(authorizer)

    cur = con.execute(sql)
    cols = [d[0] for d in cur.description]
    return {"columns": cols, "rows": cur.fetchmany(limit)}