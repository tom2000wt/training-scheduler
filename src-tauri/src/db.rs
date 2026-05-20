use rusqlite::{Connection, Result};
use std::path::PathBuf;
use std::sync::Mutex;

pub struct Database {
    pub conn: Mutex<Connection>,
}

impl Database {
    pub fn new(app_dir: PathBuf) -> Result<Self> {
        std::fs::create_dir_all(&app_dir).ok();
        let db_path = app_dir.join("scheduler.db");
        let conn = Connection::open(db_path)?;

        conn.execute_batch("PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;")?;

        conn.execute_batch(
            "CREATE TABLE IF NOT EXISTS courses (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                subject TEXT NOT NULL,
                grade TEXT NOT NULL DEFAULT '',
                class_name TEXT NOT NULL DEFAULT '',
                classroom TEXT NOT NULL DEFAULT '',
                start_time TEXT NOT NULL,
                end_time TEXT NOT NULL,
                repeat_type TEXT NOT NULL DEFAULT 'none',
                start_date TEXT NOT NULL,
                end_date TEXT,
                color TEXT NOT NULL DEFAULT '#1890ff',
                status TEXT NOT NULL DEFAULT 'active',
                notes TEXT NOT NULL DEFAULT ''
            );

            CREATE TABLE IF NOT EXISTS schedule_exceptions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                course_id INTEGER NOT NULL,
                original_date TEXT NOT NULL,
                new_date TEXT,
                new_start_time TEXT,
                new_end_time TEXT,
                exception_type TEXT NOT NULL DEFAULT 'cancelled',
                reason TEXT NOT NULL DEFAULT '',
                FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS holidays (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                date TEXT NOT NULL UNIQUE,
                label TEXT NOT NULL DEFAULT ''
            );"
        )?;

        Ok(Database { conn: Mutex::new(conn) })
    }
}
