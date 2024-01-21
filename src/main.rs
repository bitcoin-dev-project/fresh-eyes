use fresh_eyes::{extract_base_head_sha, fetch_github_data, PullRequestRequest, RequestMethod};

#[tokio::main]
async fn main() {
    // let args = cli::get_args();
    let params: PullRequestRequest = PullRequestRequest {
        owner: "bitcoin".to_string(),
        repo: "bitcoin".to_string(),
        pull_number: 79,
    };
    let url = format!(
        "https://api.github.com/repos/{}/{}/pulls/{}",
        params.owner, params.repo, params.pull_number
    );
    let res = fetch_github_data(&url, RequestMethod::GET).await;
    match res {
        Ok(data) => {
            // println!("{:?}", data);
            let base_sha = extract_base_head_sha(&data);
            println!("{:?}", base_sha);
        }
        Err(e) => println!("{}", e),
    }
}
