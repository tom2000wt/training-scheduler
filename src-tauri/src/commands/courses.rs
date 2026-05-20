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
