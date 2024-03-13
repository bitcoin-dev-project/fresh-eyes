use std::{env, fs, io::stdin, path::Path, sync::Arc};

use once_cell::sync::Lazy;
use tokio::sync::Mutex;

static TOKEN: Lazy<Arc<Mutex<Option<String>>>> = Lazy::new(|| Arc::new(Mutex::new(None)));

/// Gets the GitHub personal access token from the user, or prompts them to create one if it doesn't exist.
pub async fn get_or_prompt_token() -> Result<String, std::io::Error> {
    let mut token = TOKEN.lock().await;

    if let Some(ref t) = *token {
        Ok(t.clone())
    } else {
        let new_token = get_token()?;
        *token = Some(new_token.clone());
        Ok(new_token)
    }
}

fn get_token() -> Result<String, std::io::Error> {
    // Check if the environment variable for the token exists
    if let Ok(env_token) = env::var("GITHUB_TOKEN") {
        return Ok(format!("Bearer {}", env_token));
    }

    let home = env::var("HOME").unwrap();
    let config_dir = format!("{}/.fresheyes", home);
    fs::create_dir_all(&config_dir)?;

    let config_path = Path::new(&config_dir).join("fresheyes");
    if config_path.exists() {
        let config = fs::read_to_string(config_path)?;
        Ok(format!("Bearer {}", config))
    } else {
        let token = prompt_for_token();

        println!("Would you like to save this token for future use? [y/N]");
        let mut save_token = String::new();
        stdin().read_line(&mut save_token).unwrap();
        match save_token.trim().to_lowercase().as_str() {
            "y" => {
                fs::write(&config_path, &token)?;
                println!(
                    "Token saved! You can delete it at any time by deleting the file at ~/.fresheyes/fresheyes"
                );
                Ok(format!("Bearer {}", token))
            }
            "n" => {
                println!(
                    "Token not saved. You will be prompted for it again next time you run fresheyes."
                );
                Ok(format!("Bearer {}", token))
            }
            _ => {
                println!("Invalid input. Token not saved.");
                return Err(std::io::Error::new(
                    std::io::ErrorKind::InvalidInput,
                    "Invalid input",
                ));
            }
        }
    }
}

fn prompt_for_token() -> String {
    println!("Please enter your GitHub personal access token:");
    let mut token = String::new();
    stdin().read_line(&mut token).unwrap();
    token.trim().to_string()
}
