export function groupCommentsFn<T extends Array<Record<string, any>>>(data: T) {
  const comments: Record<string, Array<typeof data>> = data
    .map((x: any) => ({ ...x, line: String(x.line) }))
    .reduce((acc, curr) => {
      const key = curr.line;

      const group = acc[key] ?? [];

      return { ...acc, [key]: [...group, curr] };
    }, {});

  return comments;
}

export function generateBody<T extends Array<Array<Record<string, any>>>>(value: T) {
  const list = value.flat().map((x) => ({ html_url: x.html_url, created_at: x.created_at }));

  const formatString = list
    .map((val, idx) => {
      return `- [comment link ${idx + 1}](${val.html_url}) at ${new Date(val.created_at).toLocaleString()}`;
    })
    .join("\n");

  const body = `${value.length === 1 ? "An author" : `${value.length} authors`} commented here with\n\n${formatString}.`;
  const comment = value.flat()[0];

  return { body, comment };
}
