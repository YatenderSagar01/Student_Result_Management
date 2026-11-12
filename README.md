# Student Result Management System (BCA Final Year Project)

**Stack:** HTML/CSS/JavaScript (frontend) · Python Flask (backend REST API) · SQLite (database)

## Structure
- `frontend/`  index.html, style.css, app.js
- `backend/`   app.py (API), requirements.txt
- `database/`  schema.sql (tables); srms.db is created on first run

## Run on Windows (PowerShell)

From the project root, run:

```powershell
cd .\backend
py -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe app.py
```

When Flask prints `Running on http://127.0.0.1:8000`, leave the terminal open and visit http://127.0.0.1:5000 in your browser.

If the `py` command is unavailable, use `python` instead for the version check and virtual environment creation.

Demo login: `admin` / `admin123`.
The database starts empty. Add students and subjects from the staff dashboard, then enter marks.
Set the `SECRET_KEY` environment variable before deploying.

## Grading
Pass mark 40% per subject. Grades: O 90+, A+ 80+, A 70+, B 60+, C 50+, D 40+, F below 40.
