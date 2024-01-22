# FRESHEYES

## Overview

This tool is designed to streamline the code review process by integrating with GitHub's API. It checks out a pull request (PR) branch, generates patches, and inserts GNU patch(1)-style diff comments, indicating where previous reviewers have left comments. This allows a user to conveniently review a pull request without distractions of the review comments, enhancing the efficiency of the review process.

It is targetted to noobs to a project who wants to undersrand the project code base better by reviewing past and present pul request without comment distractions.

The project consists of a Rust-based CLI tool and a library that can also be compiled to WebAssembly (WASM), allowing for flexible use in various environments.

## Installation

### Prerequisites

- Rust and Cargo (latest stable version): [Install Rust](https://www.rust-lang.org/tools/install)
- Git (for cloning the repository)

### Steps

1. **Clone the Repository:**

    ```bash
    git clone https://github.com/Extheoisah/fresheyes-ref-impl.git
    cd fresheyes-ref-impl
    ```

2. **Build the Project:**

    ```bash
    cargo build --release
    ```

    This command compiles the project and generates an executable in `target/release/`.

## Usage

### Configuring Authorization

Upon first use, the tool will prompt you for your GitHub personal access token. This token will be stored in memory for the duration of the session and will be used for all subsequent GitHub API calls. If you prefer not to enter the token every time you start a new session, you can manually create a ```.fresheyes``` file in your home directory and store your token there:

```bash
echo "your_github_token" > ~/.fresheyes/fresheyes
```

Replace "your_github_token" with your actual GitHub token. This step is optional but recommended for convenience.

Follow this [guide](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens#creating-a-fine-grained-personal-access-token) to create your Personal Access Token.
#### *Select "all repositories" if you intend to use this tool with future repositories or repositories you haven't forked yet*

#### *Note: Your github token must have the following priviledges*
- Administration
- Contents
- Pull requests

### Running the CLI

After installation, you can run the CLI tool as follows:

```bash
cargo run -- owner repo pr_number
```

- `owner`: GitHub username or organization name owning the repository.
- `repo`: Repository name.
- `pr_number`: Pull request number.

Example:

```bash
cargo run -- bitcoin bitcoin 8149
```

**TODOS!**

- generate javascript bindings

- use bindings in client application

### WebAssembly (WASM)

The core functionalities of this tool are also available as a WASM module, allowing integration into web clients. To compile the library to WASM, use:

## Contributing

Contributions to this project are welcome! Please follow these steps:

1. Fork the repository.
2. Create a new branch for your feature or fix.
3. Commit your changes.
4. Push to the branch.
5. Create a new Pull Request.

## Motivation

This tool is a product of the ideas by [David Harding](https://gist.github.com/harding). The gist highlighting his thought process and idea development can be found [here](https://gist.github.com/harding/3b4bb6c4cd003d7bf372e13d06f5363f).

---
