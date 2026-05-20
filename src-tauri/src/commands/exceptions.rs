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
