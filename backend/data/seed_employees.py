"""
Rebuilds ONLY the raw_employees table in backend/data/company.db.
raw_tickets and audit.db are left untouched.

Run from the project root:
    python -m backend.data.seed_employees

Fictional company: Acme Technologies. All data is synthetic.
"""
import random
import sqlite3
from pathlib import Path

DB_PATH = Path(__file__).resolve().parent / "company.db"

# (department, title, min_salary, max_salary, how_many)
PLAN = [
    ("Engineering", "Intern", 24000, 32000, 4),
    ("Engineering", "Software Engineer", 70000, 105000, 7),
    ("Engineering", "Senior Engineer", 110000, 145000, 4),
    ("Engineering", "Engineering Manager", 150000, 175000, 1),
    ("HR", "HR Associate", 50000, 65000, 3),
    ("HR", "HR Manager", 85000, 110000, 2),
    ("Sales", "Sales Executive", 55000, 85000, 5),
    ("Sales", "Account Manager", 90000, 125000, 3),
    ("Sales", "Sales Director", 140000, 165000, 1),
    ("Finance", "Financial Analyst", 65000, 95000, 4),
    ("Finance", "Finance Manager", 110000, 140000, 2),
    ("Finance", "Accountant", 55000, 75000, 2),
    ("Engineering", "Data Scientist", 95000, 130000, 2),
]

FIRST = [
    "Aarav", "Ananya", "Rohan", "Priya", "Kabir", "Meera", "Vikram", "Isha",
    "Arjun", "Sneha", "Neha", "Rahul", "Tara", "Dev", "Nisha", "Karan",
    "Pooja", "Aditya", "Riya", "Siddharth", "Maya", "Imran", "Sara", "Omar",
    "Lena", "Daniel", "Grace", "Marcus", "Sofia", "Liam", "Chloe", "Noah",
    "Zara", "Ethan", "Fatima", "Jonas", "Hana", "Mateo", "Yuki", "Elena",
]
LAST = [
    "Sharma", "Patel", "Nair", "Iyer", "Kulkarni", "Deshmukh", "Verma", "Singh",
    "Reddy", "Gupta", "Mehta", "Joshi", "Khan", "Rao", "Bose", "Kapoor",
    "Smith", "Brown", "Garcia", "Chen", "Müller", "Silva", "Kim", "Costa",
    "Novak", "Haddad", "Okafor", "Lopez", "Tanaka", "Rossi",
]


def main():
    rng = random.Random(42)  # fixed seed, so the data is the same every run
    people = []
    used = set()

    for dept, title, lo, hi, count in PLAN:
        for _ in range(count):
            while True:
                name = f"{rng.choice(FIRST)} {rng.choice(LAST)}"
                if name not in used:
                    used.add(name)
                    break
            salary = round(rng.randint(lo, hi), -3)  # round to nearest 1000
            people.append((name, dept, title, salary))

    rng.shuffle(people)

    con = sqlite3.connect(DB_PATH)
    cur = con.cursor()
    cur.execute("DROP TABLE IF EXISTS raw_employees")
    cur.execute(
        """
        CREATE TABLE raw_employees (
            id INTEGER PRIMARY KEY,
            name TEXT NOT NULL,
            department TEXT NOT NULL,
            title TEXT NOT NULL,
            salary INTEGER NOT NULL,
            email TEXT NOT NULL
        )
        """
    )
    for i, (name, dept, title, salary) in enumerate(people, start=1):
        email = name.lower().replace(" ", ".").replace("ü", "u") + "@acme.test"
        cur.execute(
            "INSERT INTO raw_employees (id, name, department, title, salary, email) "
            "VALUES (?, ?, ?, ?, ?, ?)",
            (i, name, dept, title, salary, email),
        )
    con.commit()
    con.close()
    print(f"Inserted {len(people)} employees into {DB_PATH}")


if __name__ == "__main__":
    main()