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
  if(!data) return { comments:[], outdatedReviews: [] }
  const outdatedReviews = data
    .filter((x) => x.line === null)
    .map((i) => ({ ...i, outdated: true }));

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

export function getReviewBody<T extends Array<Array<Record<string, any>>>>(
  value: T
) {
  if(!value) return { body: '', comment: [] as any }
  const list = value
    .flat()
    .map((x) => ({ html_url: x.html_url, created_at: x.created_at }));

  const formatString = list
    .map((val) => {
      return `- comment link ${"`" + val.html_url + "`"} at ${formatTime(
        val.created_at
      )}`;
    })
    .join("\n");

  const body = `${
    value.length === 1 ? "An author" : `${value.length} authors`
  } commented here with:\n\n${formatString}.`;

  const comment = value
    .flat()
    .sort(
      (a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    )[0];

  return { body, comment };
}

export function getIssueBody<T extends Record<string, any>>(arg: T) {
  const formatString = `- comment link ${
    "`" + arg.html_url + "`"
  } at ${formatTime(arg.created_at as string)}`;

  const outdatedComment = `This is an **OUTDATED** review comment  as the original pull request may have been rebased or force-pushed\n`;

  const body = `${
    arg?.outdated ? outdatedComment : "An author commented here with:"
  }\n\n${formatString}.`;

  return { body };
}

export function generateIssueBody<T extends Array<Record<string, any>>>(
  arg: T,
  prAuthor: string
) {
  if(!arg) return []
  const userLoginCompare = (item: Record<string, any>, name: string) =>
    item?.user?.login.toLowerCase() === name.toLowerCase();

  const userTypeCompare = (item: Record<string, any>, type: string) =>
    item?.user?.type.toLowerCase() === type.toLowerCase();

  const isBitcoinBot = arg.some(
    (item) => userLoginCompare(item, "DrahtBot") || userTypeCompare(item, "bot")
  );

  const isAuthorPresent = arg.some((item) => userLoginCompare(item, prAuthor));

  const isRegularAuthor = (item: Record<string, any>) =>
    !userLoginCompare(item, prAuthor) &&
    !userLoginCompare(item, "DrahtBot") &&
    !userTypeCompare(item, "bot");

  const authors = new Set(
    arg.filter(isRegularAuthor).map((item) => item.user.login.toLowerCase())
  ).size;
  const uniqueBots = new Set(
    arg
      .filter(
        (item) =>
          userTypeCompare(item, "bot") ||
          (userLoginCompare(item, "DrahtBot") && item.body.trim() !== "")
      )
      .map((item) => item.user.login.toLowerCase())
  ).size;

  const nonBotCommentCount = arg.filter(
    (item) => isRegularAuthor(item) && item.body.trim() !== ""
  ).length;

  const allNonEmptyCommentsCount = arg.filter(
    (item) => item.body.trim() !== ""
  ).length;

  const isReviewWithoutComment = nonBotCommentCount === 0 && authors >= 1;

  const commentText = allNonEmptyCommentsCount === 1 ? "comment" : "comments";
  const reviewersText =
    isReviewWithoutComment || authors === 0
      ? ""
      : authors === 1
      ? "reviewer"
      : "reviewers";

  const botCommentText = uniqueBots === 1 ? "1 bot" : `${uniqueBots} bots`;
  const botComment = isBitcoinBot
    ? isAuthorPresent
      ? `, ${botCommentText}`
      : isReviewWithoutComment || authors === 0
      ? botCommentText
      : `and ${botCommentText}`
    : "";

  const authorText =
    isReviewWithoutComment || authors === 0 ? "" : ` ${authors}`;

  const issueBody = `There ${
    allNonEmptyCommentsCount <= 1 ? "was" : "were"
  } ${allNonEmptyCommentsCount} ${commentText} left by${authorText} ${reviewersText}${botComment} ${
    isAuthorPresent ? "and the author" : ""
  } for this pull request`;

  return [
    {
      body: issueBody,
      created_at: arg[0]?.created_at || new Date().toISOString(),
      key: "issue",
    },
  ];
}

export function getPullReviewBody<T extends Record<string, any>>(
  arg: T,
  event: "APPROVE" | "REQUEST_CHANGES" | "COMMENT"
) {
  const formatString = `- comment link ${
    "`" + arg.html_url + "`"
  } at ${formatTime(arg.submitted_at as string)}`;

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

export function extractData<
  R extends Array<Record<string, any>>,
  I extends Array<Record<string, any>>,
  T extends Array<Record<string, any>>
>(reviews: R, issues: I, pull_reviews: T, prAuthor: string) {
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

  const allIssues = [...issues, ...outdatedReviews, ...pull_reviews];
  const extract_issues = generateIssueBody(allIssues, prAuthor);

  const sortComments: Comment[] = extract_reviews.sort(
    (a, b) =>
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  const allComments: Comment[] = [...extract_issues, ...sortComments];
  return { allComments };
}
