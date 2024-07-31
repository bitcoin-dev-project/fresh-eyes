import { Probot } from "probot";
import { extractData, groupReviewsByApprovals } from "./util";

export = (robot: Probot) => {
  const staging = process.env.BOT_ENV ?? "";

  robot.on(["pull_request.opened"], async (context) => {
    /**  Get information about the pull request **/
    const { owner: forked_owner, repo: forked_repo, pull_number: forked_pull_number } = context.pullRequest();
    const {
      base: {
        label,
        ref,
        repo: { default_branch },
      },
    } = context.payload.pull_request;
    console.log({ forked_pull_number });

    const firstLiteral = ref.split("fresheyes")[1];
    const secondLiteral = firstLiteral.split("-").slice(1, 2).join("-");

    const splitBranch = ref.split("fresheyes")[0];
    const branch_name = `${splitBranch}fresheyes-${secondLiteral}`;
    const shouldRun = branch_name === `${splitBranch}fresheyes-${staging ? "staging" : default_branch}`;

    robot.log({
      literal: `${splitBranch}fresheyes-${staging ? "staging" : default_branch}`,
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
      throw Error(`Could not get parent repo information ${owner} ${repo} ${pull_number}`);
    }

    const { data } = await context.octokit.pulls.get({ owner, repo, pull_number });
    const prAuthor = data.user?.login as string;
    console.log({ prAuthor });

    const fetchComments = async ({ type }: { type: "LISTREVIEWCOMMENTS" | "LISTREVIEWS" | "LISTCOMMENTS" }) => {
      let comments: any[] = [];
      let page = 1;
      const per_page = 100;

      while (true) {
        const params = {
          owner,
          repo,
          page,
          per_page,
        };

        let data: any[] = [];

        if (type === "LISTREVIEWCOMMENTS") {
          // const iteratorFunction = await context.octokit.paginate(context.octokit.rest.pulls.listReviews, {
          //   owner: owner,
          //   repo: repo,
          //   pull_number: pull_number,
          //   per_page,
          // });

          data = (await context.octokit.pulls.listReviewComments({ ...params, pull_number })).data;
        } else if (type === "LISTREVIEWS") {
          data = (await context.octokit.pulls.listReviews({ ...params, pull_number })).data;
        } else if (type === "LISTCOMMENTS") {
          data = (await context.octokit.issues.listComments({ ...params, issue_number: pull_number })).data;
        } else {
          return { comments };
        }

        comments = comments.concat(data);
        if (data.length < per_page) break;
        page++;
      }

      return { comments };
    };

    const { comments: reviewComments } = await fetchComments({ type: "LISTREVIEWCOMMENTS" });
    const { comments: approvalComments } = await fetchComments({ type: "LISTREVIEWS" });
    const { comments: issueComments } = await fetchComments({ type: "LISTCOMMENTS" });

    try {
      if (!reviewComments && !issueComments && !approvalComments) {
        return;
      }

      const { allComments } = extractData(reviewComments, issueComments, approvalComments, prAuthor);
      const reviewThreads = groupReviewsByApprovals({ reviewComments, approvalComments });

      // console.log({ approvalComments });
      console.log({ allComments_length: allComments.length });
      console.log({ reviewThreads_length: reviewThreads.length });
      // console.log({ reviewThreads: reviewThreads });

      await Promise.all(
        reviewThreads.map(async (review) => {
          const { key, values } = review;

          const reviewComments = values?.map((review) => ({ path: review.key.path, body: review.key.body }));

          // console.log({ reviewComments });

          await context.octokit.pulls.createReview({
            owner: forked_owner,
            repo: forked_repo,
            pull_number: forked_pull_number,
            body: key.body,
            commit_id: key.commit_id,
            event: key.state,
            comments: reviewComments,
            // comments: [{ path: valueObj.path, body: valueObj.body }],
            // comments: [values?.[index].key],
          });

          console.log("CREATE REVIEW");

          // values?.map(async (thread) => {
          //   const { key, values: replies } = thread;

          //   await context.octokit.pulls.createReviewComment({
          //     owner: forked_owner,
          //     repo: forked_repo,
          //     pull_number: forked_pull_number,
          //     body: key.body,
          //     commit_id: key.commit_id,
          //     path: key.path,
          //     side: key.side,
          //     line: undefined,
          //     // line: Number(key.line),
          //   });

          //   console.log("CREATE-REVIEW-COMMENT");

          //   replies?.map(async (reply) => {
          //     await context.octokit.pulls.createReplyForReviewComment({
          //       owner: forked_owner,
          //       repo: forked_repo,
          //       pull_number: forked_pull_number,
          //       body: reply.body,
          //       comment_id: key.id,
          //     });
          //   });
          //   console.log("CREATED REPLIES FOR REVIEWS");
          // });
        })
      );

      // await Promise.all(
      //   allComments.map(async (val) => {
      //     /** Create comments according to the time they were added **/
      //     if (val.key === "issue") {
      //       await context.octokit.issues.createComment({
      //         owner: forked_owner,
      //         repo: forked_repo,
      //         issue_number: forked_pull_number,
      //         body: val.body,
      //       });
      //     } else if (val.key === "review") {
      //       await context.octokit.pulls.createReviewComment({
      //         owner: forked_owner,
      //         repo: forked_repo,
      //         pull_number: forked_pull_number,
      //         body: val.body,
      //         commit_id: val.commit_id,
      //         path: val.path,
      //         side: val.side,
      //         line: Number(val.line),
      //       });
      //     } else if (val.key === "pull_review") {
      //       await context.octokit.pulls.createReview({
      //         owner: forked_owner,
      //         repo: forked_repo,
      //         pull_number: forked_pull_number,
      //         body: val.body,
      //         commit_id: val.commit_id,
      //         event: val.event,
      //       });
      //     } else {
      //       return;
      //     }
      //   })
      // );
    } catch (error) {
      robot.log("there seems to be an issue processing this data");
      throw error;
    }
  });
};
