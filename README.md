# Student Result Management System (BCA Final Year Project)

**Stack:** HTML/CSS/JavaScript (frontend) · Python Flask (backend REST API) · SQLite (database)

## Structure
- `frontend/`  index.html, style.css, app.js
- `backend/`   app.py (API), requirements.txt
- `database/`  schema.sql (tables); srms.db is created on first run

## Run
```bash
cd backend
pip install -r requirements.txt
python app.py
```
Open http://127.0.0.1:5000

Demo login: `admin` / `admin123`.
The database starts empty. Add students and subjects from the staff dashboard, then enter marks.
Set the `SECRET_KEY` environment variable before deploying.

## Grading
Pass mark 40% per subject. Grades: O 90+, A+ 80+, A 70+, B 60+, C 50+, D 40+, F below 40.
