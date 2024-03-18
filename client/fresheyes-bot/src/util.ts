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
  const comments: Record<string, Array<typeof data>> = data
    .filter((f) => f.line !== null)
    .map((x: any) => ({ ...x, line: String(x.line) }))
    .reduce((acc, curr) => {
      const key = curr.line;

      const group = acc[key] ?? [];

      return { ...acc, [key]: [...group, curr] };
    }, {});

  return comments;
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

export function getIssueBody<T extends Pick<T, "html_url" | "created_at">>(
  arg: T
) {
  const formatString = `- comment link ${
    "`" + arg.html_url + "`"
  } at ${formatTime(arg.created_at as string)}`;

  const body = `An author commented here with:\n\n${formatString}.`;

  return { body };
}

export function getPullReviewBody<T extends Record<string, any>>(arg: T) {
  const formatString = `- comment link ${
    "`" + arg.html_url + "`"
  } at ${formatTime(arg.submitted_at as string)}`;

  const body = `An author commented here with:\n\n${formatString}.`;

  return { body };
}

export function extractData<
  R extends Array<Record<string, any>>,
  I extends Array<Pick<Record<string, any>, "html_url" | "created_at">>,
  T extends Array<Record<string, any>>
>(reviews: R, issues: I, pull_reviews: T) {
  const groupReviews = groupCommentsFn(reviews);

  const extract_reviews = Object.entries(groupReviews).map(([key, value]) => {
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

  const extract_issues = issues.map((i) => {
    const { body } = getIssueBody(i);
    return {
      body,
      created_at: i.created_at,
      key: "issue",
    };
  });

  const extract_pull_reviews = pull_reviews.map((review) => {
    const { body } = getPullReviewBody(review);
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
    return {
      body,
      event,
      commit_id: review.commit_id as string,
      created_at: review.submitted_at,
      key: "pull_review",
    };
  });

  const allComments: Comment[] = [
    ...extract_reviews,
    ...extract_issues,
    ...extract_pull_reviews,
  ].sort(
    (a, b) =>
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  return { allComments };
}
