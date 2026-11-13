# Student Result Management System

**Stack:** HTML/CSS/JavaScript · Python Flask REST API · MySQL

## Project structure
- `frontend/` — static HTML, CSS, and JavaScript
- `backend/` — Flask API and `requirements.txt`
- `database/schema.sql` — MySQL database and table definitions

## Run on Windows

Requirements: Python and MySQL Server 8.0.16 or newer.

1. Start MySQL Server. In MySQL Workbench, connect to `localhost`, choose **File → Open SQL Script**, open `database/schema.sql`, then click the lightning bolt to execute it. This creates the `srms` database and tables. The schema starts without student or marks records.
2. From PowerShell at the project root, install the Python dependencies and start the app:

```powershell
cd .\backend
py -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
$env:DB_USER = "root"
$env:DB_PASSWORD = "YOUR_MYSQL_ROOT_PASSWORD"
.\.venv\Scripts\python.exe app.py
```

Replace `YOUR_MYSQL_ROOT_PASSWORD` with your local MySQL password. When Flask prints `Running on http://127.0.0.1:5000`, open that address in your browser and leave the terminal running.

The app creates the demo staff login on first run: `admin` / `admin123`. Add students and subjects through the staff dashboard, then enter marks. Set a strong `SECRET_KEY` before deploying.
