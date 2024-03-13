# FRESHEYES

## Overview

This tool is designed to streamline the code review process by integrating with GitHub's API. It checks out a pull request (PR) branch, generates patches, and inserts GNU patch(1)-style diff comments, indicating where previous reviewers have left comments. This allows a user to conveniently review a pull request without distractions of the review comments, enhancing the efficiency of the review process.

It is targeted to noobs to a project who wants to understand the project code base better by reviewing past and present pull request without comment distractions.

The project consists of a Rust-based CLI tool and an API to help client to connect to our core functions.

## Installation

- The project implements a cli application, an API server and a Next.js client.

### Prerequisites

- Rust and Cargo (latest stable version): [Install Rust](https://www.rust-lang.org/tools/install)
- Git (for cloning the repository)

### Steps

1. **Clone the Repository:**

    ```bash
    git clone https://github.com/Extheoisah/fresheyes-ref-impl.git
    cd fresheyes-ref-impl
    ```

### Using the CLI

### Configuring Authorization

Upon first use, the tool will prompt you for your GitHub personal access token. This token will be stored in memory for the duration of the session and will be used for all subsequent GitHub API calls. If you prefer not to enter the token every time you start a new session, you can manually create a ```.fresheyes``` file in your home directory and store your token there:

```bash
echo "your_github_token" > ~/.fresheyes/fresheyes
```

Replace "your_github_token" with your actual GitHub token. This step is optional but recommended for convenience.

Follow this [guide](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens#creating-a-fine-grained-personal-access-token) to create your Personal Access Token.
#### *Select "all repositories" if you intend to use this tool with future repositories or repositories you haven't forked yet*

#### *Note: Your GitHub token must have the following privileges*
- Administration
- Contents
- Pull requests

### Running the CLI

After installation, you can run the CLI tool as follows:

```bash
cd cli
```

```bash
cargo run -- owner repo pr_number
```

- `owner`: GitHub username or organization name owning the repository.
- `repo`: Repository name.
- `pr_number`: Pull request number.

- The cli will automatically ask for you GitHub token if it's not found in the `.fresheyes` file.

Example:

```bash
cargo run -- bitcoin bitcoin 8149
```

- You can also run the CLI with the `cargo run cli --help` flag to see the available options:


### Setting up API server and client

The server and client can be run separately(independent of the CLI). The API is responsible for handling the GitHub API requests and the client(NextJS) is responsible for handling the user interface.

#### Running the server

- To run the server, use the following command:

> from the project root directory

```bash
cd api
```
- copy the `.env.example` file to `.env` and fill in the required environment variables.
```bash
cargo run
```
- The server will be running on `localhost:8080` to which the client will connect.
- You will need to set up a client that can interact with the API server.
- You have to authenticate with GitHub to use the API server with your authorisation token you generated from GitHub earlier.


#### Running the client
- WIP


## Contributing
Contributions to this project are welcome! Please follow these steps:

1. Fork the repository.
2. Create an issue you want to work on.
3. Create a new branch or your feature or fix.
4. Commit your changes.
5. Push to the branch.
6. Create a new Pull Request.

## Motivation
This tool is a product of the ideas by [David Harding](https://gist.github.com/harding). The gist highlighting his thought process and idea development can be found [here](https://gist.github.com/harding/3b4bb6c4cd003d7bf372e13d06f5363f).

---
