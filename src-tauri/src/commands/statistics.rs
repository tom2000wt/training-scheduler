use crate::commands::export::expand_courses;
use crate::db::Database;
use crate::models::{Course, Holiday, StatisticsQuery, StatisticsResult};
use chrono::NaiveDate;
use std::collections::HashMap;
use tauri::State;

#[tauri::command]
pub fn get_statistics(
    db: State<Database>,
    query: StatisticsQuery,
) -> Result<Vec<StatisticsResult>, String> {
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

    let mut hstmt = conn
        .prepare("SELECT id, date, label FROM holidays")
        .map_err(|e| e.to_string())?;

    let holidays = hstmt
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

    let start = NaiveDate::parse_from_str(&query.start_date, "%Y-%m-%d")
        .map_err(|e| format!("无效的开始日期: {}", e))?;
    let end = NaiveDate::parse_from_str(&query.end_date, "%Y-%m-%d")
        .map_err(|e| format!("无效的结束日期: {}", e))?;

    let items = expand_courses(&courses, &holidays, &start, &end);

    // Aggregate by subject + grade
    let mut groups: HashMap<(String, String), (f64, i64)> = HashMap::new();
    for item in &items {
        let key = (item.subject.clone(), item.grade.clone());
        let entry = groups.entry(key).or_insert((0.0, 0));
        entry.0 += item.hours;
        entry.1 += 1;
    }

    // Build results sorted by subject, grade
    let mut keys: Vec<_> = groups.keys().collect();
    keys.sort();
    let results: Vec<StatisticsResult> = keys
        .into_iter()
        .map(|k| {
            let (hours, count) = groups[k];
            StatisticsResult {
                subject: k.0.clone(),
                grade: k.1.clone(),
                total_hours: (hours * 10.0).round() / 10.0,
                course_count: count,
            }
        })
        .collect();

    Ok(results)
}
