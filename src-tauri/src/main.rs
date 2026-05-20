#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod commands;
mod db;
mod error;
mod models;

use db::Database;
use std::path::PathBuf;
use tauri::Manager;

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .setup(|app| {
            let app_dir: PathBuf = app
                .path()
                .app_data_dir()
                .unwrap_or_else(|_| PathBuf::from("."));
            let database =
                Database::new(app_dir).expect("Failed to initialize database");
            app.manage(database);
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::courses::get_courses,
            commands::courses::create_course,
            commands::courses::update_course,
            commands::courses::delete_course,
            commands::exceptions::get_exceptions,
            commands::exceptions::create_exception,
            commands::exceptions::delete_exception,
            commands::holidays::get_holidays,
            commands::holidays::create_holiday,
            commands::holidays::delete_holiday,
            commands::holidays::batch_create_holidays,
            commands::statistics::get_statistics,
            commands::excel_import::preview_excel_import,
            commands::excel_import::execute_excel_import,
            commands::export::export_courses,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
