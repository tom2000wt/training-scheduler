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
                    (julianday('2000-01-01 ' || substr(end_time, 1, 5)) - julianday('2000-01-01 ' || substr(start_time, 1, 5))) * 24.0
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
