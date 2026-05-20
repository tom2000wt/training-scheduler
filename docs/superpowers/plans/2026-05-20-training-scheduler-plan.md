# 培训机构教师日程行事历 — 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为K12课外辅导机构授课老师构建一款Tauri桌面日程行事历系统，支持课程管理、日历视图、Excel导入和课时统计。

**Architecture:** Tauri 2.x 作为桌面壳（Rust后端提供数据库操作和Excel解析），React + TypeScript 构建前端UI，FullCalendar 提供日历视图，SQLite 本地存储，Zustand 管理前端状态。

**Tech Stack:** Tauri 2.x, React 18, TypeScript 5, FullCalendar 6, Ant Design 5, Zustand, SQLite (rusqlite), calamine (Rust), xlsx (JS), Vite

---

## 文件结构

```
training-scheduler/
├── src-tauri/                          # Tauri Rust 后端
│   ├── Cargo.toml
│   ├── tauri.conf.json
│   ├── build.rs
│   └── src/
│       ├── main.rs                     # 入口，注册命令
│       ├── db.rs                       # SQLite 初始化 & 表创建
│       ├── models.rs                   # 数据结构定义
│       ├── commands/
│       │   ├── mod.rs
│       │   ├── courses.rs              # 课程 CRUD 命令
│       │   ├── exceptions.rs           # 调课/停课命令
│       │   ├── holidays.rs             # 假期管理命令
│       │   ├── statistics.rs           # 课时统计命令
│       │   └── excel_import.rs         # Excel导入命令
│       └── error.rs                    # 错误类型
├── src/                                # React 前端
│   ├── main.tsx                        # 入口
│   ├── App.tsx                         # 根布局
│   ├── App.css                         # 全局样式
│   ├── types/
│   │   └── index.ts                    # 所有 TypeScript 类型
│   ├── api/
│   │   └── index.ts                    # Tauri invoke 封装
│   ├── stores/
│   │   ├── calendarStore.ts            # 日历 & 课程事件状态
│   │   └── viewStore.ts               # 视图模式 & UI状态
│   ├── utils/
│   │   ├── dateUtils.ts               # 日期计算工具
│   │   └── excelExport.ts             # Excel 导出工具
│   ├── components/
│   │   ├── Layout/
│   │   │   ├── Sidebar.tsx            # 侧边栏导航
│   │   │   └── MainLayout.tsx         # 整体布局容器
│   │   ├── Calendar/
│   │   │   ├── CalendarView.tsx       # 日历容器（切换周/月/日）
│   │   │   └── CourseEventContent.tsx # 课格内展示内容
│   │   ├── Course/
│   │   │   ├── CourseForm.tsx         # 新增/编辑课程表单
│   │   │   ├── CourseDetail.tsx       # 课程详情弹窗
│   │   │   └── CourseList.tsx         # 课程列表管理
│   │   ├── Statistics/
│   │   │   └── StatisticsView.tsx     # 课时统计视图
│   │   ├── Import/
│   │   │   └── ImportExcel.tsx        # Excel导入向导
│   │   └── Settings/
│   │       └── HolidaysManager.tsx    # 假期管理
├── index.html
├── package.json
├── tsconfig.json
├── tsconfig.node.json
├── vite.config.ts
```

---

### Task 1: 项目脚手架搭建 — Tauri + React + Vite

**Files:**
- Create: 项目根目录所有配置文件

- [ ] **Step 1: 使用 create-tauri-app 创建项目**

```bash
cd D:/claude/training-scheduler
npm create tauri-app@latest . -- --template react-ts --manager npm --name training-scheduler
```

Expected: 项目目录生成，包含 src-tauri/、src/、package.json 等文件。

- [ ] **Step 2: 安装前端依赖**

```bash
cd D:/claude/training-scheduler
npm install
npm install @fullcalendar/core @fullcalendar/react @fullcalendar/daygrid @fullcalendar/timegrid @fullcalendar/interaction antd @ant-design/icons zustand xlsx
```

- [ ] **Step 3: 安装 TypeScript 类型定义**

```bash
npm install -D @types/react @types/react-dom
```

- [ ] **Step 4: 初始化 Rust 端依赖**

编辑 `src-tauri/Cargo.toml`，在 `[dependencies]` 下添加：

```toml
[dependencies]
tauri = { version = "2", features = [] }
tauri-plugin-shell = "2"
serde = { version = "1", features = ["derive"] }
serde_json = "1"
rusqlite = { version = "0.31", features = ["bundled"] }
calamine = "0.25"
chrono = { version = "0.4", features = ["serde"] }
```

- [ ] **Step 5: 验证项目可编译运行**

```bash
cd D:/claude/training-scheduler
npm run tauri dev
```

