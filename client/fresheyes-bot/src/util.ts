type Comment = {
  body: string;
  commit_id?: string;
  path?: string;
  side?: "LEFT" | "RIGHT" | undefined;
  line?: number;
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

export const modifyPullRequestBody = (
  args: string | null
): {
  body: string;
} => {
  if (!args) return { body: "" };

  const body = args
    .split(" ")
    .map((word) => (word.startsWith("#") || word.startsWith("@") || word.startsWith("https://github.com") ? "`" + word.trim() + "`" : word))
    .join(" ");

  return { body };
};

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

export function getIssueBody<T extends Pick<T, "html_url" | "created_at">>(arg: T) {
  const formatString = `- comment link ${"`" + arg.html_url + "`"} at ${formatTime(arg.created_at as string)}`;

  const body = `An author commented here with:\n\n${formatString}.`;

  return { body };
}

export function extractData<R extends Array<Record<string, any>>, I extends Array<Pick<Record<string, any>, "html_url" | "created_at">>>(
  reviews: R,
  issues: I
) {
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

  const allComments: Comment[] = [...extract_reviews, ...extract_issues].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  return { allComments };
}
