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
