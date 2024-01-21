use dotenv::dotenv;
use reqwest::{
    header::{self, HeaderMap, AUTHORIZATION},
    Client, Error,
};
use serde_json::Value;
use std::env;

pub enum RequestMethod {
    GET,
    POST(Value),
}

#[derive(Debug)]
pub struct PullRequestShaRef {
    pub base_sha: String,
    pub head_sha: String,
    pub base_ref: String,
    pub head_ref: String,
}

pub struct PullRequestRequest {
    pub owner: String,
    pub repo: String,
    pub pull_number: u32,
}

pub struct ForkRequest {
    pub owner: String,
    pub repo: String,
}

impl ForkRequest {
    pub fn new(owner: String, repo: String) -> Self {
        Self { owner, repo }
    }

    pub async fn fork(&self) -> Result<Value, Error> {
        let fetch_params = format!(
            "https://api.github.com/repos/{}/{}/forks",
            self.owner, self.repo
        );
        let value = Value::String("'default_branch_only': 'true'".to_string());
        let response = fetch_github_data(&fetch_params, RequestMethod::POST(value)).await;
        return response;
    }
}

pub struct BranchRequest {
    pub owner: String,
    pub repo: String,
    pub branch_ref: String,
    pub sha: String,
}

impl BranchRequest {
    pub fn new(owner: String, repo: String, branch_ref: String, sha: String) -> Self {
        Self {
            owner,
            repo,
            branch_ref,
            sha,
        }
    }

    pub async fn create(&self) -> Result<Value, Error> {
        let fetch_params = format!(
            "https://api.github.com/repos/{}/{}/git/refs",
            self.owner, self.repo
        );
        let value = Value::Object(
            serde_json::from_str(
                format!(
                    r#"
                    {{
                        "ref": "refs/heads/{}",
                        "sha": "{}"
                    }}
                    "#,
                    self.branch_ref, self.sha
                )
                .as_str(),
            )
            .unwrap(),
        );
        let response = fetch_github_data(&fetch_params, RequestMethod::POST(value)).await;
        return response;
    }
}

fn get_token() -> String {
    dotenv().ok();
    env::var("GITHUB_TOKEN").expect("GITHUB_TOKEN must be set")
}

pub async fn fetch_github_data(url: &str, method: RequestMethod) -> Result<Value, Error> {
    let client = Client::new();
    let mut headers = HeaderMap::new();

    headers.insert(header::USER_AGENT, "Fresh Eyes".parse().unwrap());
    headers.insert(AUTHORIZATION, get_token().parse().unwrap());
    headers.insert(
        header::ACCEPT,
        "application/vnd.github.v3+json".parse().unwrap(),
    );

    let response = match method {
        RequestMethod::GET => client.get(url).headers(headers).send().await?,
        RequestMethod::POST(body) => client.post(url).headers(headers).json(&body).send().await?,
    };

    Ok(response.json().await?)
}

pub fn extract_base_head_sha(data: &Value) -> PullRequestShaRef {
    let base_sha = data["base"]["sha"].as_str().unwrap_or_default().to_string();
    let head_sha = data["head"]["sha"].as_str().unwrap_or_default().to_string();
    let base_ref = data["base"]["ref"].as_str().unwrap_or_default().to_string();
    let head_ref = data["head"]["ref"].as_str().unwrap_or_default().to_string();

    PullRequestShaRef {
        base_sha,
        head_sha,
        base_ref,
        head_ref,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_fetch_github_data() {
        let url = "https://api.github.com/users/extheoisah/repos";
        let res = fetch_github_data(url, RequestMethod::GET).await;
        assert!(res.is_ok());
    }

    #[test]
    fn test_extract_base_head_sha() {
        let data = r#"
        {
            "url": "https://api.github.com/repos/bitcoin/bitcoin/pulls/79",
            "id": 279147,
            "node_id": "MDExOlB1bGxSZXF1ZXN0Mjc5MTQ3",
            "head": {
                "label": "gavinandresen:rounding",
                "ref": "rounding",
                "sha": "8a9cad44a57f1e0057c127ced5078d7e722b9cc8",
            },
            "base": {
                "label": "bitcoin:master",
                "ref": "master",
                "sha": "ccd7fe8de52bbc9210b444838eefb7ddbc880457",
            },
        }"#;
        let res = extract_base_head_sha(&serde_json::from_str(data).unwrap());
        assert_eq!(res.base_sha, "ccd7fe8de52bbc9210b444838eefb7ddbc880457");
        assert_eq!(res.head_sha, "8a9cad44a57f1e0057c127ced5078d7e722b9cc8");
        assert_eq!(res.base_ref, "master");
        assert_eq!(res.head_ref, "rounding");
    }
}
