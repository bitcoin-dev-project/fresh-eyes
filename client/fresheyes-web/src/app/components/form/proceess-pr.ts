"use server";

import { auth } from "@/auth";
import { API_URL } from "@/config/process";
import { PullRequest, PullRequestResponse } from "@/types";

export const processPr = async (args: PullRequest) => {
  const { owner, repo, pull_number } = args;
  const session = await auth();
  if (!session || !session?.accessToken) {
    return {
      error: "You must be logged in to process a pull request",
      data: null,
    };
  }

  const response = await fetch(`${API_URL}/process_pull_request`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${session.accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ owner, repo, pull_number: Number(pull_number) }),
  });
  if (!response.ok) {
    return {
      error: `Error: ${response.statusText} Please try again or contact support at info@bitcoindevs.xyz`,
      data: null,
    };
  }
  const data = await response.json();
  if (!data.pr_url) {
    return {
      error: `Error: The pull request has already been recreated earlier. Try another one.`,
      data: null,
    };
  }
  return {
    error: null,
    data: data as PullRequestResponse,
  };
};
