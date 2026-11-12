"""Student Result Management System - Flask REST API + static frontend."""
import os, sqlite3
from functools import wraps
from flask import Flask, request, jsonify, session, g
from werkzeug.security import generate_password_hash, check_password_hash

BASE = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE, "..", "database", "srms.db")
SCHEMA = os.path.join(BASE, "..", "database", "schema.sql")
PASS_PERCENT = 40

app = Flask(__name__, static_folder=os.path.join(BASE, "..", "frontend"), static_url_path="")
app.secret_key = os.environ.get("SECRET_KEY", "change-this-secret-before-deploying")


def init_db():
    con = sqlite3.connect(DB_PATH)
    with open(SCHEMA, encoding="utf-8") as f:
        con.executescript(f.read())
    if not con.execute("SELECT 1 FROM admins").fetchone():
        con.execute("INSERT INTO admins(username,password_hash) VALUES(?,?)",
                    ("admin", generate_password_hash("admin123")))
    con.commit(); con.close()


def db():
    if "db" not in g:
        g.db = sqlite3.connect(DB_PATH)
        g.db.row_factory = sqlite3.Row
        g.db.execute("PRAGMA foreign_keys=ON")
    return g.db


@app.teardown_appcontext
def close_db(_):
    d = g.pop("db", None)
    if d: d.close()


def admin_only(fn):
    @wraps(fn)
    def wrap(*a, **k):
        if not session.get("admin"):
            return jsonify(error="Please log in as staff."), 401
        return fn(*a, **k)
    return wrap


def err(msg, code=400):
    return jsonify(error=msg), code


def grade(p):
    for lim, g_ in ((90, "O"), (80, "A+"), (70, "A"), (60, "B"), (50, "C"), (40, "D")):
        if p >= lim: return g_
    return "F"


def result_for(roll):
    s = db().execute("SELECT * FROM students WHERE lower(roll)=lower(?)", (roll.strip(),)).fetchone()
    if not s: return None
    rows = db().execute(
        "SELECT s.code,s.name,s.max_marks,m.obtained FROM subjects s "
        "LEFT JOIN marks m ON m.code=s.code AND m.roll=? WHERE s.semester=? ORDER BY s.code",
        (s["roll"], s["semester"])).fetchall()
    total = mx = 0; ok = complete = True; out = []
    for r in rows:
        mx += r["max_marks"]; o = r["obtained"]
        if o is None:
            complete = False; st = "Pending"; gr = None
        else:
            total += o; p = o * 100 / r["max_marks"]
            st = "Pass" if p >= PASS_PERCENT else "Fail"; gr = grade(p)
            ok = ok and st == "Pass"
        out.append(dict(code=r["code"], name=r["name"], max=r["max_marks"], obtained=o, grade=gr, status=st))
    pct = round(total * 100 / mx, 2) if mx else 0
    div = "First Division" if pct >= 60 else "Second Division" if pct >= 50 else "Third Division"
    return dict(student=dict(roll=s["roll"], name=s["name"], semester=s["semester"]), rows=out,
                total=total, max=mx, percentage=pct, grade=grade(pct),
                complete=complete, passed=complete and ok, division=div)


# ---------- auth ----------
@app.post("/api/login")
def login():
    d = request.get_json(silent=True) or {}
    u = db().execute("SELECT * FROM admins WHERE username=?", (d.get("username", ""),)).fetchone()
    if not u or not check_password_hash(u["password_hash"], d.get("password", "")):
        return err("Wrong username or password.", 401)
    session["admin"] = u["username"]
    return jsonify(ok=True)


@app.post("/api/logout")
def logout():
    session.clear(); return jsonify(ok=True)


# ---------- public ----------
@app.get("/api/result/<roll>")
def public_result(roll):
    r = result_for(roll)
    return jsonify(r) if r else err("No student found with that roll number.", 404)


# ---------- students ----------
@app.get("/api/students")
@admin_only
def students():
    return jsonify([dict(r) for r in db().execute("SELECT * FROM students ORDER BY roll")])


@app.post("/api/students")
@admin_only
def add_student():
    d = request.get_json(silent=True) or {}
    roll, name = str(d.get("roll", "")).strip(), str(d.get("name", "")).strip()
    try: sem = int(d.get("semester"))
    except (TypeError, ValueError): sem = 0
    if not roll or not name or not 1 <= sem <= 6:
        return err("Enter roll number, name and a semester from 1 to 6.")
    try:
        db().execute("INSERT INTO students VALUES(?,?,?)", (roll, name, sem)); db().commit()
    except sqlite3.IntegrityError:
        return err("That roll number already exists.", 409)
    return jsonify(ok=True), 201


@app.delete("/api/students/<roll>")
@admin_only
def del_student(roll):
    db().execute("DELETE FROM students WHERE roll=?", (roll,)); db().commit()
    return jsonify(ok=True)


# ---------- subjects ----------
@app.get("/api/subjects")
@admin_only
def subjects():
    return jsonify([dict(r) for r in db().execute("SELECT * FROM subjects ORDER BY semester,code")])


@app.post("/api/subjects")
@admin_only
def add_subject():
    d = request.get_json(silent=True) or {}
    code, name = str(d.get("code", "")).strip(), str(d.get("name", "")).strip()
    try: mx, sem = int(d.get("max_marks")), int(d.get("semester"))
    except (TypeError, ValueError): mx = sem = 0
    if not code or not name or mx <= 0 or not 1 <= sem <= 6:
        return err("Enter code, name, max marks and a semester from 1 to 6.")
    try:
        db().execute("INSERT INTO subjects VALUES(?,?,?,?)", (code, name, mx, sem)); db().commit()
    except sqlite3.IntegrityError:
        return err("That subject code already exists.", 409)
    return jsonify(ok=True), 201


@app.delete("/api/subjects/<code>")
@admin_only
def del_subject(code):
    db().execute("DELETE FROM subjects WHERE code=?", (code,)); db().commit()
    return jsonify(ok=True)


# ---------- marks & results ----------
@app.get("/api/marks/<roll>")
@admin_only
def get_marks(roll):
    r = result_for(roll)
    return jsonify(r) if r else err("Student not found.", 404)


@app.put("/api/marks/<roll>")
@admin_only
def put_marks(roll):
    s = db().execute("SELECT roll FROM students WHERE roll=?", (roll,)).fetchone()
    if not s: return err("Student not found.", 404)
    data = request.get_json(silent=True) or {}
    for code, val in data.items():
        sub = db().execute("SELECT max_marks FROM subjects WHERE code=?", (code,)).fetchone()
        if not sub: return err(f"Unknown subject {code}.")
        if val in ("", None):
            db().execute("DELETE FROM marks WHERE roll=? AND code=?", (roll, code)); continue
        try: v = int(val)
        except (TypeError, ValueError): return err(f"Marks for {code} must be a number.")
        if not 0 <= v <= sub["max_marks"]:
            return err(f"Marks for {code} must be between 0 and {sub['max_marks']}.")
        db().execute("INSERT INTO marks VALUES(?,?,?) ON CONFLICT(roll,code) DO UPDATE SET obtained=excluded.obtained",
                     (roll, code, v))
    db().commit()
    return jsonify(ok=True)


@app.get("/api/results")
@admin_only
def all_results():
    return jsonify([result_for(r["roll"]) for r in db().execute("SELECT roll FROM students ORDER BY roll")])


@app.get("/")
def home():
    return app.send_static_file("index.html")


init_db()
if __name__ == "__main__":
    app.run(debug=True)
