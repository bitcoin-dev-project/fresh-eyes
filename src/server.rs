use dotenv::dotenv;
use fresh_eyes::{
    extract_pr_details, Branch as LibBranch,
    ForkRequest as LibForkRequest, PullRequest as LibPullRequest,
};
use fresheyes::git_hub_service_server::{GitHubService, GitHubServiceServer};
use fresheyes::{Branch, ForkRequest, ForkResult, PrResponse, PullRequest, PullRequestDetails, Empty};
use std::env;
use tonic::{transport::Server, Request, Response, Status};
use serde::Deserialize;
use tonic_web::enable;

#[derive(Deserialize)]
struct BranchData {
    owner: String,
    repo: String,
    branch_ref: String,
    sha: String,
}

pub mod fresheyes {
    tonic::include_proto!("fresheyes");
}

#[derive(Debug, Default)]
pub struct GitHubServiceImpl {
    pub github_token: String,
}

impl GitHubServiceImpl {
    pub fn new(github_token: String) -> Self {
        Self { github_token }
    }
}
#[tonic::async_trait]
impl GitHubService for GitHubServiceImpl {
    // Implementation of the fork_repository method
    async fn fork_repository(
        &self,
        request: Request<ForkRequest>,
    ) -> Result<Response<ForkResult>, Status> {
        let fork_request = request.into_inner();

        let fork_request = LibForkRequest {
            owner: &fork_request.owner,
            repo: &fork_request.repo,
        };

        // Call the fork method to fork the repository on GitHub
        match fork_request.fork().await {
            Ok(data) => {
                Ok(Response::new(ForkResult {
                    owner: data.owner,
                    repo: data.repo,
                    forked_repo: data.forked_repo,
                }))
            }
            Err(e) => {
                // If there was an error, return it
                Err(Status::internal(format!(
                    "Failed to fork repository: {}",
                    e
                )))
            }
        }
    }


    async fn create_branch(&self, request: Request<Branch>) -> Result<Response<Branch>, Status> {
        let branch = request.into_inner();

        let branch = LibBranch {
            owner: &branch.owner,
            repo: &branch.repo,
            branch_ref: &branch.branch_ref,
            sha: &branch.sha,
        };

        match branch.create().await {
            Ok(data) => {
                let branch_data: BranchData = serde_json::from_value(data)
                    .map_err(|e| Status::internal(format!("Failed to parse branch data: {}", e)))?;

                let branch = Branch {
                    owner: branch_data.owner,
                    repo: branch_data.repo,
                    branch_ref: branch_data.branch_ref,
                    sha: branch_data.sha,
                };

                Ok(Response::new(branch))
            }
            Err(e) => Err(Status::internal(format!("Failed to create branch: {}", e))),
        }
    }

    async fn create_pull_request(
        &self,
        request: Request<PullRequest>,
    ) -> Result<Response<PullRequestDetails>, Status> {
        let pull_request = request.into_inner();

        // Fetch the desired pull request
        let pull_request_instance = LibPullRequest::from_pull_number(
            &pull_request.owner,
            &pull_request.repo,
            pull_request.pull_number as u32,
        );
        let pull_request_response = match pull_request_instance.get().await {
            Ok(response) => response,
            Err(e) => {
                return Err(Status::internal(format!(
                    "Failed to fetch pull request: {}",
                    e
                )))
            }
        };
        let pull_request_details = extract_pr_details(&pull_request_response);

        // Create a fork of the base repository
        let fork = LibForkRequest::new(&pull_request.owner, &pull_request.repo);
        let fork_result = match fork.fork().await {
            Ok(result) => result,
            Err(e) => {
                return Err(Status::internal(format!(
                    "Failed to fork repository: {}",
                    e
                )))
            }
        };

        // Create a branch for the base repository
        let base_branch = LibBranch::new(
            &fork_result.owner,
            &fork_result.repo,
            &pull_request_details.base_ref,
            &pull_request_details.base_sha,
        );
        if let Err(e) = base_branch.create().await {
            return Err(Status::internal(format!(
                "Failed to create base branch: {}",
                e
            )));
        }

        // Create a branch for the head repository
        let head_branch = LibBranch::new(
            &fork_result.owner,
            &fork_result.repo,
            &pull_request_details.head_ref,
            &pull_request_details.head_sha,
        );
        if let Err(e) = head_branch.create().await {
            return Err(Status::internal(format!(
                "Failed to create head branch: {}",
                e
            )));
        }

        // Create a new pull request
        let new_pull_request = LibPullRequest::new(
            &fork_result.owner,
            &fork_result.repo,
            Some(&pull_request.title),
            Some(&pull_request.body),
            &pull_request_details.base_ref,
            &pull_request_details.head_ref,
        );

        match new_pull_request.create().await {
            Ok(data) => {
                // If the pull request was created successfully, extract the details
                let pr_details = extract_pr_details(&data);
                let details = PullRequestDetails {
                    base_ref: pr_details.base_ref,
                    head_ref: pr_details.head_ref,
                    title: pr_details.title,
                    body: pr_details.body,
                    base_sha: pr_details.base_sha,
                    head_sha: pr_details.head_sha,
                };
                Ok(Response::new(details))
            }
            Err(e) => {
                // If there was an error, return it
                Err(Status::internal(format!(
                    "Failed to create pull request: {}",
                    e
                )))
            }
        }
    }

