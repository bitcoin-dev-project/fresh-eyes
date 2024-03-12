"use server";

import { auth } from "@/auth";
import { App } from "@octokit/app";
import { Octokit } from "octokit";

type InstallationCheckResult = {
  success: boolean;
  installed: boolean;
  error: string | null;
};

const app = new App({
  appId: process.env.GITHUB_APP_ID ?? 0,
  privateKey: process.env.GITHUB_PRIVATE_KEY ?? "",
});

export async function checkIfAppInstalledInRepo({ repoName }: { repoName: string }): Promise<InstallationCheckResult> {
  const session = await auth();
  if (!session || !session?.user?.login || !session?.accessToken) {
    return {
      error: "You must be logged in to process a pull request",
      success: false,
      installed: false,
    };
  }
  const loginRepoName = `${session.user.login.toLowerCase()}/${repoName.toLowerCase()}`;
  try {
    const installations = await app.octokit.request("GET /app/installations");
    for (const installation of installations.data) {
      if (installation.account && installation.account.login.toLowerCase() === session.user.login.toLowerCase()) {
        const installationOctokit = await app.getInstallationOctokit(installation.id);

        try {
          const repos = await installationOctokit.request("GET /installation/repositories");

          // Check if the specific repo is in the list of accessible repos for the installation
          const repoInstalled = repos.data.repositories.some((repo) => repo.full_name.toLowerCase() === loginRepoName);

          return {
            success: true,
            installed: repoInstalled ? true : false,
            error: null,
          };
        } catch (repoError) {
          console.error("Error accessing repositories for installation:", repoError);
          return {
            error: "Error accessing repositories for installation",
            success: false,
            installed: false,
          };
        }
      }
    }
  } catch (installationError) {
    console.error("Error fetching installations:", installationError);
    return {
      error: "Error fetching installations",
      success: false,
      installed: false,
    };
  }

  return {
    error: "Installation not found",
    success: false,
    installed: false,
  };
}

export const forkRepository = async ({ owner, repo }: { owner: string; repo: string }) => {
  const token = await auth();
  const octokit = new Octokit({ auth: token?.accessToken });

  try {
    const forkRepo = await octokit.rest.repos.createFork({ owner, repo });

    return {
      data: forkRepo.data,
      error: null,
    };
  } catch (error) {
    return {
      data: null,
      error: `Unable to perform this action at this time`,
    };
  }
};
