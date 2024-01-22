mod cli;

use cli::CliArgs;
use fresh_eyes::{extract_pr_details, Branch, ForkRequest, PullRequest};
use std::process::exit;

async fn run(args: CliArgs) -> Result<(), Box<dyn std::error::Error>> {
    let CliArgs {
        owner,
        repo,
        pr_number,
    } = args;

    // create a fork of the base repository
    let fork = ForkRequest::new(owner.to_string(), repo.to_string());
    let fork_result = fork.fork().await?;

    // fetch the desired pull request
    let pull_request =
        PullRequest::from_pull_number(fork.owner.to_string(), fork.repo.to_string(), pr_number);
    let pull_request_response = pull_request.get().await?;
    let pull_request_details = extract_pr_details(&pull_request_response);

    // create a branch for the base repository
    Branch::new(
        fork_result.owner.clone(),
        fork_result.repo.clone(),
        pull_request_details.base_ref.clone(),
        pull_request_details.base_sha.clone(),
    )
    .create()
    .await?;

    // create a branch for the head repository
    Branch::new(
        fork_result.owner.clone(),
        fork_result.repo.clone(),
        pull_request_details.head_ref.clone(),
        pull_request_details.head_sha.clone(),
    )
    .create()
    .await?;

    // create a pull request
    let new_pull_request = PullRequest::new(
        fork_result.owner.clone(),
        fork_result.repo.clone(),
        Some(pull_request_details.title),
        Some(pull_request_details.body),
        pull_request_details.base_ref,
        pull_request_details.head_ref,
    );
    let pull_request_result = new_pull_request.create().await?;

    println!(
        "Created fresh pull request: {}",
        pull_request_result["html_url"].as_str().unwrap()
    );

    Ok(())
}

#[tokio::main]
async fn main() {
    let args = cli::run_cli();

    if let Err(e) = run(args).await {
        println!("Error: {}", e);
        exit(1);
    }
}
