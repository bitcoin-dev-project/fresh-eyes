use reqwest::{
    header::{self, HeaderMap, AUTHORIZATION},
    Client, StatusCode,
};
use serde::{Deserialize, Serialize};
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
pub struct PullRequest<'a> {
    /// repository owner
    pub owner: &'a str,
    /// name of repository
    pub repo: &'a str,
    pub title: Option<&'a str>,
    pub body: Option<&'a str>,
    /// The name of the branch where your changes are implemented.
    /// For cross-repository pull requests in the same network, namespace head with a user like this: username:branch.
    pub head: Option<&'a str>,
    /// The name of the branch you want the changes pulled into.
    /// This should be an existing branch on the current repository.
    pub base: Option<&'a str>,
    pub pull_number: Option<u32>,
}

pub struct Branch<'a> {
    pub owner: &'a str,
    pub repo: &'a str,
    pub branch_ref: &'a str,
    pub sha: &'a str,
}

#[derive(Debug, Serialize)]
pub struct ForkRequest<'a> {
    pub owner: &'a str,
    pub repo: &'a str,
}

#[derive(Debug, Serialize)]
pub struct ForkResult {
    pub owner: String,
    pub repo: String,
    pub forked_repo: String,
}

impl ForkResult {
    pub fn new(owner: String, repo: String, forked_repo: String) -> Self {
        Self {
            owner,
            repo,
            forked_repo,
        }
    }
}

#[derive(Serialize, Deserialize, Debug)]
pub struct UserFields {
    pub login: String,
}
#[derive(Debug, Serialize, Deserialize)]
pub struct ReviewComment {
    pub id: u64,
    pub body: String,
    #[serde(rename = "commit_id")]
    pub commit_id: String,
    pub path: String,
    pub line: Option<u64>,
    #[serde(rename = "start_line")]
    pub start_line: Option<u64>,
    #[serde(rename = "original_line")]
    pub original_line: Option<u64>,
    pub position: Option<u64>,
    #[serde(rename = "original_position")]
    pub original_position: Option<u64>,
    pub side: String,
    pub start_side: Option<String>,
    pub url: String,
    #[serde(rename = "html_url")]
    pub html_url: String,
    #[serde(rename = "subject_type")]
    pub subject_type: Option<String>,
    #[serde(rename = "created_at")]
    pub created_at: String,
    #[serde(rename = "updated_at")]
    pub updated_at: String,
    pub user: UserFields,
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

impl<'a> PullRequest<'a> {
    /// construct pull request params to create a pull request
    pub fn new(
        owner: &'a str,
        repo: &'a str,
        title: Option<&'a str>,
        body: Option<&'a str>,
        base: &'a str,
        head: &'a str,
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
    pub fn from_pull_number(owner: &'a str, repo: &'a str, pull_number: u32) -> Self {
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
            "title": self.title,
            "body": self.body,
            "base": self.base,
            "head": self.head
        });

        let response = fetch_github_data(&fetch_params, RequestMethod::POST(value)).await;
        // hceck if pull request already exists
        return match response {
            Ok(data) => Ok::<Value, FreshEyesError>(data),
            Err(e) => match e {
                FreshEyesError::StatusCodeError(error_response) => {
                    if error_response.status == StatusCode::UNPROCESSABLE_ENTITY.as_u16() {
                        let base = self.base.unwrap_or_default();
                        let head = self.head.unwrap_or_default();
                        let json_message = json!({
                            "message": format!("A pull request already exists for {:?}<-->{:?}", base, head),
                            "status": 422
                        });
                        Ok(json_message)
                    } else {
                        Err(FreshEyesError::StatusCodeError(error_response))
                    }
                }
                _ => Err(FreshEyesError::Unknown(format!("unknown error: {:?}", e))),
            },
        };
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
        return match response {
            Ok(data) => Ok::<Value, FreshEyesError>(data),
            Err(e) => {
                if let FreshEyesError::StatusCodeError(error_response) = e {
                    return if error_response.status == StatusCode::NOT_FOUND.as_u16() {
                        Err(FreshEyesError::StatusCodeError(ErrorResponse {
                            message: "pull request not found!".to_string(),
                            status: error_response.status,
                        }))
                    } else {
                        Err(FreshEyesError::StatusCodeError(error_response))
                    };
                }
                Err(FreshEyesError::Unknown(format!("unknown error: {:?}", e)))
            }
        };
    }
}

impl<'a> ForkRequest<'a> {
    pub fn new(owner: &'a str, repo: &'a str) -> Self {
        Self { owner, repo }
    }

    /// create a fork
    pub async fn fork(&self) -> Result<ForkResult, FreshEyesError> {
        let fetch_params = format!(
            "https://api.github.com/repos/{}/{}/forks",
            self.owner, self.repo
        );
        let value = json!({
            "default_branch_only": false
        });
        let response = fetch_github_data(&fetch_params, RequestMethod::POST(value)).await;
        return match response {
            Ok(data) => {
                let forked_repo = data["html_url"].as_str().unwrap_or_default().to_string();
                let owner = data["owner"]["login"]
                    .as_str()
                    .unwrap_or_default()
                    .to_string();
                let fork_result = ForkResult {
                    owner,
                    repo: self.repo.to_string(),
                    forked_repo,
                };
                Ok(fork_result)
            }
            Err(e) => Err(FreshEyesError::ForkError(format!(
                "error forking the reposotory: {:?}",
                e
            ))),
        };
    }
}

impl<'a> Branch<'a> {
    pub fn new(owner: &'a str, repo: &'a str, branch_ref: &'a str, sha: &'a str) -> Self {
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
        return match response {
            Ok(data) => Ok::<Value, FreshEyesError>(data),
            Err(e) => match e {
                FreshEyesError::StatusCodeError(error_response) => {
                    if error_response.status == StatusCode::UNPROCESSABLE_ENTITY.as_u16() {
                        Ok(json!({
                            "message": format!("Branch already exists!"),
                            "status": 422
                        }))
                    } else {
                        Err(FreshEyesError::StatusCodeError(error_response))
                    }
                }
                _ => Err(FreshEyesError::Unknown(format!("unknown error: {:?}", e))),
            },
        };
    }
}

pub async fn get_pull_request_reviews(
    owner: &str,
    repo: &str,
    pull_number: u64,
) -> Result<Vec<ReviewComment>, FreshEyesError> {
    let fetch_params = format!(
        "https://api.github.com/repos/{}/{}/pulls/{}/comments",
        owner, repo, pull_number
    );
    let response = fetch_github_data(&fetch_params, RequestMethod::GET).await?;
    serde_json::from_value::<Vec<ReviewComment>>(response)
        .map_err(|e| FreshEyesError::Unknown(format!("Deserialization error: {:?}", e)))
}

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
