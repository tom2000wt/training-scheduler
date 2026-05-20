use std::fmt;

#[derive(Debug)]
pub enum AppError {
    Database(rusqlite::Error),
    NotFound(String),
    Conflict(String),
    Excel(String),
}

impl fmt::Display for AppError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            AppError::Database(e) => write!(f, "数据库错误: {}", e),
            AppError::NotFound(msg) => write!(f, "{}", msg),
            AppError::Conflict(msg) => write!(f, "{}", msg),
            AppError::Excel(msg) => write!(f, "Excel错误: {}", msg),
        }
    }
}

impl From<rusqlite::Error> for AppError {
    fn from(e: rusqlite::Error) -> Self {
        AppError::Database(e)
    }
}

impl From<calamine::Error> for AppError {
    fn from(e: calamine::Error) -> Self {
        AppError::Excel(e.to_string())
    }
}

impl serde::Serialize for AppError {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        serializer.serialize_str(&self.to_string())
    }
}
