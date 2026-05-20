#[tauri::command]
pub fn get_exceptions(_course_id: i64) -> Result<Vec<crate::models::ScheduleException>, String> { Ok(vec![]) }
#[tauri::command]
pub fn create_exception(exception: crate::models::ScheduleException) -> Result<crate::models::ScheduleException, String> { Ok(exception) }
#[tauri::command]
pub fn delete_exception(_id: i64) -> Result<(), String> { Ok(()) }
