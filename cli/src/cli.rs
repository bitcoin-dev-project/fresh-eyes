use clap::{App, Arg};

/// The command line arguments
pub struct CliArgs {
    /// The owner of the repository
    pub owner: String,
    /// The name of the repository
    pub repo: String,
    /// The pull request number you want to review
    pub pr_number: u32,
}

/// Parses the command line arguments
pub fn run_cli() -> CliArgs {
    let args = App::new("Fresh Eyes")
        .version("0.1.0")
        .author("Chaincode Labs <https://chaincode.com>")
        .about("Review pull requests with a fresh set of eyes, away from the noise of the comments section.")
        .arg(
            Arg::with_name("owner")
                .help("The owner of the repository")
                .required(true)
                .index(1),
        )
        .arg(
            Arg::with_name("repo")
                .help("The name of the repository")
                .required(true)
                .index(2),
        )
        .arg(
            Arg::with_name("pr_number")
                .help("The pull request number you want to review")
                .required(true)
                .index(3),
        )
        .get_matches();

    return CliArgs {
        owner: args.value_of("owner").unwrap().to_string(),
        repo: args.value_of("repo").unwrap().to_string(),
        pr_number: args
            .value_of("pr_number")
            .unwrap()
            .parse()
            .expect("Invalid pull request number"),
    };
}
