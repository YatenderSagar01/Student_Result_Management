-- Student Result Management System: SQLite schema
CREATE TABLE IF NOT EXISTS admins (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS students (
  roll TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  semester INTEGER NOT NULL CHECK (semester BETWEEN 1 AND 6)
);
CREATE TABLE IF NOT EXISTS subjects (
  code TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  max_marks INTEGER NOT NULL CHECK (max_marks > 0),
  semester INTEGER NOT NULL CHECK (semester BETWEEN 1 AND 6)
);
CREATE TABLE IF NOT EXISTS marks (
  roll TEXT NOT NULL REFERENCES students(roll) ON DELETE CASCADE,
  code TEXT NOT NULL REFERENCES subjects(code) ON DELETE CASCADE,
  obtained INTEGER NOT NULL CHECK (obtained >= 0),
  PRIMARY KEY (roll, code)
);