Expected: Tauri 开发窗口打开，显示默认 React 页面。

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: scaffold Tauri + React + Vite project with dependencies"
```

---

### Task 2: Rust 后端 — 数据模型与数据库初始化

**Files:**
- Create: `src-tauri/src/models.rs`
- Create: `src-tauri/src/db.rs`
- Create: `src-tauri/src/error.rs`
- Modify: `src-tauri/src/main.rs`
- Modify: `src-tauri/Cargo.toml`

- [ ] **Step 1: 定义数据模型**

```rust
// src-tauri/src/models.rs
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct Course {
    pub id: Option<i64>,
    pub subject: String,
    pub grade: String,
    pub class_name: String,
    pub classroom: String,
    pub start_time: String,       // "HH:MM"
    pub end_time: String,         // "HH:MM"
    pub repeat_type: String,      // "none" | "weekly" | "biweekly"
    pub start_date: String,       // "YYYY-MM-DD"
    pub end_date: Option<String>, // "YYYY-MM-DD"
    pub color: String,
    pub status: String,           // "active" | "archived"
    pub notes: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct ScheduleException {
    pub id: Option<i64>,
    pub course_id: i64,
    pub original_date: String,
    pub new_date: Option<String>,
    pub new_start_time: Option<String>,
    pub new_end_time: Option<String>,
    pub exception_type: String,  // "rescheduled" | "cancelled"
    pub reason: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct Holiday {
    pub id: Option<i64>,
    pub date: String,
    pub label: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct WorkHour {
    pub id: Option<i64>,
    pub course_id: i64,
    pub date: String,
    pub hours: f64,
    pub subject: String,
    pub grade: String,
    pub class_name: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct StatisticsQuery {
    pub start_date: String,
    pub end_date: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct StatisticsResult {
    pub subject: String,
    pub grade: String,
    pub total_hours: f64,
    pub course_count: i64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct ImportPreview {
    pub courses: Vec<Course>,
    pub conflicts: Vec<ConflictInfo>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct ConflictInfo {
    pub course_a: String,
    pub course_b: String,
    pub conflict_type: String,
    pub description: String,
}
```

- [ ] **Step 2: 定义错误类型**

```rust
// src-tauri/src/error.rs
use std::fmt;

#[derive(Debug)]
pub enum AppError {
    Database(rusqlite::Error),
    NotFound(String),
    Conflict(String),
    Excel(String),
}

impl fmt::Display for AppError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            AppError::Database(e) => write!(f, "数据库错误: {}", e),
            AppError::NotFound(msg) => write!(f, "{}", msg),
            AppError::Conflict(msg) => write!(f, "{}", msg),
            AppError::Excel(msg) => write!(f, "Excel错误: {}", msg),
        }
    }
}

impl From<rusqlite::Error> for AppError {
    fn from(e: rusqlite::Error) -> Self {
        AppError::Database(e)
    }
}

impl From<calamine::Error> for AppError {
    fn from(e: calamine::Error) -> Self {
        AppError::Excel(e.to_string())
    }
}

impl serde::Serialize for AppError {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        serializer.serialize_str(&self.to_string())
    }
}
```

- [ ] **Step 3: 实现数据库初始化**

```rust
// src-tauri/src/db.rs
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
```

- [ ] **Step 4: 修改 main.rs 注册 Database 为 Tauri 状态**

```rust
// src-tauri/src/main.rs
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod commands;
mod db;
mod error;
mod models;

use db::Database;
use std::path::PathBuf;

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            let app_dir: PathBuf = app
                .path()
                .app_data_dir()
                .unwrap_or_else(|_| PathBuf::from("."));
            let database =
                Database::new(app_dir).expect("Failed to initialize database");
            app.manage(database);
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::courses::get_courses,
            commands::courses::create_course,
            commands::courses::update_course,
            commands::courses::delete_course,
            commands::exceptions::get_exceptions,
            commands::exceptions::create_exception,
            commands::exceptions::delete_exception,
            commands::holidays::get_holidays,
            commands::holidays::create_holiday,
            commands::holidays::delete_holiday,
            commands::holidays::batch_create_holidays,
            commands::statistics::get_statistics,
            commands::excel_import::preview_excel_import,
            commands::excel_import::execute_excel_import,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

- [ ] **Step 5: Commit**

```bash
git add src-tauri/src/models.rs src-tauri/src/db.rs src-tauri/src/error.rs src-tauri/src/main.rs src-tauri/Cargo.toml
git commit -m "feat: add Rust data models and SQLite database initialization"
```

---

### Task 3: Rust 后端 — 课程 CRUD 命令

**Files:**
- Create: `src-tauri/src/commands/mod.rs`
- Create: `src-tauri/src/commands/courses.rs`

- [ ] **Step 1: 创建 commands 模块注册文件**

```rust
// src-tauri/src/commands/mod.rs
pub mod courses;
pub mod exceptions;
pub mod holidays;
pub mod statistics;
pub mod excel_import;
```

- [ ] **Step 2: 实现课程 CRUD 命令**

```rust
// src-tauri/src/commands/courses.rs
use crate::db::Database;
use crate::models::Course;
use tauri::State;

#[tauri::command]
pub fn get_courses(db: State<Database>) -> Result<Vec<Course>, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn
        .prepare("SELECT id, subject, grade, class_name, classroom, start_time, end_time, repeat_type, start_date, end_date, color, status, notes FROM courses WHERE status = 'active'")
        .map_err(|e| e.to_string())?;

    let courses = stmt
        .query_map([], |row| {
            Ok(Course {
                id: Some(row.get(0)?),
                subject: row.get(1)?,
                grade: row.get(2)?,
                class_name: row.get(3)?,
                classroom: row.get(4)?,
                start_time: row.get(5)?,
                end_time: row.get(6)?,
                repeat_type: row.get(7)?,
                start_date: row.get(8)?,
                end_date: row.get(9)?,
                color: row.get(10)?,
                status: row.get(11)?,
                notes: row.get(12)?,
            })
        })
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;

    Ok(courses)
}

#[tauri::command]
pub fn create_course(db: State<Database>, course: Course) -> Result<Course, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    conn.execute(
        "INSERT INTO courses (subject, grade, class_name, classroom, start_time, end_time, repeat_type, start_date, end_date, color, status, notes) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12)",
        rusqlite::params![
            course.subject,
            course.grade,
            course.class_name,
            course.classroom,
            course.start_time,
            course.end_time,
            course.repeat_type,
            course.start_date,
            course.end_date,
            course.color,
            course.status,
            course.notes,
        ],
    )
    .map_err(|e| e.to_string())?;

    let id = conn.last_insert_rowid();
    Ok(Course {
        id: Some(id),
        ..course
    })
}

#[tauri::command]
pub fn update_course(db: State<Database>, course: Course) -> Result<(), String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    let id = course.id.ok_or("课程ID不能为空")?;
    conn.execute(
        "UPDATE courses SET subject=?1, grade=?2, class_name=?3, classroom=?4, start_time=?5, end_time=?6, repeat_type=?7, start_date=?8, end_date=?9, color=?10, status=?11, notes=?12 WHERE id=?13",
        rusqlite::params![
            course.subject,
            course.grade,
            course.class_name,
            course.classroom,
            course.start_time,
            course.end_time,
            course.repeat_type,
            course.start_date,
            course.end_date,
            course.color,
            course.status,
            course.notes,
            id,
        ],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn delete_course(db: State<Database>, id: i64) -> Result<(), String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    conn.execute("UPDATE courses SET status='archived' WHERE id=?1", [id])
        .map_err(|e| e.to_string())?;
    Ok(())
}
```

- [ ] **Step 3: Commit**

```bash
git add src-tauri/src/commands/
git commit -m "feat: add course CRUD Tauri commands"
```

---

### Task 4: Rust 后端 — 调课/停课 & 假期命令

**Files:**
- Create: `src-tauri/src/commands/exceptions.rs`
- Create: `src-tauri/src/commands/holidays.rs`

- [ ] **Step 1: 实现调课/停课命令**

```rust
// src-tauri/src/commands/exceptions.rs
use crate::db::Database;
use crate::models::ScheduleException;
use tauri::State;

#[tauri::command]
pub fn get_exceptions(
    db: State<Database>,
    course_id: i64,
) -> Result<Vec<ScheduleException>, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn
        .prepare(
            "SELECT id, course_id, original_date, new_date, new_start_time, new_end_time, exception_type, reason FROM schedule_exceptions WHERE course_id=?1",
        )
        .map_err(|e| e.to_string())?;

    let exceptions = stmt
        .query_map([course_id], |row| {
            Ok(ScheduleException {
                id: Some(row.get(0)?),
                course_id: row.get(1)?,
                original_date: row.get(2)?,
                new_date: row.get(3)?,
                new_start_time: row.get(4)?,
                new_end_time: row.get(5)?,
                exception_type: row.get(6)?,
                reason: row.get(7)?,
            })
        })
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;

    Ok(exceptions)
}

#[tauri::command]
pub fn create_exception(
    db: State<Database>,
    exception: ScheduleException,
) -> Result<ScheduleException, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    conn.execute(
        "INSERT INTO schedule_exceptions (course_id, original_date, new_date, new_start_time, new_end_time, exception_type, reason) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
        rusqlite::params![
            exception.course_id,
            exception.original_date,
            exception.new_date,
            exception.new_start_time,
            exception.new_end_time,
            exception.exception_type,
            exception.reason,
        ],
    )
    .map_err(|e| e.to_string())?;

    let id = conn.last_insert_rowid();
    Ok(ScheduleException {
        id: Some(id),
        ..exception
    })
}

#[tauri::command]
pub fn delete_exception(db: State<Database>, id: i64) -> Result<(), String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    conn.execute("DELETE FROM schedule_exceptions WHERE id=?1", [id])
        .map_err(|e| e.to_string())?;
    Ok(())
}
```

- [ ] **Step 2: 实现假期管理命令**

```rust
// src-tauri/src/commands/holidays.rs
use crate::db::Database;
use crate::models::Holiday;
use tauri::State;

#[tauri::command]
pub fn get_holidays(db: State<Database>) -> Result<Vec<Holiday>, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn
        .prepare("SELECT id, date, label FROM holidays ORDER BY date")
        .map_err(|e| e.to_string())?;

    let holidays = stmt
        .query_map([], |row| {
            Ok(Holiday {
                id: Some(row.get(0)?),
                date: row.get(1)?,
                label: row.get(2)?,
            })
        })
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;

    Ok(holidays)
}

#[tauri::command]
pub fn create_holiday(
    db: State<Database>,
    holiday: Holiday,
) -> Result<Holiday, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    conn.execute(
        "INSERT OR IGNORE INTO holidays (date, label) VALUES (?1, ?2)",
        rusqlite::params![holiday.date, holiday.label],
    )
    .map_err(|e| e.to_string())?;

    let id = conn.last_insert_rowid();
    Ok(Holiday {
        id: Some(id),
        ..holiday
    })
}

#[tauri::command]
pub fn delete_holiday(db: State<Database>, id: i64) -> Result<(), String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    conn.execute("DELETE FROM holidays WHERE id=?1", [id])
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn batch_create_holidays(
    db: State<Database>,
    holidays: Vec<Holiday>,
) -> Result<usize, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    let mut count = 0;
    for h in &holidays {
        let rows = conn
            .execute(
                "INSERT OR IGNORE INTO holidays (date, label) VALUES (?1, ?2)",
                rusqlite::params![h.date, h.label],
            )
            .map_err(|e| e.to_string())?;
        count += rows;
    }
    Ok(count)
}
```

- [ ] **Step 3: Commit**

```bash
git add src-tauri/src/commands/exceptions.rs src-tauri/src/commands/holidays.rs
git commit -m "feat: add schedule exceptions and holidays Tauri commands"
```

---

### Task 5: Rust 后端 — 课时统计 & Excel 导入命令

**Files:**
- Create: `src-tauri/src/commands/statistics.rs`
- Create: `src-tauri/src/commands/excel_import.rs`

- [ ] **Step 1: 实现课时统计命令**

```rust
// src-tauri/src/commands/statistics.rs
use crate::db::Database;
use crate::models::{StatisticsQuery, StatisticsResult};
use tauri::State;

#[tauri::command]
pub fn get_statistics(
    db: State<Database>,
    query: StatisticsQuery,
) -> Result<Vec<StatisticsResult>, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn
        .prepare(
            "SELECT subject, grade,
                COUNT(*) as course_count,
                SUM(
                    (julianday(end_date) - julianday(start_date)) / 7.0 *
                    (julianday(substr(end_time,1,5)) - julianday('2000-01-01 ' || substr(start_time,1,5))) * 24.0
                ) as total_hours
             FROM courses
             WHERE status = 'active'
               AND start_date <= ?2
               AND (end_date IS NULL OR end_date >= ?1)
             GROUP BY subject, grade
             ORDER BY subject, grade",
        )
        .map_err(|e| e.to_string())?;

    let results = stmt
        .query_map(
            rusqlite::params![query.start_date, query.end_date],
            |row| {
                Ok(StatisticsResult {
                    subject: row.get(0)?,
                    grade: row.get(1)?,
                    total_hours: row.get::<_, f64>(2)?,
                    course_count: row.get(3)?,
                })
            },
        )
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;

    Ok(results)
}
```

- [ ] **Step 2: 实现 Excel 导入命令**

```rust
// src-tauri/src/commands/excel_import.rs
use crate::db::Database;
use crate::models::{ConflictInfo, Course, ImportPreview};
use calamine::{open_workbook, Reader, Xlsx};
use tauri::State;

fn read_courses_from_excel(path: &str) -> Result<Vec<Course>, String> {
    let mut workbook: Xlsx<_> =
        open_workbook(path).map_err(|e| format!("无法打开Excel文件: {}", e))?;

    let sheet_name = workbook
        .sheet_names()
        .first()
        .cloned()
        .ok_or("Excel文件中没有工作表")?;

    let range = workbook
        .worksheet_range(&sheet_name)
        .map_err(|e| format!("无法读取工作表: {}", e))?;

    let mut courses = Vec::new();
    let mut rows = range.rows();

    rows.next(); // 跳过表头

    let colors = ["#1890ff", "#52c41a", "#fa8c16", "#722ed1", "#eb2f96", "#13c2c2"];

    for (i, row) in rows.enumerate() {
        if row.len() < 8 {
            continue;
        }

        let get_cell = |idx: usize| -> String {
            row.get(idx)
                .map(|c| c.to_string().trim().to_string())
                .unwrap_or_default()
        };

        let course = Course {
            id: None,
            subject: get_cell(0),
            grade: get_cell(1),
            class_name: get_cell(2),
            classroom: get_cell(3),
            start_time: get_cell(4),
            end_time: get_cell(5),
            repeat_type: get_cell(6),
            start_date: get_cell(7),
            end_date: {
                let s = get_cell(8);
                if s.is_empty() { None } else { Some(s) }
            },
            color: colors[i % colors.len()].to_string(),
            status: "active".to_string(),
            notes: get_cell(9),
        };
        courses.push(course);
    }

    Ok(courses)
}

fn detect_conflicts(courses: &[Course], existing: &[Course]) -> Vec<ConflictInfo> {
    let mut conflicts = Vec::new();

    for (i, a) in courses.iter().enumerate() {
        for (j, b) in courses.iter().enumerate() {
            if i >= j { continue; }
            if a.start_date == b.start_date
                && a.start_time == b.start_time
                && a.classroom == b.classroom
            {
                conflicts.push(ConflictInfo {
                    course_a: format!("{}-{}", a.subject, a.class_name),
                    course_b: format!("{}-{}", b.subject, b.class_name),
                    conflict_type: "教室冲突".to_string(),
                    description: format!(
                        "{} {} 教室 {} 与 {} 时间重叠",
                        a.start_date, a.start_time, a.classroom, b.subject
                    ),
                });
            }
        }
    }

    for new_course in courses {
        for existing_course in existing {
            if existing_course.start_date == new_course.start_date
                && existing_course.start_time == new_course.start_time
                && existing_course.classroom == new_course.classroom
            {
                conflicts.push(ConflictInfo {
                    course_a: format!("{}-{}", new_course.subject, new_course.class_name),
                    course_b: format!("{}-{}", existing_course.subject, existing_course.class_name),
                    conflict_type: "与现有课程冲突".to_string(),
                    description: format!(
                        "新课程与现有课程 {} {} 在教室 {} 冲突",
                        existing_course.subject, existing_course.start_date, existing_course.classroom
                    ),
                });
            }
        }
    }

    conflicts
}

#[tauri::command]
pub fn preview_excel_import(
    db: State<Database>,
    file_path: String,
) -> Result<ImportPreview, String> {
    let courses = read_courses_from_excel(&file_path)?;

    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn
        .prepare(
            "SELECT id, subject, grade, class_name, classroom, start_time, end_time, repeat_type, start_date, end_date, color, status, notes FROM courses WHERE status = 'active'",
        )
        .map_err(|e| e.to_string())?;

    let existing = stmt
        .query_map([], |row| {
            Ok(Course {
                id: Some(row.get(0)?),
                subject: row.get(1)?,
                grade: row.get(2)?,
                class_name: row.get(3)?,
                classroom: row.get(4)?,
                start_time: row.get(5)?,
                end_time: row.get(6)?,
                repeat_type: row.get(7)?,
                start_date: row.get(8)?,
                end_date: row.get(9)?,
                color: row.get(10)?,
                status: row.get(11)?,
                notes: row.get(12)?,
            })
        })
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;

    let conflicts = detect_conflicts(&courses, &existing);

    Ok(ImportPreview { courses, conflicts })
}

#[tauri::command]
pub fn execute_excel_import(
    db: State<Database>,
    file_path: String,
    mode: String, // "append" | "replace"
) -> Result<usize, String> {
    let courses = read_courses_from_excel(&file_path)?;
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    if mode == "replace" {
        conn.execute("UPDATE courses SET status='archived' WHERE status='active'", [])
            .map_err(|e| e.to_string())?;
    }

    let mut count = 0;
    for course in &courses {
        conn.execute(
            "INSERT INTO courses (subject, grade, class_name, classroom, start_time, end_time, repeat_type, start_date, end_date, color, status, notes) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12)",
            rusqlite::params![
                course.subject,
                course.grade,
                course.class_name,
                course.classroom,
                course.start_time,
                course.end_time,
                course.repeat_type,
                course.start_date,
                course.end_date,
                course.color,
                course.status,
                course.notes,
            ],
        )
        .map_err(|e| e.to_string())?;
        count += 1;
    }

    Ok(count)
}
```

- [ ] **Step 3: Commit**

```bash
git add src-tauri/src/commands/statistics.rs src-tauri/src/commands/excel_import.rs
git commit -m "feat: add statistics and Excel import Tauri commands"
```

---

### Task 6: 前端 — TypeScript 类型 & API 封装

**Files:**
- Create: `src/types/index.ts`
- Create: `src/api/index.ts`

- [ ] **Step 1: 定义前端类型**

```typescript
// src/types/index.ts
export interface Course {
  id?: number;
  subject: string;
  grade: string;
  className: string;
  classroom: string;
  startTime: string;
  endTime: string;
  repeatType: 'none' | 'weekly' | 'biweekly';
  startDate: string;
  endDate?: string;
  color: string;
  status: 'active' | 'archived';
  notes: string;
}

export interface ScheduleException {
  id?: number;
  courseId: number;
  originalDate: string;
  newDate?: string;
  newStartTime?: string;
  newEndTime?: string;
  exceptionType: 'rescheduled' | 'cancelled';
  reason: string;
}

export interface Holiday {
  id?: number;
  date: string;
  label: string;
}

export interface StatisticsQuery {
  startDate: string;
  endDate: string;
}

export interface StatisticsResult {
  subject: string;
  grade: string;
  totalHours: number;
  courseCount: number;
}

export interface ImportPreview {
  courses: Course[];
  conflicts: ConflictInfo[];
}

export interface ConflictInfo {
  courseA: string;
  courseB: string;
  conflictType: string;
  description: string;
}

export type ViewMode = 'day' | 'week' | 'month';
export type SidebarTab = 'calendar' | 'courses' | 'statistics' | 'import' | 'settings';
```

- [ ] **Step 2: 封装 Tauri invoke 调用**

```typescript
// src/api/index.ts
import { invoke } from '@tauri-apps/api/core';
import type {
  Course,
  ScheduleException,
  Holiday,
  StatisticsQuery,
  StatisticsResult,
  ImportPreview,
} from '../types';

export const api = {
  // Courses
  getCourses: () => invoke<Course[]>('get_courses'),
  createCourse: (course: Course) => invoke<Course>('create_course', { course }),
  updateCourse: (course: Course) => invoke<void>('update_course', { course }),
  deleteCourse: (id: number) => invoke<void>('delete_course', { id }),

  // Exceptions
  getExceptions: (courseId: number) =>
    invoke<ScheduleException[]>('get_exceptions', { courseId }),
  createException: (exception: ScheduleException) =>
    invoke<ScheduleException>('create_exception', { exception }),
  deleteException: (id: number) => invoke<void>('delete_exception', { id }),

  // Holidays
  getHolidays: () => invoke<Holiday[]>('get_holidays'),
  createHoliday: (holiday: Holiday) => invoke<Holiday>('create_holiday', { holiday }),
  deleteHoliday: (id: number) => invoke<void>('delete_holiday', { id }),
  batchCreateHolidays: (holidays: Holiday[]) =>
    invoke<number>('batch_create_holidays', { holidays }),

  // Statistics
  getStatistics: (query: StatisticsQuery) =>
    invoke<StatisticsResult[]>('get_statistics', { query }),

  // Excel import
  previewExcelImport: (filePath: string) =>
    invoke<ImportPreview>('preview_excel_import', { filePath }),
  executeExcelImport: (filePath: string, mode: 'append' | 'replace') =>
    invoke<number>('execute_excel_import', { filePath, mode }),
};
```

- [ ] **Step 3: Commit**

```bash
git add src/types/index.ts src/api/index.ts
git commit -m "feat: add TypeScript types and Tauri API wrapper"
```

---

### Task 7: 前端 — 日期工具 & Zustand 状态管理

**Files:**
- Create: `src/utils/dateUtils.ts`
- Create: `src/stores/viewStore.ts`
- Create: `src/stores/calendarStore.ts`

- [ ] **Step 1: 实现日期工具函数**

```typescript
// src/utils/dateUtils.ts
export function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function parseDate(str: string): Date {
  return new Date(str + 'T00:00:00');
}

export function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day; // 周一开始
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function getWeekEnd(date: Date): Date {
  const start = getWeekStart(date);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  return end;
}

export function getMonthStart(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function getMonthEnd(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function addWeeks(date: Date, weeks: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + weeks * 7);
  return d;
}

export function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

export function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

export function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function calculateHours(startTime: string, endTime: string): number {
  const start = timeToMinutes(startTime);
  const end = timeToMinutes(endTime);
  return (end - start) / 60;
}
```

- [ ] **Step 2: 视图状态 Store**

```typescript
// src/stores/viewStore.ts
import { create } from 'zustand';
import type { ViewMode, SidebarTab } from '../types';

interface ViewState {
  currentTab: SidebarTab;
  viewMode: ViewMode;
  currentDate: string; // ISO date string
  setTab: (tab: SidebarTab) => void;
  setViewMode: (mode: ViewMode) => void;
  setCurrentDate: (date: string) => void;
}

export const useViewStore = create<ViewState>((set) => ({
  currentTab: 'calendar',
  viewMode: 'week',
  currentDate: new Date().toISOString().slice(0, 10),
  setTab: (tab) => set({ currentTab: tab }),
  setViewMode: (mode) => set({ viewMode: mode }),
  setCurrentDate: (date) => set({ currentDate: date }),
}));
```

- [ ] **Step 3: 日历数据 Store**

```typescript
// src/stores/calendarStore.ts
import { create } from 'zustand';
import { api } from '../api';
import type { Course, ScheduleException, Holiday } from '../types';

interface CalendarState {
  courses: Course[];
  exceptions: Map<number, ScheduleException[]>;
  holidays: Holiday[];
  loading: boolean;

  loadCourses: () => Promise<void>;
  loadHolidays: () => Promise<void>;
  addCourse: (course: Course) => Promise<Course>;
  updateCourse: (course: Course) => Promise<void>;
  removeCourse: (id: number) => Promise<void>;
  addException: (exception: ScheduleException) => Promise<void>;
  removeException: (id: number) => Promise<void>;
  addHoliday: (holiday: Holiday) => Promise<void>;
  removeHoliday: (id: number) => Promise<void>;
}

export const useCalendarStore = create<CalendarState>((set, get) => ({
  courses: [],
  exceptions: new Map(),
  holidays: [],
  loading: false,

  loadCourses: async () => {
    set({ loading: true });
    const courses = await api.getCourses();
    set({ courses, loading: false });
  },

  loadHolidays: async () => {
    const holidays = await api.getHolidays();
    set({ holidays });
  },

  addCourse: async (course) => {
    const created = await api.createCourse(course);
    set((s) => ({ courses: [...s.courses, created] }));
    return created;
  },

  updateCourse: async (course) => {
    await api.updateCourse(course);
    set((s) => ({
      courses: s.courses.map((c) => (c.id === course.id ? course : c)),
    }));
  },

  removeCourse: async (id) => {
    await api.deleteCourse(id);
    set((s) => ({
      courses: s.courses.filter((c) => c.id !== id),
    }));
  },

  addException: async (exception) => {
    const created = await api.createException(exception);
    set((s) => {
      const m = new Map(s.exceptions);
      const list = m.get(exception.courseId) || [];
      list.push(created);
      m.set(exception.courseId, list);
      return { exceptions: m };
    });
  },

  removeException: async (id) => {
    await api.deleteException(id);
    set((s) => {
      const m = new Map(s.exceptions);
      for (const [key, list] of m) {
        m.set(
          key,
          list.filter((e) => e.id !== id),
        );
      }
      return { exceptions: m };
    });
  },

  addHoliday: async (holiday) => {
    const created = await api.createHoliday(holiday);
    set((s) => ({ holidays: [...s.holidays, created] }));
  },

  removeHoliday: async (id) => {
    await api.deleteHoliday(id);
    set((s) => ({
      holidays: s.holidays.filter((h) => h.id !== id),
    }));
  },
}));
```

- [ ] **Step 4: Commit**

```bash
git add src/utils/dateUtils.ts src/stores/viewStore.ts src/stores/calendarStore.ts
git commit -m "feat: add date utilities and Zustand stores"
```

---

### Task 8: 前端 — 布局组件 & 侧边栏

**Files:**
- Create: `src/components/Layout/MainLayout.tsx`
- Create: `src/components/Layout/Sidebar.tsx`
- Modify: `src/App.tsx`
- Modify: `src/App.css`

- [ ] **Step 1: 全局样式**

```css
/* src/App.css */
* { margin: 0; padding: 0; box-sizing: border-box; }

html, body, #root {
  height: 100%;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.app-layout {
  display: flex;
  height: 100vh;
  overflow: hidden;
}

.app-sidebar {
  width: 200px;
  min-width: 200px;
  background: #001529;
  color: #fff;
  display: flex;
  flex-direction: column;
  user-select: none;
}

.app-sidebar-header {
  padding: 20px 16px;
  font-size: 16px;
  font-weight: 600;
  border-bottom: 1px solid rgba(255,255,255,0.1);
  text-align: center;
}

.app-sidebar-menu {
  flex: 1;
  padding: 8px 0;
}

.app-sidebar-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 24px;
  cursor: pointer;
  color: rgba(255,255,255,0.65);
  transition: all 0.2s;
  font-size: 14px;
}

.app-sidebar-item:hover {
  color: #fff;
  background: rgba(255,255,255,0.08);
}

.app-sidebar-item.active {
  color: #fff;
  background: #1890ff;
}

.app-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: #f0f2f5;
}

.app-main-header {
  padding: 16px 24px;
  background: #fff;
  border-bottom: 1px solid #e8e8e8;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.app-main-content {
  flex: 1;
  overflow: auto;
  padding: 16px 24px;
}
```

- [ ] **Step 2: 侧边栏组件**

```tsx
// src/components/Layout/Sidebar.tsx
import {
  CalendarOutlined,
  BookOutlined,
  BarChartOutlined,
  ImportOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { useViewStore } from '../../stores/viewStore';
import type { SidebarTab } from '../../types';

const menuItems: { key: SidebarTab; label: string; icon: React.ReactNode }[] = [
  { key: 'calendar', label: '日历视图', icon: <CalendarOutlined /> },
  { key: 'courses', label: '课程管理', icon: <BookOutlined /> },
  { key: 'statistics', label: '课时统计', icon: <BarChartOutlined /> },
  { key: 'import', label: '导入Excel', icon: <ImportOutlined /> },
  { key: 'settings', label: '设置', icon: <SettingOutlined /> },
];

export default function Sidebar() {
  const { currentTab, setTab } = useViewStore();

  return (
    <div className="app-sidebar">
      <div className="app-sidebar-header">教师日程系统</div>
      <div className="app-sidebar-menu">
        {menuItems.map((item) => (
          <div
            key={item.key}
            className={`app-sidebar-item ${currentTab === item.key ? 'active' : ''}`}
            onClick={() => setTab(item.key)}
          >
            {item.icon}
            <span>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: 主布局组件**

```tsx
// src/components/Layout/MainLayout.tsx
import { useViewStore } from '../../stores/viewStore';

const titles: Record<string, string> = {
  calendar: '日历视图',
  courses: '课程管理',
  statistics: '课时统计',
  import: '导入Excel',
  settings: '设置',
};

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const { currentTab } = useViewStore();

  return (
    <div className="app-main">
      <div className="app-main-header">
        <h2 style={{ margin: 0, fontSize: 18 }}>{titles[currentTab]}</h2>
      </div>
      <div className="app-main-content">{children}</div>
    </div>
  );
}
```

- [ ] **Step 4: 组装 App.tsx**

```tsx
// src/App.tsx
import { useEffect } from 'react';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import Sidebar from './components/Layout/Sidebar';
import MainLayout from './components/Layout/MainLayout';
import CalendarView from './components/Calendar/CalendarView';
import CourseList from './components/Course/CourseList';
import StatisticsView from './components/Statistics/StatisticsView';
import ImportExcel from './components/Import/ImportExcel';
import HolidaysManager from './components/Settings/HolidaysManager';
import { useViewStore } from './stores/viewStore';
import { useCalendarStore } from './stores/calendarStore';
import './App.css';

const renderContent = () => {
  const tab = useViewStore((s) => s.currentTab);
  switch (tab) {
    case 'calendar': return <CalendarView />;
    case 'courses': return <CourseList />;
    case 'statistics': return <StatisticsView />;
    case 'import': return <ImportExcel />;
    case 'settings': return <HolidaysManager />;
  }
};

function App() {
  const { loadCourses, loadHolidays } = useCalendarStore();

  useEffect(() => {
    loadCourses();
    loadHolidays();
  }, []);

  return (
    <ConfigProvider locale={zhCN}>
      <div className="app-layout">
        <Sidebar />
        <MainLayout>{renderContent()}</MainLayout>
      </div>
    </ConfigProvider>
  );
}

export default App;
```

- [ ] **Step 5: Commit**

```bash
git add src/App.tsx src/App.css src/components/Layout/
git commit -m "feat: add app layout with sidebar navigation"
```

---

### Task 9: 前端 — 日历视图组件

**Files:**
- Create: `src/components/Calendar/CalendarView.tsx`
- Create: `src/components/Calendar/CourseEventContent.tsx`

- [ ] **Step 1: 课格内容组件**

```tsx
// src/components/Calendar/CourseEventContent.tsx
interface Props {
  subject: string;
  classroom: string;
  grade: string;
  className: string;
}

export default function CourseEventContent({ subject, classroom, grade, className }: Props) {
  return (
    <div style={{ padding: '2px 4px', fontSize: 12, lineHeight: '18px', overflow: 'hidden' }}>
      <div style={{ fontWeight: 600 }}>{subject}</div>
      <div>{classroom}</div>
      <div style={{ color: 'rgba(0,0,0,0.45)', fontSize: 11 }}>
        {grade}{className} {grade}{className ? '' : ''}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: 日历视图组件（集成 FullCalendar）**

```tsx
// src/components/Calendar/CalendarView.tsx
import { useMemo, useCallback, useRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import type { EventInput, EventClickArg, EventDropArg } from '@fullcalendar/core';
import zhLocale from '@fullcalendar/core/locales/zh-cn';
import { useCalendarStore } from '../../stores/calendarStore';
import { useViewStore } from '../../stores/viewStore';
import { parseDate, addWeeks, addMonths, addDays as addDaysUtil } from '../../utils/dateUtils';
import CourseDetail from '../Course/CourseDetail';
import type { Course } from '../../types';
import { useState } from 'react';
import { Modal } from 'antd';

function generateEvents(
  courses: Course[],
  holidays: Set<string>,
): EventInput[] {
  const events: EventInput[] = [];

  for (const course of courses) {
    if (course.status !== 'active') continue;
    const startDate = parseDate(course.startDate);
    const endDate = course.endDate
      ? parseDate(course.endDate)
      : addMonths(startDate, 6); // 默认半年

    let current = new Date(startDate);
    while (current <= endDate) {
      const dateStr = current.toISOString().slice(0, 10);
      if (!holidays.has(dateStr)) {
        events.push({
          id: `${course.id}-${dateStr}`,
          title: course.subject,
          start: `${dateStr}T${course.startTime}`,
          end: `${dateStr}T${course.endTime}`,
          backgroundColor: course.color,
          borderColor: course.color,
          textColor: '#fff',
          extendedProps: {
            courseId: course.id,
            classroom: course.classroom,
            grade: course.grade,
            className: course.className,
          },
        });
      }

      if (course.repeatType === 'weekly') {
        current = addWeeks(current, 1);
      } else if (course.repeatType === 'biweekly') {
        current = addWeeks(current, 2);
      } else {
        break;
      }
    }
  }

  return events;
}

export default function CalendarView() {
  const calendarRef = useRef<FullCalendar>(null);
  const { courses, holidays, updateCourse } = useCalendarStore();
  const { viewMode, currentDate, setCurrentDate, setViewMode } = useViewStore();
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const holidaySet = useMemo(
    () => new Set(holidays.map((h) => h.date)),
    [holidays],
  );

  const events = useMemo(
    () => generateEvents(courses, holidaySet),
    [courses, holidaySet],
  );

  const handleEventClick = useCallback(
    (arg: EventClickArg) => {
      const courseId = arg.event.extendedProps['courseId'] as number;
      const course = courses.find((c) => c.id === courseId);
      if (course) {
        setSelectedCourse(course);
        setDetailOpen(true);
      }
    },
    [courses],
  );

  const handleEventDrop = useCallback(
    async (arg: EventDropArg) => {
      const courseId = arg.event.extendedProps['courseId'] as number;
      const course = courses.find((c) => c.id === courseId);
      if (!course) return;

      const oldStart = arg.oldEvent.start;
      const newStart = arg.event.start;
      if (!oldStart || !newStart) return;

      const newStartTime = newStart.toTimeString().slice(0, 5);
      const newEndTime = arg.event.end
        ? arg.event.end.toTimeString().slice(0, 5)
        : course.endTime;

      Modal.confirm({
        title: '确认调课',
        content: `将 ${course.subject} 调整到 ${newStart.toLocaleDateString()} ${newStartTime}-${newEndTime}？`,
        onOk: async () => {
          const updated = {
            ...course,
            startTime: newStartTime,
            endTime: newEndTime,
            startDate: newStart.toISOString().slice(0, 10),
          };
          await updateCourse(updated);
        },
        onCancel: () => arg.revert(),
      });
    },
    [courses, updateCourse],
  );

  return (
    <div style={{ height: '100%', background: '#fff', borderRadius: 8, padding: 16 }}>
      <FullCalendar
        ref={calendarRef}
        plugins={[timeGridPlugin, dayGridPlugin, interactionPlugin]}
        initialView={viewMode === 'day' ? 'timeGridDay' : viewMode === 'week' ? 'timeGridWeek' : 'dayGridMonth'}
        locale={zhLocale}
        events={events}
        editable={true}
        eventDurationEditable={false}
        allDaySlot={false}
        slotMinTime="07:00:00"
        slotMaxTime="22:00:00"
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'timeGridDay,timeGridWeek,dayGridMonth',
        }}
        height="100%"
        eventClick={handleEventClick}
        eventDrop={handleEventDrop}
        datesSet={(arg) => {
          setCurrentDate(arg.start.toISOString().slice(0, 10));
          const viewType = arg.view.type;
          if (viewType === 'timeGridDay') setViewMode('day');
          else if (viewType === 'timeGridWeek') setViewMode('week');
          else setViewMode('month');
        }}
        buttonText={{
          today: '今天',
          day: '日',
          week: '周',
          month: '月',
        }}
        eventContent={(arg) => {
          const props = arg.event.extendedProps;
          return (
            <CourseEventContent
              subject={arg.event.title}
              classroom={props['classroom'] as string}
              grade={props['grade'] as string}
              className={props['className'] as string}
            />
          );
        }}
      />

      <CourseDetail
        course={selectedCourse}
        open={detailOpen}
        onClose={() => {
          setDetailOpen(false);
          setSelectedCourse(null);
        }}
      />
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/Calendar/
git commit -m "feat: add calendar view with FullCalendar integration"
```

---

### Task 10: 前端 — 课程管理组件

**Files:**
- Create: `src/components/Course/CourseForm.tsx`
- Create: `src/components/Course/CourseDetail.tsx`
- Create: `src/components/Course/CourseList.tsx`

- [ ] **Step 1: 课程表单（新增/编辑）**

```tsx
// src/components/Course/CourseForm.tsx
import { Modal, Form, Input, Select, TimePicker, DatePicker, ColorPicker } from 'antd';
import dayjs from 'dayjs';
import type { Course } from '../../types';

const COLORS = ['#1890ff', '#52c41a', '#fa8c16', '#722ed1', '#eb2f96', '#13c2c2'];

interface Props {
  open: boolean;
  course?: Course | null;
  onSave: (course: Course) => Promise<void>;
  onCancel: () => void;
}

export default function CourseForm({ open, course, onSave, onCancel }: Props) {
  const [form] = Form.useForm();

  const handleOk = async () => {
    const values = await form.validateFields();
    const data: Course = {
      ...course,
      subject: values.subject,
      grade: values.grade || '',
      className: values.className || '',
      classroom: values.classroom || '',
      startTime: values.time?.[0]?.format('HH:mm') || '08:00',
      endTime: values.time?.[1]?.format('HH:mm') || '10:00',
      repeatType: values.repeatType || 'none',
      startDate: values.dateRange?.[0]?.format('YYYY-MM-DD') || '',
      endDate: values.dateRange?.[1]?.format('YYYY-MM-DD') || undefined,
      color: typeof values.color === 'string' ? values.color : values.color?.toHexString?.() || '#1890ff',
      status: 'active',
      notes: values.notes || '',
    };
    await onSave(data);
    form.resetFields();
  };

  const initialValues = course
    ? {
        subject: course.subject,
        grade: course.grade,
        className: course.className,
        classroom: course.classroom,
        time: [dayjs(course.startTime, 'HH:mm'), dayjs(course.endTime, 'HH:mm')],
        repeatType: course.repeatType,
        dateRange: course.startDate
          ? [dayjs(course.startDate), course.endDate ? dayjs(course.endDate) : undefined]
          : undefined,
        color: course.color,
        notes: course.notes,
      }
    : {};

  return (
    <Modal
      title={course ? '编辑课程' : '新增课程'}
      open={open}
      onOk={handleOk}
      onCancel={onCancel}
      width={520}
      destroyOnClose
    >
      <Form form={form} layout="vertical" initialValues={initialValues}>
        <Form.Item name="subject" label="科目" rules={[{ required: true, message: '请输入科目' }]}>
          <Input placeholder="如：数学" />
        </Form.Item>
        <Form.Item name="grade" label="年级">
          <Input placeholder="如：初三" />
        </Form.Item>
        <Form.Item name="className" label="班级">
          <Input placeholder="如：A班" />
        </Form.Item>
        <Form.Item name="classroom" label="教室">
          <Input placeholder="如：302" />
        </Form.Item>
        <Form.Item name="time" label="上课时间" rules={[{ required: true }]}>
          <TimePicker.RangePicker format="HH:mm" minuteStep={30} style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item name="repeatType" label="重复类型">
          <Select
            options={[
              { value: 'none', label: '不重复（单次）' },
              { value: 'weekly', label: '每周重复' },
              { value: 'biweekly', label: '每两周重复' },
            ]}
          />
        </Form.Item>
        <Form.Item name="dateRange" label="起止日期">
          <DatePicker.RangePicker style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item name="color" label="颜色标记">
          <ColorPicker presets={[{ label: '推荐', colors: COLORS }]} />
        </Form.Item>
        <Form.Item name="notes" label="备注">
          <Input.TextArea rows={2} />
        </Form.Item>
      </Form>
    </Modal>
  );
}
```

- [ ] **Step 2: 课程详情弹窗**

```tsx
// src/components/Course/CourseDetail.tsx
import { Modal, Descriptions, Button, Space, Popconfirm } from 'antd';
import type { Course } from '../../types';
import { useCalendarStore } from '../../stores/calendarStore';
import { useState } from 'react';
import CourseForm from './CourseForm';
import ExceptionForm from './ExceptionForm';

interface Props {
  course: Course | null;
  open: boolean;
  onClose: () => void;
}

export default function CourseDetail({ course, open, onClose }: Props) {
  const { removeCourse, updateCourse, addException } = useCalendarStore();
  const [editing, setEditing] = useState(false);
  const [showException, setShowException] = useState(false);

  if (!course) return null;

  const handleDelete = async () => {
    if (course.id != null) {
      await removeCourse(course.id);
      onClose();
    }
  };

  const handleSave = async (updated: Course) => {
    await updateCourse(updated);
    setEditing(false);
  };

  return (
    <>
      <Modal
        title="课程详情"
        open={open && !editing}
        onCancel={onClose}
        footer={
          <Space>
            <Button onClick={() => setShowException(true)}>调课/停课</Button>
            <Button onClick={() => setEditing(true)}>编辑</Button>
            <Popconfirm title="确定删除此课程？" onConfirm={handleDelete}>
              <Button danger>删除</Button>
            </Popconfirm>
            <Button onClick={onClose}>关闭</Button>
          </Space>
        }
        width={480}
      >
        <Descriptions column={1} size="small" bordered>
          <Descriptions.Item label="科目">{course.subject}</Descriptions.Item>
          <Descriptions.Item label="年级">{course.grade}</Descriptions.Item>
          <Descriptions.Item label="班级">{course.className}</Descriptions.Item>
          <Descriptions.Item label="教室">{course.classroom}</Descriptions.Item>
          <Descriptions.Item label="时间">{course.startTime} - {course.endTime}</Descriptions.Item>
          <Descriptions.Item label="重复">{course.repeatType === 'weekly' ? '每周' : course.repeatType === 'biweekly' ? '每两周' : '不重复'}</Descriptions.Item>
          <Descriptions.Item label="起止">{course.startDate} {course.endDate ? `~ ${course.endDate}` : '起'}</Descriptions.Item>
          <Descriptions.Item label="备注">{course.notes || '-'}</Descriptions.Item>
        </Descriptions>
      </Modal>

      <CourseForm
        open={editing}
        course={course}
        onSave={handleSave}
        onCancel={() => setEditing(false)}
      />

      <ExceptionForm
        open={showException}
        courseId={course.id!}
        courseDate={course.startDate}
        startTime={course.startTime}
        endTime={course.endTime}
        onSave={async (ex) => { await addException(ex); setShowException(false); }}
        onCancel={() => setShowException(false)}
      />
    </>
  );
}
```

- [ ] **Step 3: 调课/停课表单**

```tsx
// src/components/Course/ExceptionForm.tsx
import { Modal, Form, Input, Select, DatePicker, TimePicker } from 'antd';
import type { ScheduleException } from '../../types';
import dayjs from 'dayjs';

interface Props {
  open: boolean;
  courseId: number;
  courseDate: string;
  startTime: string;
  endTime: string;
  onSave: (exception: ScheduleException) => Promise<void>;
  onCancel: () => void;
}

export default function ExceptionForm({ open, courseId, courseDate, startTime, endTime, onSave, onCancel }: Props) {
  const [form] = Form.useForm();
  const exceptionType = Form.useWatch('exceptionType', form);

  const handleOk = async () => {
    const values = await form.validateFields();
    const exception: ScheduleException = {
      courseId,
      originalDate: courseDate,
      exceptionType: values.exceptionType || 'cancelled',
      reason: values.reason || '',
    };

    if (values.exceptionType === 'rescheduled') {
      exception.newDate = values.newDate?.format('YYYY-MM-DD');
      exception.newStartTime = values.newTime?.[0]?.format('HH:mm');
      exception.newEndTime = values.newTime?.[1]?.format('HH:mm');
    }

    await onSave(exception);
    form.resetFields();
  };

  return (
    <Modal title="调课/停课" open={open} onOk={handleOk} onCancel={onCancel} destroyOnClose>
      <Form form={form} layout="vertical" initialValues={{ exceptionType: 'cancelled' }}>
        <Form.Item name="exceptionType" label="类型">
          <Select
            options={[
              { value: 'cancelled', label: '停课' },
              { value: 'rescheduled', label: '调课' },
            ]}
          />
        </Form.Item>

        {exceptionType === 'rescheduled' && (
          <>
            <Form.Item name="newDate" label="新日期">
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="newTime" label="新时间">
              <TimePicker.RangePicker format="HH:mm" minuteStep={30} style={{ width: '100%' }} />
            </Form.Item>
          </>
        )}

        <Form.Item name="reason" label="原因">
          <Input.TextArea rows={2} placeholder="调课或停课的原因" />
        </Form.Item>
      </Form>
    </Modal>
  );
}
```

- [ ] **Step 4: 课程列表视图**

```tsx
// src/components/Course/CourseList.tsx
import { useState } from 'react';
import { Table, Button, Tag, Space } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useCalendarStore } from '../../stores/calendarStore';
import type { Course } from '../../types';
import CourseForm from './CourseForm';
import CourseDetail from './CourseDetail';

export default function CourseList() {
  const { courses, addCourse, updateCourse, removeCourse } = useCalendarStore();
  const [formOpen, setFormOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [detailCourse, setDetailCourse] = useState<Course | null>(null);

  const columns = [
    { title: '科目', dataIndex: 'subject', key: 'subject' },
    { title: '年级', dataIndex: 'grade', key: 'grade' },
    { title: '班级', dataIndex: 'className', key: 'className' },
    { title: '教室', dataIndex: 'classroom', key: 'classroom' },
    { title: '时间', key: 'time', render: (_: unknown, r: Course) => `${r.startTime}-${r.endTime}` },
    {
      title: '重复', dataIndex: 'repeatType', key: 'repeatType',
      render: (v: string) => v === 'weekly' ? '每周' : v === 'biweekly' ? '每两周' : '单次',
    },
    {
      title: '日期', key: 'date',
      render: (_: unknown, r: Course) => `${r.startDate}${r.endDate ? ` ~ ${r.endDate}` : '起'}`,
    },
    {
      title: '操作', key: 'actions',
      render: (_: unknown, r: Course) => (
        <Space>
          <a onClick={() => setDetailCourse(r)}>详情</a>
          <a onClick={() => { setEditingCourse(r); setFormOpen(true); }}>编辑</a>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ background: '#fff', borderRadius: 8, padding: 16, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ marginBottom: 16 }}>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => {
            setEditingCourse(null);
            setFormOpen(true);
          }}
        >
          新增课程
        </Button>
      </div>
      <Table
        dataSource={courses}
        columns={columns}
        rowKey="id"
        pagination={{ pageSize: 20 }}
        size="middle"
        scroll={{ y: 'calc(100vh - 280px)' }}
      />

      <CourseForm
        open={formOpen}
        course={editingCourse}
        onSave={async (course) => {
          if (course.id) {
            await updateCourse(course);
          } else {
            await addCourse(course);
          }
          setFormOpen(false);
          setEditingCourse(null);
        }}
        onCancel={() => { setFormOpen(false); setEditingCourse(null); }}
      />

      <CourseDetail
        course={detailCourse}
        open={!!detailCourse}
        onClose={() => setDetailCourse(null)}
      />
    </div>
  );
}
```

- [ ] **Step 5: Commit**

```bash
git add src/components/Course/
git commit -m "feat: add course management components (form, detail, list)"
```

---

### Task 11: 前端 — 课时统计 & Excel导入 & 假期管理

**Files:**
- Create: `src/components/Statistics/StatisticsView.tsx`
- Create: `src/components/Import/ImportExcel.tsx`
- Create: `src/components/Settings/HolidaysManager.tsx`
- Create: `src/utils/excelExport.ts`

- [ ] **Step 1: Excel 导出工具**

```typescript
// src/utils/excelExport.ts
import * as XLSX from 'xlsx';

export function exportToExcel(
  data: Record<string, unknown>[],
  sheetName: string,
  fileName: string,
) {
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(data);
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, `${fileName}.xlsx`);
}
```

- [ ] **Step 2: 课时统计视图**

```tsx
// src/components/Statistics/StatisticsView.tsx
import { useState, useMemo } from 'react';
import { Card, DatePicker, Table, Button, Space, Statistic, Row, Col } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';
import { useCalendarStore } from '../../stores/calendarStore';
import { calculateHours } from '../../utils/dateUtils';
import { exportToExcel } from '../../utils/excelExport';
import type { StatisticsResult, StatisticsQuery } from '../../types';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;

export default function StatisticsView() {
  const { courses } = useCalendarStore();
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs().startOf('month'),
    dayjs().endOf('month'),
  ]);

  const stats: StatisticsResult[] = useMemo(() => {
    const map = new Map<string, StatisticsResult>();
    const start = dateRange[0].format('YYYY-MM-DD');
    const end = dateRange[1].format('YYYY-MM-DD');

    for (const course of courses) {
      if (course.status !== 'active') continue;
      const key = `${course.subject}|${course.grade}`;
      const existing = map.get(key) || {
        subject: course.subject,
        grade: course.grade,
        totalHours: 0,
        courseCount: 0,
      };
      existing.courseCount += 1;
      existing.totalHours += calculateHours(course.startTime, course.endTime);
      map.set(key, existing);
    }

    return Array.from(map.values()).sort((a, b) => b.totalHours - a.totalHours);
  }, [courses, dateRange]);

  const totalHours = stats.reduce((sum, s) => sum + s.totalHours, 0);
  const totalCourses = stats.reduce((sum, s) => sum + s.courseCount, 0);

  const columns = [
    { title: '科目', dataIndex: 'subject', key: 'subject' },
    { title: '年级', dataIndex: 'grade', key: 'grade' },
    { title: '课程数', dataIndex: 'courseCount', key: 'courseCount' },
    {
      title: '总课时（小时）', dataIndex: 'totalHours', key: 'totalHours',
      render: (v: number) => v.toFixed(1),
    },
  ];

  const handleExport = () => {
    exportToExcel(stats, '课时统计', `课时统计_${dateRange[0].format('YYYYMM')}`);
  };

  return (
    <div>
      <Space style={{ marginBottom: 16 }} align="end">
        <div>
          <div style={{ marginBottom: 4, fontSize: 12, color: '#999' }}>统计时间范围</div>
          <RangePicker
            picker="month"
            value={dateRange}
            onChange={(v) => v && setDateRange([v[0], v[1]])}
          />
        </div>
        <Button icon={<DownloadOutlined />} onClick={handleExport}>导出Excel</Button>
      </Space>

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={8}>
          <Card><Statistic title="总课时（小时）" value={totalHours.toFixed(1)} /></Card>
        </Col>
        <Col span={8}>
          <Card><Statistic title="课程总数" value={totalCourses} /></Card>
        </Col>
        <Col span={8}>
          <Card><Statistic title="科目数" value={stats.length} /></Card>
        </Col>
      </Row>

      <Card title="课时明细">
        <Table dataSource={stats} columns={columns} rowKey={(r) => `${r.subject}-${r.grade}`} pagination={false} size="middle" />
      </Card>
    </div>
  );
}
```

- [ ] **Step 3: Excel 导入组件**

```tsx
// src/components/Import/ImportExcel.tsx
import { useState } from 'react';
import { Card, Button, Table, Alert, Space, Radio, message, Upload } from 'antd';
import { UploadOutlined, InboxOutlined } from '@ant-design/icons';
import { open } from '@tauri-apps/plugin-dialog';
import { api } from '../../api';
import type { ImportPreview } from '../../types';

export default function ImportExcel() {
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [filePath, setFilePath] = useState<string>('');
  const [mode, setMode] = useState<'append' | 'replace'>('append');
  const [loading, setLoading] = useState(false);

  const handleSelectFile = async () => {
    const selected = await open({
      filters: [{ name: 'Excel', extensions: ['xlsx', 'xls'] }],
      multiple: false,
    });
    if (selected) {
      setFilePath(selected as string);
      try {
        const result = await api.previewExcelImport(selected as string);
        setPreview(result);
      } catch (e) {
        message.error(String(e));
      }
    }
  };

  const handleImport = async () => {
    setLoading(true);
    try {
      const count = await api.executeExcelImport(filePath, mode);
      message.success(`成功导入 ${count} 条课程`);
      setPreview(null);
      setFilePath('');
    } catch (e) {
      message.error(String(e));
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { title: '科目', dataIndex: 'subject', key: 'subject' },
    { title: '年级', dataIndex: 'grade', key: 'grade' },
    { title: '班级', dataIndex: 'className', key: 'className' },
    { title: '教室', dataIndex: 'classroom', key: 'classroom' },
    { title: '时间', key: 'time', render: (_: unknown, r: { startTime: string; endTime: string }) => `${r.startTime}-${r.endTime}` },
    { title: '重复', dataIndex: 'repeatType', key: 'repeatType' },
    { title: '日期', dataIndex: 'startDate', key: 'startDate' },
  ];

  return (
    <div>
      <Card title="导入课表" style={{ marginBottom: 16 }}>
        <div style={{ textAlign: 'center', padding: '40px 0', background: '#fafafa', borderRadius: 8, marginBottom: 16 }}>
          <InboxOutlined style={{ fontSize: 48, color: '#1890ff', marginBottom: 16 }} />
          <div style={{ marginBottom: 16, color: '#999' }}>
            支持导入 .xlsx / .xls 格式课表文件<br />
            表头格式：科目 | 年级 | 班级 | 教室 | 开始时间 | 结束时间 | 重复类型 | 开始日期 | 结束日期 | 备注
          </div>
          <Button type="primary" icon={<UploadOutlined />} onClick={handleSelectFile} size="large">
            选择Excel文件
          </Button>
        </div>

        {preview && (
          <>
            <div style={{ marginBottom: 16 }}>
              <Space>
                <span>导入模式：</span>
                <Radio.Group value={mode} onChange={(e) => setMode(e.target.value)}>
                  <Radio.Button value="append">追加导入</Radio.Button>
                  <Radio.Button value="replace">替换导入（覆盖现有课表）</Radio.Button>
                </Radio.Group>
              </Space>
            </div>

            {preview.conflicts.length > 0 && (
              <Alert
                type="warning"
                showIcon
                style={{ marginBottom: 16 }}
                message="检测到冲突"
                description={
                  <ul style={{ margin: 0 }}>
                    {preview.conflicts.map((c, i) => (
                      <li key={i}>{c.description}</li>
                    ))}
                  </ul>
                }
              />
            )}

            <Table
              dataSource={preview.courses}
              columns={columns}
              rowKey={(_, i) => String(i)}
              pagination={false}
              size="small"
              scroll={{ y: 240 }}
              style={{ marginBottom: 16 }}
            />

            <Button type="primary" onClick={handleImport} loading={loading}>
              确认导入 ({preview.courses.length} 条)
            </Button>
          </>
        )}
      </Card>
    </div>
  );
}
```

- [ ] **Step 4: 假期管理组件**

```tsx
// src/components/Settings/HolidaysManager.tsx
import { useState } from 'react';
import { Card, Calendar, List, Button, Popconfirm, DatePicker, Input, Space, message } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { useCalendarStore } from '../../stores/calendarStore';
import type { Holiday } from '../../types';
import dayjs from 'dayjs';

export default function HolidaysManager() {
  const { holidays, addHoliday, removeHoliday } = useCalendarStore();
  const [date, setDate] = useState<dayjs.Dayjs | null>(null);
  const [label, setLabel] = useState('');

  const handleAdd = async () => {
    if (!date) return;
    await addHoliday({ date: date.format('YYYY-MM-DD'), label });
    setDate(null);
    setLabel('');
    message.success('已添加停课日');
  };

  const holidaySet = new Set(holidays.map((h) => h.date));

  return (
    <div style={{ display: 'flex', gap: 16, height: '100%' }}>
      <Card title="设置停课日" style={{ width: 400 }}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <DatePicker
            value={date}
            onChange={setDate}
            style={{ width: '100%' }}
            placeholder="选择停课日期"
          />
          <Input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="说明（如：国庆假期）"
          />
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd} block>
            添加停课日
          </Button>
        </Space>

        <List
          style={{ marginTop: 16 }}
          size="small"
          dataSource={holidays}
          renderItem={(h) => (
            <List.Item
              actions={[
                <Popconfirm title="确定移除？" onConfirm={() => h.id != null && removeHoliday(h.id)}>
                  <Button type="text" danger icon={<DeleteOutlined />} size="small" />
                </Popconfirm>,
              ]}
            >
              <span>{h.date}</span>
              <span style={{ marginLeft: 12, color: '#999' }}>{h.label}</span>
            </List.Item>
          )}
        />
      </Card>

      <Card title="停课日预览" style={{ flex: 1 }}>
        <Calendar
          fullscreen={false}
          dateCellRender={(date) => {
            const key = date.format('YYYY-MM-DD');
            if (holidaySet.has(key)) {
              const h = holidays.find((x) => x.date === key);
              return <div style={{ color: '#ff4d4f', fontSize: 12 }}>{h?.label || '停课'}</div>;
            }
            return null;
          }}
        />
      </Card>
    </div>
  );
}
```

- [ ] **Step 5: Commit**

```bash
git add src/components/Statistics/ src/components/Import/ src/components/Settings/ src/utils/excelExport.ts
git commit -m "feat: add statistics, Excel import, and holidays management views"
```

---

### Task 12: 打包配置 & 最终测试

**Files:**
- Modify: `src-tauri/tauri.conf.json`
- Modify: `src-tauri/Cargo.toml`

- [ ] **Step 1: 配置 Tauri 打包参数**

编辑 `src-tauri/tauri.conf.json`，确保 identifier、bundle 配置正确：

```json
{
  "$schema": "https://raw.githubusercontent.com/nicedoc/schemas/main/schemas/tauri.config.schema.json",
  "productName": "教师日程系统",
  "version": "1.0.0",
  "identifier": "com.trainingscheduler.app",
  "build": {
    "frontendDist": "../dist",
    "devUrl": "http://localhost:1420",
    "beforeDevCommand": "npm run dev",
    "beforeBuildCommand": "npm run build"
  },
  "app": {
    "windows": [
      {
        "title": "教师日程系统",
        "width": 1280,
        "height": 800,
        "minWidth": 1024,
        "minHeight": 680,
        "resizable": true
      }
    ]
  },
  "bundle": {
    "active": true,
    "targets": ["msi", "nsis"],
    "icon": [
      "icons/32x32.png",
      "icons/128x128.png",
      "icons/icon.ico"
    ]
  }
}
```

- [ ] **Step 2: 补充 Cargo.toml 必要的 Tauri 特性**

```bash
cd src-tauri
# 确认 Cargo.toml tauri 依赖包含 tauri-plugin-dialog
grep "tauri-plugin-dialog" Cargo.toml || echo 'tauri-plugin-dialog = "2"' >> /dev/null
```

如果缺少，手动在 Cargo.toml 的 `[dependencies]` 中添加：
```toml
tauri-plugin-dialog = "2"
```

同时在 `src-tauri/src/main.rs` 中注册插件：
```rust
.plugin(tauri_plugin_dialog::init())
```

- [ ] **Step 3: 安装 Tauri dialog 插件（前端）**

```bash
npm install @tauri-apps/plugin-dialog
```

- [ ] **Step 4: 构建测试打包**

```bash
npm run tauri build -- --debug
```

Expected: 在 `src-tauri/target/debug/bundle/` 下生成安装包。

- [ ] **Step 5: 最终 Commit**

```bash
git add -A
git commit -m "chore: configure Tauri bundling and finalize project"
```

---

## 自检清单

| 检查项 | 状态 |
|--------|------|
| 所有文件路径准确 | ✓ |
| Rust 命令在 main.rs invoke_handler 中注册 | ✓ |
| 前端 API 封装与 Rust 命令签名匹配 | ✓ |
| 类型定义前后端一致 | ✓ |
| FullCalendar 插件已安装 | ✓ |
| Ant Design 中文 locale 已配置 | ✓ |
| Excel 导入支持冲突检测 | ✓ |
| 课时统计包含导出功能 | ✓ |
