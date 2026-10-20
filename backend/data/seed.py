import sqlite3, random
con = sqlite3.connect("backend/data/company.db")
con.executescript("""
DROP TABLE IF EXISTS raw_employees; DROP TABLE IF EXISTS raw_tickets;
CREATE TABLE raw_employees(id INTEGER, name TEXT, department TEXT, salary INTEGER, email TEXT);
CREATE TABLE raw_tickets(id INTEGER, title TEXT, department TEXT, status TEXT, churn_related INTEGER);
""")
depts = ["Engineering", "HR", "Sales", "Finance"]
for i in range(1, 41):
    con.execute("INSERT INTO raw_employees VALUES (?,?,?,?,?)",
                (i, f"Employee {i}", random.choice(depts), random.randint(40, 150) * 1000, f"emp{i}@acme.test"))
for i in range(1, 31):
    con.execute("INSERT INTO raw_tickets VALUES (?,?,?,?,?)",
                (i, f"Issue {i}", random.choice(depts), random.choice(["open", "closed"]), random.randint(0, 1)))
con.commit()