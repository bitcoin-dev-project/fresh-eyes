type Comment = {
  body: string;
  commit_id?: string;
  path?: string;
  side?: "LEFT" | "RIGHT" | undefined;
  line?: number;
  event?: "APPROVE" | "REQUEST_CHANGES" | "COMMENT";
  created_at: string;
  key: string;
};

export function groupCommentsFn<T extends Array<Record<string, any>>>(data: T) {
  const outdatedReviews = data.filter((x) => x.line === null).map((i) => ({ ...i, outdated: true }));

  const comments: Record<string, Array<typeof data>> = data
    .filter((f) => f.line !== null)
    .map((x: any) => ({ ...x, line: String(x.line) }))
    .reduce((acc, curr) => {
      const key = curr.line;

      const group = acc[key] ?? [];

      return { ...acc, [key]: [...group, curr] };
    }, {});

  return { comments, outdatedReviews };
}

function formatTime(arg: string) {
  const date = new Date(arg);

  const year = date.getUTCFullYear();
  const month = (date.getUTCMonth() + 1).toString().padStart(2, "0");
  const day = date.getUTCDate().toString().padStart(2, "0");
  const hours = date.getUTCHours().toString().padStart(2, "0");
  const minutes = date.getUTCMinutes().toString().padStart(2, "0");
  const seconds = date.getUTCSeconds().toString().padStart(2, "0");

  return `${year}/${month}/${day}, ${hours}:${minutes}:${seconds} UTC`;
}

export function getReviewBody<T extends Array<Array<Record<string, any>>>>(value: T) {
  const list = value.flat().map((x) => ({ html_url: x.html_url, created_at: x.created_at }));

  const formatString = list
    .map((val) => {
      return `- comment link ${"`" + val.html_url + "`"} at ${formatTime(val.created_at)}`;
    })
    .join("\n");

  const body = `${value.length === 1 ? "An author" : `${value.length} authors`} commented here with:\n\n${formatString}.`;

  const comment = value.flat().sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())[0];

  return { body, comment };
}

export function getIssueBody<T extends Record<string, any>>(arg: T) {
  const formatString = `- comment link ${"`" + arg.html_url + "`"} at ${formatTime(arg.created_at as string)}`;

  const outdatedComment = `This is an **OUTDATED** review comment  as the original pull request may have been rebased or force-pushed\n`;

  const body = `${arg?.outdated ? outdatedComment : "An author commented here with:"}\n\n${formatString}.`;

  return { body };
}

export function generateIssueBody<T extends Array<Record<string, any>>>(arg: T) {
  const authors = Array.from(new Set(arg.map((item) => item?.user?.login))).length;
  const comments = arg.length;

  return [
    {
      body: `There were ${comments} comments left by ${authors} reviewers for the pull request`,
      created_at: arg[0].created_at,
      key: "issue",
    },
  ];
}

export function getPullReviewBody<T extends Record<string, any>>(arg: T, event: "APPROVE" | "REQUEST_CHANGES" | "COMMENT") {
  const formatString = `- comment link ${"`" + arg.html_url + "`"} at ${formatTime(arg.submitted_at as string)}`;

  let comment = "";

  if (event === "APPROVE") {
    comment = "approved";
  } else if (event === "COMMENT") {
    comment = "commented";
  } else if (event === "REQUEST_CHANGES") {
    comment = `requested changes`;
  } else {
    comment = "";
  }

  const body = `An author reviewed and ${comment} here with:\n\n${formatString}.`;

  return { body };
}

export function extractData<R extends Array<Record<string, any>>, I extends Array<Record<string, any>>, T extends Array<Record<string, any>>>(
  reviews: R,
  issues: I,
  pull_reviews: T
) {
  const { comments, outdatedReviews } = groupCommentsFn(reviews);

  const extract_reviews = Object.entries(comments).map(([key, value]) => {
    const { body, comment } = getReviewBody(value);

    return {
      body: body,
      commit_id: comment.commit_id,
      path: comment.path,
      side: comment.side,
      line: Number(key),
      created_at: comment.created_at,
      key: "review",
    };
  });

  const allIssues = issues.concat(outdatedReviews);
  const extract_issues = generateIssueBody(allIssues);

  const extract_pull_reviews = pull_reviews.map((review) => {
    let event: "APPROVE" | "REQUEST_CHANGES" | "COMMENT" = "COMMENT";
    switch (review.state) {
      case "APPROVED":
        event = "APPROVE";
        break;
      case "CHANGES_REQUESTED":
        event = "REQUEST_CHANGES";
        break;
      default:
        event = "COMMENT";
        break;
    }
    const { body } = getPullReviewBody(review, event);
    return {
      body,
      event,
      commit_id: review.commit_id as string,
      created_at: review.submitted_at,
      key: "pull_review",
    };
  });

  const allComments: Comment[] = [...extract_reviews, ...extract_issues, ...extract_pull_reviews].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  return { allComments };
}
