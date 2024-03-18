import { Probot } from "probot";
import { extractData } from "./util";

export = (robot: Probot) => {
  const staging = process.env.BOT_ENV ?? "";

  robot.on(["pull_request.opened"], async (context) => {
    /**  Get information about the pull request **/
    const {
      owner: forked_owner,
      repo: forked_repo,
      pull_number: forked_pull_number,
    } = context.pullRequest();
    const {
      base: {
        label,
        ref,
        repo: { default_branch },
      },
    } = context.payload.pull_request;

    const firstLiteral = ref.split("fresheyes")[1];
    const secondLiteral = firstLiteral.split("-").slice(1, 2).join("-");

    const splitBranch = ref.split("fresheyes")[0];
    const branch_name = `${splitBranch}fresheyes-${secondLiteral}`;
    const shouldRun =
      branch_name ===
      `${splitBranch}fresheyes-${staging ? "staging" : default_branch}`;

    robot.log({
      literal: `${splitBranch}fresheyes-${
        staging ? "staging" : default_branch
      }`,
    });
    robot.log({ shouldRun });

    if (!shouldRun) {
      robot.log("Branch is not the correct branch");
      return;
    }

    const res = await context.octokit.repos.get({
      owner: forked_owner,
      repo: forked_repo,
    });

    const owner = res.data.parent?.owner.login;
    const repo = res.data.parent?.name;
    const pull_number = Number(label.split("-").slice(-1));

    if (!owner || !repo || !pull_number) {
      throw Error(
        `Could not get parent repo information ${owner} ${repo} ${pull_number}`
      );
    }

    const { data: reviewComments } =
      await context.octokit.pulls.listReviewComments({
        owner,
        repo,
        pull_number,
      });

    const { data: issueComments } = await context.octokit.issues.listComments({
      owner,
      repo,
      issue_number: pull_number,
    });

    try {
      if (!reviewComments && !issueComments) {
        return;
      }

      const { allComments } = extractData(reviewComments, issueComments);

      await Promise.all(
        allComments.map(async (val) => {
          /** Create comments according to the time they were added **/
          if (val.key === "review") {
            await context.octokit.pulls.createReviewComment({
              owner: forked_owner,
              repo: forked_repo,
              pull_number: forked_pull_number,
              body: val.body,
              commit_id: val.commit_id,
              path: val.path,
              side: val.side,
              line: Number(val.line),
            });
          } else if (val.key === "issue") {
            await context.octokit.issues.createComment({
              owner: forked_owner,
              repo: forked_repo,
              issue_number: forked_pull_number,
              body: val.body,
            });
          } else {
            return;
          }
        })
      );
    } catch (error) {
      robot.log("there seems to be an issue processing this data");
      throw error;
    }
  });
};
