#[tauri::command]
pub fn get_courses() -> Result<Vec<crate::models::Course>, String> { Ok(vec![]) }
#[tauri::command]
pub fn create_course(course: crate::models::Course) -> Result<crate::models::Course, String> { Ok(course) }
#[tauri::command]
pub fn update_course(_course: crate::models::Course) -> Result<(), String> { Ok(()) }
#[tauri::command]
pub fn delete_course(_id: i64) -> Result<(), String> { Ok(()) }
