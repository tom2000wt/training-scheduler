#[tauri::command]
pub fn get_statistics(_query: crate::models::StatisticsQuery) -> Result<Vec<crate::models::StatisticsResult>, String> { Ok(vec![]) }
