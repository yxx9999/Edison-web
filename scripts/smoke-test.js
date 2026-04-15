"use strict";

const http = require("http");

const baseUrlArg = process.argv.find((arg) => arg.startsWith("--base-url="));
const port = Number(process.env.PORT || 3000);
const base = process.env.BASE_URL || (baseUrlArg ? baseUrlArg.replace("--base-url=", "") : `http://127.0.0.1:${port}`);
const targets = [
  `${base}/`,
  `${base}/blog.html`,
  `${base}/mail.html`,
  `${base}/api/health`,
  `${base}/api/posts/stats?slugs=agent-workflow-notes,building-personal-site-mvp`
];

function request(target) {
  return new Promise((resolve, reject) => {
    http
      .get(target, (res) => {
        const chunks = [];
        res.on("data", (chunk) => chunks.push(chunk));
        res.on("end", () => {
          resolve({
            target,
            statusCode: res.statusCode,
            body: Buffer.concat(chunks).toString("utf8").slice(0, 200)
          });
        });
      })
      .on("error", reject);
  });
}

(async function run() {
  for (const target of targets) {
    const result = await request(target);
    console.log(`${result.target} -> ${result.statusCode}`);
    console.log(result.body);
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
