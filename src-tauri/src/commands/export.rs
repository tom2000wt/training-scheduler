use crate::db::Database;
use crate::models::{Course, ExportCourseItem, Holiday};
use chrono::{Datelike, NaiveDate, Duration};
use tauri::State;

pub fn expand_courses(
    courses: &[Course],
    holidays: &[Holiday],
    start: &NaiveDate,
    end: &NaiveDate,
) -> Vec<ExportCourseItem> {
    let holiday_set: std::collections::HashSet<String> =
        holidays.iter().map(|h| h.date.clone()).collect();

    let weekdays = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"];

    let mut items: Vec<ExportCourseItem> = Vec::new();

    for course in courses {
        if course.status != "active" {
            continue;
        }

        let course_start = NaiveDate::parse_from_str(&course.start_date, "%Y-%m-%d")
            .unwrap_or(*start);
        let course_end = course
            .end_date
            .as_deref()
            .and_then(|d| NaiveDate::parse_from_str(d, "%Y-%m-%d").ok())
            .unwrap_or(*end);

        let effective_start = if course_start < *start { *start } else { course_start };
        let effective_end = if course_end > *end { *end } else { course_end };

        let mut current = effective_start;
        while current <= effective_end {
            let date_str = current.format("%Y-%m-%d").to_string();

            if !holiday_set.contains(&date_str) {
                let weekday_idx = current.weekday().num_days_from_monday() as usize;
                let start_minutes = time_to_minutes(&course.start_time);
                let end_minutes = time_to_minutes(&course.end_time);
                let hours = (end_minutes - start_minutes) as f64 / 60.0;

                items.push(ExportCourseItem {
                    date: date_str,
                    day_of_week: weekdays[weekday_idx].to_string(),
                    subject: course.subject.clone(),
                    grade: course.grade.clone(),
                    class_name: course.class_name.clone(),
                    classroom: course.classroom.clone(),
                    start_time: course.start_time.clone(),
                    end_time: course.end_time.clone(),
                    hours: (hours * 10.0).round() / 10.0,
                    notes: course.notes.clone(),
                });
            }

            match course.repeat_type.as_str() {
                "weekly" => current += Duration::days(7),
                "biweekly" => current += Duration::days(14),
                _ => break,
            }
        }
    }

    items.sort_by(|a, b| a.date.cmp(&b.date).then(a.start_time.cmp(&b.start_time)));
    items
}

fn time_to_minutes(time: &str) -> i32 {
    let parts: Vec<&str> = time.split(':').collect();
    if parts.len() == 2 {
        if let (Ok(h), Ok(m)) = (parts[0].parse::<i32>(), parts[1].parse::<i32>()) {
            return h * 60 + m;
        }
    }
    0
}

#[tauri::command]
pub fn export_courses(
    db: State<Database>,
    start_date: String,
    end_date: String,
) -> Result<Vec<ExportCourseItem>, String> {
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

    let start = NaiveDate::parse_from_str(&start_date, "%Y-%m-%d")
        .map_err(|e| format!("无效的开始日期: {}", e))?;
    let end = NaiveDate::parse_from_str(&end_date, "%Y-%m-%d")
        .map_err(|e| format!("无效的结束日期: {}", e))?;

    Ok(expand_courses(&courses, &holidays, &start, &end))
}
