use reqwest::{
    header::{self, HeaderMap, AUTHORIZATION},
    Client, StatusCode,
};
use serde::Serialize;
use serde_json::{json, Value};
use std::fmt;
use thiserror::Error;
mod utils;

pub enum RequestMethod {
    GET,
    POST(Value),
}

#[derive(Debug)]
pub struct PullRequestDetails {
    pub base_sha: String,
    pub head_sha: String,
    pub base_ref: String,
    pub head_ref: String,
    pub title: String,
    pub body: String,
}

#[derive(Debug)]
pub struct PullRequest {
    /// repository owner
    pub owner: String,
    /// name of repository
    pub repo: String,
    pub title: Option<String>,
    pub body: Option<String>,
    /// The name of the branch where your changes are implemented.
    /// For cross-repository pull requests in the same network, namespace head with a user like this: username:branch.
    pub head: Option<String>,
    /// The name of the branch you want the changes pulled into.
    /// This should be an existing branch on the current repository.
    pub base: Option<String>,
    pub pull_number: Option<u32>,
}

pub struct Branch {
    pub owner: String,
    pub repo: String,
    pub branch_ref: String,
    pub sha: String,
}

pub struct ForkRequest {
    pub owner: String,
    pub repo: String,
}

#[derive(Debug, Serialize)]
pub struct ForkResult {
    pub owner: String,
    pub repo: String,
    pub forked_repo: String,
}

#[derive(Debug, Serialize)]
pub struct ErrorResponse {
    pub message: String,
    pub status: u16,
}

impl fmt::Display for ErrorResponse {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{:?}", self)
    }
}

#[derive(Error, Debug)]
pub enum FreshEyesError {
    #[error("An error occurred while the request was being executed.")]
    RequestError(#[from] reqwest::Error),
    #[error("value of {0} is undefined")]
    ValueUndefinedError(String),
    #[error("{0}")]
    StatusCodeError(ErrorResponse),
    #[error("error forking the repository: {0}")]
    ForkError(String),
    #[error("authorization token not found")]
    MissingTokenError,
    #[error("unknown error: {0}")]
    Unknown(String),
}

impl PullRequest {
    /// construct pull request params to create a pull request
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

    /// construct pull request params to fetch a pull request from github
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

    /// create a pull request
    pub async fn create(&self) -> Result<Value, FreshEyesError> {
        // ensure that the base and head are not None
        if self.base.is_none() || self.head.is_none() {
            return Err(FreshEyesError::ValueUndefinedError(format!(
                "{:?} {:?}",
                self.base, self.head
            )));
        }

        let fetch_params = format!(
            "https://api.github.com/repos/{}/{}/pulls",
            self.owner, self.repo
        );

        let value = json!({
            "title": self.title.as_ref().unwrap(),
            "body": self.body.as_ref().unwrap(),
            "base": self.base.as_ref().unwrap(),
            "head": self.head.as_ref().unwrap()
        });

        let response = fetch_github_data(&fetch_params, RequestMethod::POST(value)).await;
        // hceck if pull request already exists
        match response {
            Ok(data) => {
                return Ok::<Value, FreshEyesError>(data);
            }
            Err(e) => match e {
                FreshEyesError::StatusCodeError(error_response) => {
                    if error_response.status == StatusCode::UNPROCESSABLE_ENTITY.as_u16() {
                        return Ok(Value::Object(
                            serde_json::from_str(
                                format!(
                                    r#"
                                        {{
                                            "message": "A pull request already exists for {}:{}",
                                            "status": 422
                                        }}
                                        "#,
                                    self.owner, self.repo
                                )
                                .as_str(),
                            )
                            .unwrap(),
                        ));
                    } else {
                        return Err(FreshEyesError::StatusCodeError(error_response));
                    }
                }
                _ => return Err(FreshEyesError::Unknown(format!("unknown error: {:?}", e))),
            },
        }
    }

    /// get a pull request by its number
    pub async fn get(&self) -> Result<Value, FreshEyesError> {
        if self.pull_number.is_none() {
            return Err(FreshEyesError::ValueUndefinedError(format!(
                "{:?}",
                self.pull_number
            )));
        }
        let fetch_params = format!(
            "https://api.github.com/repos/{}/{}/pulls/{:?}",
            self.owner,
            self.repo,
            self.pull_number.unwrap()
        );
        let response = fetch_github_data(&fetch_params, RequestMethod::GET).await;
        match response {
            Ok(data) => {
                return Ok::<Value, FreshEyesError>(data);
            }
            Err(e) => {
                if let FreshEyesError::StatusCodeError(error_response) = e {
                    if error_response.status == StatusCode::NOT_FOUND.as_u16() {
                        return Err(FreshEyesError::StatusCodeError(ErrorResponse {
                            message: format!("pull request not found!").to_string(),
                            status: error_response.status,
                        }));
                    } else {
                        return Err(FreshEyesError::StatusCodeError(error_response));
                    }
                }
                return Err(FreshEyesError::Unknown(format!("unknown error: {:?}", e)));
            }
        }
    }
}

impl ForkRequest {
    pub fn new(owner: String, repo: String) -> Self {
        Self { owner, repo }
    }

