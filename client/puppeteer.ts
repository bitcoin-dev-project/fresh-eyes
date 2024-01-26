import puppeteer from "puppeteer";
import fs from "fs";

const scriptContent = fs.readFileSync("./script.js", "utf8");
const cssContent = fs.readFileSync("./style.css", "utf8");

const getUrlFromCmd = () => {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    throw new Error("Invalid url: Please provide a URL to the PR");
  }
  console.log(`Opening ${args[0]}`);
  return `${args[0]}/files`;
};

(async () => {
  const browser = await puppeteer.launch({
    headless: false,
    args: ["--start-maximized"],
  });
  const page = await browser.newPage();

  try {
    await page.goto(getUrlFromCmd(), {
      waitUntil: "networkidle2",
    });
    console.log("Page loaded");
  } catch (e) {
    console.log(e instanceof Error ? e.message : "Unknown error!");
    process.exit(1);
  }

  await page.addStyleTag({ content: cssContent });
  const { width, height } = await page.evaluate(() => {
    return {
      width: screen.availWidth,
      height: screen.availHeight,
    };
  });
  await page.setViewport({ width, height });

  const commentBodySelector = ".comment-body > p";
  const delimiterForComments = await page.waitForSelector(commentBodySelector);
  if (!delimiterForComments) {
    console.log("No review comments found");
  } else {
    await page.evaluate(scriptContent);
  }

  // on page reload, load the script again
  page.on("load", async () => {
    await page.addStyleTag({ content: cssContent });
    page.evaluate(scriptContent);
  });
})();
