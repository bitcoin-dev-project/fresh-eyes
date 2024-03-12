import { Probot } from "probot";
import { generateBody, groupCommentsFn } from "./util";

export = (robot: Probot) => {
  robot.on(["installation_repositories.added"], async (context) => {
    const { login: owner } = context.payload.installation.account;

    const { data: listPulls } = await context.octokit.pulls.list({ owner, repo: "bitcoin" });

    if (listPulls.length > 1) {
      return;
    }

    const { data } = await context.octokit.pulls.listReviewComments({ owner, repo: listPulls[0].base.repo.name, pull_number: listPulls[0].number });

    try {
      if (!data || data.length === 0) {
        return;
      }

      const groupComments: Record<string, Array<typeof data>> = groupCommentsFn(data);

      await Promise.all(
        Object.entries(groupComments).map(async ([key, value]) => {
          const { body, comment } = generateBody(value);

          const res = await context.octokit.pulls.createReviewComment({
            owner,
            repo: listPulls[0].base.repo.name,
            pull_number: listPulls[0].number,
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

  robot.on(["pull_request.opened"], async (context) => {
    /**  Get information about the pull request **/
    const { owner, repo, pull_number: number } = context.pullRequest();
    const pull_number = number ?? context.payload.number;

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
            owner,
            repo,
            pull_number,
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