    /// create a fork
    pub async fn fork(&self) -> Result<ForkResult, FreshEyesError> {
        let fetch_params = format!(
            "https://api.github.com/repos/{}/{}/forks",
            self.owner, self.repo
        );
        let value = Value::Object(
            serde_json::from_str(
                format!(
                    r#"
                {{
                    "default_branch_only": "false"
                }}
                "#,
                )
                .as_str(),
            )
            .unwrap(),
        );
        let response = fetch_github_data(&fetch_params, RequestMethod::POST(value)).await;
        match response {
            Ok(data) => {
                let forked_repo = data["html_url"].as_str().unwrap_or_default().to_string();
                let owner = data["owner"]["login"]
                    .as_str()
                    .unwrap_or_default()
                    .to_string();
                let fork_result = ForkResult {
                    owner,
                    repo: self.repo.clone(),
                    forked_repo,
                };
                return Ok(fork_result);
            }
            Err(e) => {
                return Err(FreshEyesError::ForkError(format!(
                    "error forking the reposotory: {:?}",
                    e
                )))
            }
        };
    }
}

impl Branch {
    pub fn new(owner: String, repo: String, branch_ref: String, sha: String) -> Self {
        Self {
            owner,
            repo,
            branch_ref,
            sha,
        }
    }

    /// create a new branch from an existing branch
    pub async fn create(&self) -> Result<Value, FreshEyesError> {
        let fetch_params = format!(
            "https://api.github.com/repos/{}/{}/git/refs",
            self.owner, self.repo
        );

        let value = json!(
            {
                "ref": format!("refs/heads/{}", self.branch_ref),
                "sha": self.sha
            }
        );
        let response = fetch_github_data(&fetch_params, RequestMethod::POST(value)).await;
        match response {
            Ok(data) => {
                return Ok::<Value, FreshEyesError>(data);
            }
            Err(e) => match e {
                FreshEyesError::StatusCodeError(error_response) => {
                    if error_response.status == StatusCode::UNPROCESSABLE_ENTITY.as_u16() {
                        return Ok(Value::Object(
                            serde_json::from_str(
                                format!(
                                    r#"
                                        {{
                                            "message": "Reference already exists",
                                            "status": 422
                                        }}
                                        "#,
                                )
                                .as_str(),
                            )
                            .unwrap(),
                        ));
                    } else {
                        return Err(FreshEyesError::StatusCodeError(error_response));
                    }
                }
                _ => return Err(FreshEyesError::Unknown(format!("unknown error: {:?}", e))),
            },
        }
    }
}

/// fetch data from github
pub async fn fetch_github_data(url: &str, method: RequestMethod) -> Result<Value, FreshEyesError> {
    let client = Client::new();
    let mut headers = HeaderMap::new();

    let token = match utils::get_or_prompt_token().await {
        Ok(token) => token,
        Err(_) => return Err(FreshEyesError::MissingTokenError),
    };
    headers.insert(header::USER_AGENT, "Fresh Eyes".parse().unwrap());
    headers.insert(AUTHORIZATION, token.parse().unwrap());
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
        return Err(FreshEyesError::StatusCodeError(ErrorResponse {
            message: format!("status code is not a OK response: {:?}", response.status())
                .to_string(),
            status: response.status().as_u16(),
        }));
    }

    Ok(response.json().await?)
}

pub fn extract_pr_details(data: &Value) -> PullRequestDetails {
    let base_sha = data["base"]["sha"].as_str().unwrap_or_default().to_string();
    let head_sha = data["head"]["sha"].as_str().unwrap_or_default().to_string();
    let base_ref = format!(
        "{}-fresheyes-{}-{}",
        data["base"]["user"]["login"]
            .as_str()
            .unwrap_or_default()
            .to_string(),
        data["base"]["ref"].as_str().unwrap_or_default().to_string(),
        data["number"].as_u64().unwrap_or_default().to_string()
    );
    let head_ref = format!(
        "{}-fresheyes-{}-{}",
        data["head"]["user"]["login"]
            .as_str()
            .unwrap_or_default()
            .to_string(),
        data["head"]["ref"].as_str().unwrap_or_default().to_string(),
        data["number"].as_u64().unwrap_or_default().to_string()
    );
    let title = data["title"].as_str().unwrap_or_default().to_string();
    let body = data["body"].as_str().unwrap_or_default().to_string();

    PullRequestDetails {
        base_sha,
        head_sha,
        base_ref,
        head_ref,
        title,
        body,
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
        let res = extract_pr_details(&serde_json::from_str(data).unwrap());
        assert_eq!(res.base_sha, "ccd7fe8de52bbc9210b444838eefb7ddbc880457");
        assert_eq!(res.head_sha, "8a9cad44a57f1e0057c127ced5078d7e722b9cc8");
        assert_eq!(res.base_ref, "master");
        assert_eq!(res.head_ref, "rounding");
    }
}