    async fn process_pull_request(
        &self,
        request: Request<PullRequest>,
    ) -> Result<Response<PrResponse>, Status> {
        let pull_request = request.into_inner();

        // Create a fork of the base repository
        let fork = LibForkRequest::new(&pull_request.owner, &pull_request.repo);
        let fork_result = match fork.fork().await {
            Ok(result) => result,
            Err(e) => {
                return Err(Status::internal(format!(
                    "Failed to fork repository: {}",
                    e
                )));
            }
        };

        // Fetch the desired pull request
        let pull_request_instance = LibPullRequest::from_pull_number(
            &pull_request.owner,
            &pull_request.repo,
            pull_request.pull_number as u32,
        );
        let pull_request_response = match pull_request_instance.get().await {
            Ok(response) => response,
            Err(e) => {
                return Err(Status::internal(format!(
                    "Failed to fetch pull request: {}",
                    e
                )));
            }
        };

        let pull_request_details = extract_pr_details(&pull_request_response);

        // Create a branch for the base repository
        let base_branch = LibBranch::new(
            &fork_result.owner,
            &fork_result.repo,
            &pull_request_details.base_ref,
            &pull_request_details.base_sha,
        );
        if let Err(e) = base_branch.create().await {
            return Err(Status::internal(format!(
                "Failed to create base branch: {}",
                e
            )));
        }

        // Create a branch for the head repository
        let head_branch = LibBranch::new(
            &fork_result.owner,
            &fork_result.repo,
            &pull_request_details.head_ref,
            &pull_request_details.head_sha,
        );
        if let Err(e) = head_branch.create().await {
            return Err(Status::internal(format!(
                "Failed to create head branch: {}",
                e
            )));
        }

        // Create a new pull request
        let new_pull_request = LibPullRequest::new(
            &fork_result.owner,
            &fork_result.repo,
            Some(&pull_request_details.title),
            Some(&pull_request_details.body),
            &pull_request_details.base_ref,
            &pull_request_details.head_ref,
        );
        let pull_request_result = match new_pull_request.create().await {
            Ok(data) => data,
            Err(e) => {
                return Err(Status::internal(format!(
                    "Failed to create pull request: {}",
                    e
                )));
            }
        };

        // Extract the pr_url
        let pr_url = pull_request_result["html_url"]
            .as_str()
            .map(String::from)
            .unwrap_or_default();

        let pr_response = PrResponse { pr_url };
        Ok(Response::new(pr_response))
    }

    //check if the server is running
    async fn check(&self, request: Request<Empty>) -> Result<Response<Empty>, Status> {
        println!("Received Check request: {:?}", request);
        // Simply return an empty response
        let reply = Empty {};
        Ok(Response::new(reply))
    }

}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    dotenv().ok();
    let addr = "[::1]:50051".parse()?;
    let github_token = env::var("GITHUB_TOKEN").expect("GITHUB_TOKEN must be set");
    let github_service = GitHubServiceImpl::new(github_token);

    println!("Server running on {}", addr);

    Server::builder()
        .accept_http1(true)
        .add_service(enable(GitHubServiceServer::new(github_service)))
        .serve(addr)
        .await?;

    Ok(())
}
