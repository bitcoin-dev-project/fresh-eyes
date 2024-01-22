use std::process::exit;

use fresh_eyes::{extract_pr_details, Branch, ForkRequest, PullRequest};

#[tokio::main]
async fn main() {
    // let args = cli::get_args();
    // create a fork of the base repository
    let fork = ForkRequest::new("bitcoin".to_string(), "bitcoin".to_string());
    let fork_result = match fork.fork().await {
        Ok(res) => {
            println!("forked successfully: {:?}", res);
            Ok(res)
        }
        Err(e) => {
            println!("{:?}", e);
            Err(e)
        }
    };

    // fetch the desired pull request
    let pull_request =
        PullRequest::from_pull_number("bitcoin".to_string(), "bitcoin".to_string(), 79);
    let pull_request_details = match pull_request.get().await {
        Ok(res) => {
            let pull_request_ref_sha = extract_pr_details(&res);
            println!("pull_request_ref_sha: {:?}", pull_request_ref_sha);
            println!("fork_result: {:?}", fork_result);
            pull_request_ref_sha
        }
        Err(e) => {
            println!("{:?}", e);
            exit(1)
        }
    };
    let owner = String::from(&fork_result.as_ref().expect("fork_result is None").owner);
    let repo = String::from(&fork_result.as_ref().expect("fork_result is None").repo);
    match Branch::new(
        owner.clone(),
        repo.clone(),
        format!(
            "fresheyes-{}-{}",
            pull_request_details.base_ref.clone(),
            pull_request.pull_number.unwrap()
        ),
        pull_request_details.base_sha.clone(),
    )
    .create()
    .await
    {
        Ok(res) => {
            println!("base_branch: {:?}", res);
            res
        }
        Err(e) => {
            println!("{:?}", e);
            exit(1)
        }
    };

    match Branch::new(
        owner.clone(),
        repo.clone(),
        pull_request_details.head_ref.clone(),
        pull_request_details.head_sha.clone(),
    )
    .create()
    .await
    {
        Ok(res) => {
            println!("head_branch: {:?}", res);
            res
        }
        Err(e) => {
            println!("{:?}", e);
            exit(1)
        }
    };

    // create a pull request
    let pull_request = PullRequest::new(
        owner.clone(),
        repo.clone(),
        Some(pull_request_details.title),
        Some(pull_request_details.body),
        format!(
            "fresheyes-{}-{}",
            pull_request_details.base_ref.clone(),
            pull_request.pull_number.unwrap()
        ),
        pull_request_details.head_ref,
    );
    println!("pull_request: {:?}", pull_request);
    match pull_request.create().await {
        Ok(res) => {
            println!("pull_request: {:?}", res);
            let url = res["html_url"].as_str().unwrap();
            println!("url: {:?}", url);
            res
        }
        Err(e) => {
            println!("{:?}", e);
            exit(1)
        }
    };
}
