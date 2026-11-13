-- Student Result Management System: MySQL schema (MySQL 8.0.16+ for CHECK constraints)
-- Run:  mysql -u root -p < schema.sql
CREATE DATABASE IF NOT EXISTS srms CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE srms;

CREATE TABLE IF NOT EXISTS admins (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS students (
  roll VARCHAR(20) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  semester TINYINT NOT NULL,
  CONSTRAINT chk_student_sem CHECK (semester BETWEEN 1 AND 6)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS subjects (
  code VARCHAR(20) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  max_marks INT NOT NULL,
  semester TINYINT NOT NULL,
  CONSTRAINT chk_sub_max CHECK (max_marks > 0),
  CONSTRAINT chk_sub_sem CHECK (semester BETWEEN 1 AND 6)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS marks (
  roll VARCHAR(20) NOT NULL,
  code VARCHAR(20) NOT NULL,
  obtained INT NOT NULL,
  PRIMARY KEY (roll, code),
  CONSTRAINT chk_obtained CHECK (obtained >= 0),
  CONSTRAINT fk_marks_student FOREIGN KEY (roll) REFERENCES students(roll) ON DELETE CASCADE,
  CONSTRAINT fk_marks_subject FOREIGN KEY (code) REFERENCES subjects(code) ON DELETE CASCADE
) ENGINE=InnoDB;

