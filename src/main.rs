use fresh_eyes::{extract_base_head_sha, ForkRequest, PullRequest};

#[tokio::main]
async fn main() {
    // let args = cli::get_args();
    let pull_request_from_github =
        PullRequest::from_pull_number("bitcoin".to_string(), "bitcoin".to_string(), 79);
    let response = pull_request_from_github.get().await;

    match response {
        Ok(data) => {
            let base_sha = extract_base_head_sha(&data);
            println!("{:?}", base_sha);
            // create a fork
            let fork = ForkRequest::new("bitcoin".to_string(), "bitcoin".to_string());
            let fork_response = fork.fork().await;
            match fork_response {
                Ok(res) => println!("forked successfully: {:?}", res),
                Err(e) => println!("{:?}", e),
            }
            // TODO! create a branch
        }
        Err(e) => println!("{:?}", e),
    }
}
