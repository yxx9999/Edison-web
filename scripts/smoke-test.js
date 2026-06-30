"use strict";

const http = require("http");

const baseUrlArg = process.argv.find((arg) => arg.startsWith("--base-url="));
const port = Number(process.env.PORT || 3000);
const base = process.env.BASE_URL || (baseUrlArg ? baseUrlArg.replace("--base-url=", "") : `http://127.0.0.1:${port}`);
const targets = [
  `${base}/`,
  `${base}/index.html`,
  `${base}/about.html`,
  `${base}/blog.html`,
  `${base}/contact.html`,
  `${base}/mail.html`,
  `${base}/admin-login.html`,
  `${base}/admin.html`,
  `${base}/Surfing_founder.html`,
  `${base}/bar.html`,
  `${base}/product.html`,
  `${base}/football.html`,
  `${base}/styles/site.css`,
  `${base}/scripts/site.js`,
  `${base}/scripts/posts.js`,
  `${base}/scripts/admin.js?v=20260415-admin-login-split`,
  `${base}/image/blog/banner.jpg`,
  `${base}/image/contact/contact_bnner.jpg`,
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
  let failed = false;

  for (const target of targets) {
    const result = await request(target);
    console.log(`${result.target} -> ${result.statusCode}`);
    console.log(result.body);

    if (result.statusCode < 200 || result.statusCode >= 300) {
      failed = true;
    }
  }

  if (failed) {
    process.exitCode = 1;
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
