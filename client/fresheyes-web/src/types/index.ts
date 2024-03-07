export type PullRequest = {
  owner: string;
  repo: string;
  pull_number: number;
};

export type PullRequestResponse = {
  pr_url: string;
};
