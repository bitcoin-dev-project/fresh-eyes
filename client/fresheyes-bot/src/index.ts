import { Probot } from "probot";
import { generateBody, groupCommentsFn } from "./util";

export = (robot: Probot) => {
  robot.on(["pull_request.opened"], async (context) => {
    /**  Get information about the pull request **/
    const { owner: forked_owner, repo: forked_repo, pull_number: forked_pull_number } = context.pullRequest();
    const { label } = context.payload.pull_request.base;
    const res = await context.octokit.repos.get({ owner: forked_owner, repo: forked_repo });

    const owner = res.data.parent?.owner.login;
    const repo = res.data.parent?.name;
    const pull_number = Number(label.split("-").slice(-1));

    if (!owner || !repo || !pull_number) {
      throw Error(`Could not get parent repo information ${owner} ${repo} ${pull_number}`);
    }

    const { data } = await context.octokit.pulls.listReviewComments({ owner, repo, pull_number });

    try {
      if (!data || data.length === 0) {
        return;
      }

      const groupComments: Record<string, Array<typeof data>> = groupCommentsFn(data);

      await Promise.all(
        Object.entries(groupComments).map(async ([key, value]) => {
          const { body, comment } = generateBody(value);

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
