mod app_data;
mod cli;

use cli::CliArgs;
use fresh_eyes::{extract_pr_details, get_pull_request_reviews, Branch, ForkRequest, PullRequest};
use std::{env, io, process::exit};
use tokio::process::Command as AsyncCommand;

async fn run_npm_command() -> Result<(), io::Error> {
    let mut cmd = AsyncCommand::new("make").arg("run-js").spawn()?;

    cmd.wait().await.map(|_| ())
}

async fn run(args: CliArgs) -> Result<(), Box<dyn std::error::Error>> {
    let CliArgs {
        owner,
        repo,
        pr_number,
    } = args;

    // create a fork of the base repository
    let fork = ForkRequest::new(&owner, &repo);
    let fork_result = fork.fork().await?;

    // fetch the desired pull request
    let pull_request = PullRequest::from_pull_number(&fork.owner, &fork.repo, pr_number);
    let pull_request_response = pull_request.get().await?;
    let pull_request_details = extract_pr_details(&pull_request_response);

    // create a branch for the base repository
    Branch::new(
        &fork_result.owner,
        &fork_result.repo,
        &pull_request_details.base_ref,
        &pull_request_details.base_sha,
    )
    .create()
    .await?;

    // create a branch for the head repository
    Branch::new(
        &fork_result.owner,
        &fork_result.repo,
        &pull_request_details.head_ref,
        &pull_request_details.head_sha,
    )
    .create()
    .await?;

    // create a pull request
    let new_pull_request = PullRequest::new(
        &fork_result.owner,
        &fork_result.repo,
        Some(&pull_request_details.title),
        Some(&pull_request_details.body),
        &pull_request_details.base_ref,
        &pull_request_details.head_ref,
    );
    let pull_request_result = new_pull_request.create().await?;
    let pull_request_reviews = get_pull_request_reviews(
        &fork.owner,
        &fork.repo,
        pull_request.pull_number.clone().unwrap().into(),
    )
    .await?;

    let url = pull_request_result["html_url"]
        .as_str()
        .map(String::from)
        .or_else(|| {
            if pull_request_reviews.len() > 0 {
                Some(format!(
                    "https://github.com/{}/{}/pull/{}",
                    &fork.owner, &fork.repo, &pr_number
                ))
            } else {
                None
            }
        });

    match url {
        Some(pr_url) => {
            println!("Pull Request URL: {}", pr_url);
            env::set_var("PR_URL", &pr_url);

            if let Err(e) = run_npm_command().await {
                println!("Error: failed to start npm process {}", e);
            } else {
                println!("npm command executed successfully");
            }
        }
        None => {
            println!(
                "{}",
                pull_request_result["message"].as_str().unwrap_or_default()
            );
            println!("No reviews found for this pull request");
        }
    }

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
