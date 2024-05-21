"use server";

import axios, { AxiosError } from "axios";

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

  try {
    const response = await axios.post<PullRequestResponse>(
      `${API_URL}/process_pull_request`,
      JSON.stringify({
        owner,
        repo,
        pull_number: Number(pull_number),
      }),
      {
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );
    const data = response.data;
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
  } catch (error) {
    console.log(error);
    if (error instanceof AxiosError && error.response?.status === 403) {
      return {
        error: `Error: You do not have permission to create a pull request in this repository.`,
        data: null,
      };
    } else if (error instanceof AxiosError && error.response?.status === 404) {
      return {
        error: `Error: The repository or pull request does not exist. Please check the repo, owner and PR number to be sure they're correct. If the problem persists, contact support at info@bitcoindevs.xyz`,
        data: null,
      };
    }
    const errMsg =
      error instanceof AxiosError
        ? error.response?.data?.message || error.message
        : "An error occurred. Please try again or contact support at info@bitcoindevs.xyz";
    return {
      error: `Error: ${errMsg}`,
      data: null,
    };
  }
};
