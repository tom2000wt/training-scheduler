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

    rows.next(); // skip header row

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
    mode: String,
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
