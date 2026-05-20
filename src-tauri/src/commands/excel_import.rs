#[tauri::command]
pub fn preview_excel_import(_file_path: String) -> Result<crate::models::ImportPreview, String> {
    Ok(crate::models::ImportPreview { courses: vec![], conflicts: vec![] })
}
#[tauri::command]
pub fn execute_excel_import(_file_path: String, _mode: String) -> Result<usize, String> { Ok(0) }
