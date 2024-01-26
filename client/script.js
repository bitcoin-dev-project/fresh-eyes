(function script() {
  const inlineComments = document.querySelectorAll(".inline-comments");
  inlineComments.forEach((el) => {
    el.setAttribute("style", "postion: relative;");
    el.querySelectorAll(".comment-holder").forEach((comment) => {
      comment.setAttribute("style", "display: none");
    });

    const comments = el.querySelectorAll(".comment-body > p");
    let commentCount = el.querySelectorAll(".comment-body").length;
    let commentWordCount = 0;
    comments.forEach((comment) => {
      commentWordCount +=
        comment?.textContent?.trim()?.split(/\s+/)?.length ?? 0;
    });

    // handle resolved comments that may be hidden.
    const resolvedComment = el.querySelector(".js-toggle-outdated-comments");
    if (resolvedComment) {
      resolvedComment.click();
      commentWordCount +=
        resolvedComment?.textContent?.trim()?.split(/\s+/)?.length ?? 0;
      commentCount += el.querySelectorAll(
        ".js-toggle-outdated-comments"
      ).length;
      resolvedComment.click();
    }

    el.querySelectorAll(".line-comments").forEach((comment) => {
      comment.classList.add("fresheyes-line-comments");
    });

    const commentDiv = document.createElement("div");
    commentDiv.classList.add("fresheyes-comment-count");
    commentDiv.textContent = `# COMMENTS: ${
      commentCount > 1 ? commentCount + " comments" : commentCount + " comment"
    } with ${commentWordCount} total words on the line above`;
    el?.insertBefore(commentDiv, el?.firstChild);
  });
})();
