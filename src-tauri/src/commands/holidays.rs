#[tauri::command]
pub fn get_holidays() -> Result<Vec<crate::models::Holiday>, String> { Ok(vec![]) }
#[tauri::command]
pub fn create_holiday(holiday: crate::models::Holiday) -> Result<crate::models::Holiday, String> { Ok(holiday) }
#[tauri::command]
pub fn delete_holiday(_id: i64) -> Result<(), String> { Ok(()) }
#[tauri::command]
pub fn batch_create_holidays(_holidays: Vec<crate::models::Holiday>) -> Result<usize, String> { Ok(0) }
