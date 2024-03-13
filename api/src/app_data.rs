use std::sync::{Arc, Mutex};
#[derive(Debug, Clone)]
pub struct AppData {
    pub token: Arc<Mutex<String>>,
}

impl AppData {
    // Define a new function that takes a token as an argument and returns an instance of AppData
    // The token is parsed into a String and then wrapped in an Arc<Mutex<T>>
    pub fn new(token: String) -> Self {
        Self {
            token: Arc::new(Mutex::new(token.parse().unwrap())),
        }
    }
}
