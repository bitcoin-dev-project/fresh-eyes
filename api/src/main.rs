mod app_data;
pub mod server_auth;

use actix_web::{
    get, post, web, App, HttpMessage, HttpRequest, HttpResponse, HttpServer, Responder,
};
use dotenv::dotenv;
use fresh_eyes_api::{
    extract_pr_details, Branch as LibBranch, ForkRequest as LibForkRequest,
    PullRequest as LibPullRequest,
};
use serde::{Deserialize, Serialize};
use server_auth::Authentication;
use std::env;

use crate::app_data::AppData;

#[get("/")]
async fn hello() -> impl Responder {
    HttpResponse::Ok().body("Hello world!")
}
// Define a struct to receive the pull request data
#[derive(Deserialize, Debug)]
pub struct PullRequest {
    owner: String,
    repo: String,
    pull_number: i32,
}

// Define a struct for the response
#[derive(Serialize)]
pub struct PrResponse {
    pr_url: String,
}

// Implement the process_pull_request function
#[post("/process_pull_request")]
async fn process_pull_requests(req: HttpRequest, pr: web::Json<PullRequest>) -> impl Responder {
    let extensions = req.extensions();
    let app_data = extensions
        .get::<AppData>()
        .expect("AppData not found in request extensions");
    let token = app_data.token.lock().unwrap().clone();

    let pull_request = pr.into_inner();

    // Create a fork of the base repository
    let fork = LibForkRequest::new(&pull_request.owner, &pull_request.repo);
    let fork_result = match fork.fork(token.clone()).await {
        Ok(result) => result,
        Err(e) => {
            return HttpResponse::InternalServerError()
                .body(format!("Failed to fork repository: {}", e));
        }
    };


    // Fetch the desired pull request
    let pull_request_instance = LibPullRequest::from_pull_number(
        &pull_request.owner,
        &pull_request.repo,
        pull_request.pull_number as u32,
    );
    let pull_request_response = match pull_request_instance.get(token.clone()).await {
        Ok(response) => response,
        Err(e) => {
            return HttpResponse::InternalServerError()
                .body(format!("Failed to fetch pull request: {}", e));
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
    if let Err(e) = base_branch.create(token.clone()).await {
        return HttpResponse::InternalServerError()
            .body(format!("Failed to create base branch: {}", e));
    }

    // Create a branch for the head repository
    let head_branch = LibBranch::new(
        &fork_result.owner,
        &fork_result.repo,
        &pull_request_details.head_ref,
        &pull_request_details.head_sha,
    );
    if let Err(e) = head_branch.create(token.clone()).await {
        return HttpResponse::InternalServerError()
            .body(format!("Failed to create head branch: {}", e));
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
    let pull_request_result = match new_pull_request.create(token.clone()).await {
        Ok(data) => data,
        Err(e) => {
            return HttpResponse::InternalServerError()
                .body(format!("Failed to create pull request: {}", e));
        }
    };

    // Extract the pr_url
    let pr_url = pull_request_result["html_url"]
        .as_str()
        .map(String::from)
        .unwrap_or_default();

    let pr_response = PrResponse { pr_url };
    HttpResponse::Ok().json(pr_response)
}
#[actix_web::main]
async fn main() -> std::io::Result<()> {
    dotenv().ok(); // load the environment variables

    let port: u16 = env::var("SERVER_PORT")
        .unwrap_or_else(|_| String::from("8080")) // provide a default value
        .parse()
        .expect("SERVER_PORT must be a number");
    println!("Server is running on port {}", port);

    HttpServer::new(move || {
        App::new()
            .wrap(Authentication)
            .service(hello)
            .service(process_pull_requests)
    })
    .bind(("0.0.0.0", port))?
    .run()
    .await
}
