import { Probot } from "probot";
import { generateBody, groupCommentsFn } from "./util";

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
      label,
      ref,
      repo: { default_branch },
    } = context.payload.pull_request.base;
    const branch_name = ref.split("-").slice(0, 3).join("-");
    const shouldRun =
      branch_name ===
      `${forked_repo}-fresheyes-${staging ? "staging" : default_branch}`;
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

    const { data } = await context.octokit.pulls.listReviewComments({
      owner,
      repo,
      pull_number,
    });

    try {
      if (!data || data.length === 0) {
        return;
      }

      const groupComments: Record<string, Array<typeof data>> = groupCommentsFn(
        data
      );

      await Promise.all(
        Object.entries(groupComments).map(async ([key, value]) => {
          const { body, comment } = generateBody(value);

          if (!key) {
            // if key is undefined, we should not process this data
            // but we should not throw an error
            // continue to the next iteration
            return;
          }
          const res = await context.octokit.pulls.createReviewComment({
            owner: forked_owner,
            repo: forked_repo,
            pull_number: forked_pull_number,
            body: body,
            commit_id: comment.commit_id,
            path: comment.path,
            side: comment.side,
            line: Number(key),
          });

          return res;
        })
      );
    } catch (error) {
      robot.log("there seems to be an issue processing this data");
      throw error;
    }
  });
};
