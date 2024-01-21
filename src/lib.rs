use dotenv::dotenv;
use reqwest::{
    header::{self, HeaderMap, AUTHORIZATION},
    Client,
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

#[derive(Debug)]
pub struct PullRequest {
    pub owner: String,
    pub repo: String,
    pub title: Option<String>,
    pub body: Option<String>,
    pub head: Option<String>,
    pub base: Option<String>,
    pub pull_number: Option<u32>,
}

pub struct BranchRequest {
    pub owner: String,
    pub repo: String,
    pub branch_ref: String,
    pub sha: String,
}

pub struct ForkRequest {
    pub owner: String,
    pub repo: String,
}

#[derive(Debug)]
pub enum Error {
    Reqwest(reqwest::Error),
    Io(std::io::Error),
}

impl From<reqwest::Error> for Error {
    fn from(err: reqwest::Error) -> Self {
        Error::Reqwest(err)
    }
}

impl From<std::io::Error> for Error {
    fn from(err: std::io::Error) -> Self {
        Error::Io(err)
    }
}

impl PullRequest {
    pub fn new(
        owner: String,
        repo: String,
        title: Option<String>,
        body: Option<String>,
        base: String,
        head: String,
    ) -> Self {
        Self {
            owner,
            repo,
            title,
            body,
            base: Some(base),
            head: Some(head),
            pull_number: None,
        }
    }

    pub fn from_pull_number(owner: String, repo: String, pull_number: u32) -> Self {
        Self {
            owner,
            repo,
            title: None,
            body: None,
            base: None,
            head: None,
            pull_number: Some(pull_number),
        }
    }

    pub async fn create(&self) -> Result<Value, Error> {
        // ensure that the base and head are not None
        if self.base.is_none() || self.head.is_none() {
            // return an error
            return Err(Error::Io(std::io::Error::new(
                std::io::ErrorKind::Other,
                "base and head must be set",
            )));
        }

        let fetch_params = format!(
            "https://api.github.com/repos/{}/{}/pulls",
            self.owner, self.repo
        );
        let value = Value::Object(
            serde_json::from_str(
                format!(
                    r#"
                    {{
                        "title": "{}",
                        "body": "{}",
                        "base": "{}",
                        "head": "{}"
                    }}
                    "#,
                    self.title.as_ref().unwrap(),
                    self.body.as_ref().unwrap(),
                    self.base.as_ref().unwrap(),
                    self.head.as_ref().unwrap()
                )
                .as_str(),
            )
            .unwrap(),
        );
        let response = fetch_github_data(&fetch_params, RequestMethod::POST(value)).await;
        Ok(response?)
    }

    pub async fn get(&self) -> Result<Value, Error> {
        if self.pull_number.is_none() {
            return Err(Error::Io(std::io::Error::new(
                std::io::ErrorKind::Other,
                "pull_number must be set",
            )));
        }
        let fetch_params = format!(
            "https://api.github.com/repos/{}/{}/pulls/{:?}",
            self.owner,
            self.repo,
            self.pull_number.unwrap()
        );
        let response = fetch_github_data(&fetch_params, RequestMethod::GET).await;
        return Ok(response?);
    }
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
        let value = Value::Object(
            serde_json::from_str(
                format!(
                    r#"
                {{
                    "default_branch_only": "true"
                }}
                "#,
                )
                .as_str(),
            )
            .unwrap(),
        );
        let response = fetch_github_data(&fetch_params, RequestMethod::POST(value)).await;
        return Ok(response?);
    }
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
        let response = fetch_github_data(&fetch_params, RequestMethod::POST(value)).await?;
        return Ok(response);
    }
}

fn get_token() -> String {
    dotenv().ok();
    let token = env::var("GITHUB_TOKEN").expect("GITHUB_TOKEN must be set");
    return "Bearer ".to_string() + &token;
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

    // check the status code
    if !response.status().is_success() {
        return Err(Error::Io(std::io::Error::new(
            std::io::ErrorKind::Other,
            format!("status code: {}", response.status()),
        )));
    }

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
