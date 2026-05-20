use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct Course {
    pub id: Option<i64>,
    pub subject: String,
    pub grade: String,
    pub class_name: String,
    pub classroom: String,
    pub start_time: String,
    pub end_time: String,
    pub repeat_type: String,
    pub start_date: String,
    pub end_date: Option<String>,
    pub color: String,
    pub status: String,
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
    pub exception_type: String,
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
