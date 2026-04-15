"use strict";

const fs = require("fs");
const path = require("path");
const http = require("http");
const { getConfig } = require("../lib/config");
const { handleApiRequest } = require("../lib/api-router");

const rootDir = path.resolve(__dirname, "..");
const config = getConfig();

const mimeTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8",
  ".webp": "image/webp"
};

function resolveFilePath(urlPath) {
  let pathname = decodeURIComponent(urlPath.split("?")[0]);
  if (pathname === "/") {
    pathname = "/index.html";
  }

  const normalized = path.normalize(pathname).replace(/^(\.\.[/\\])+/, "").replace(/^[/\\]+/, "");
  const targetPath = path.join(rootDir, normalized);

  if (!targetPath.startsWith(rootDir)) {
    return null;
  }

  return targetPath;
}

function serveStatic(req, res) {
  const targetPath = resolveFilePath(req.url || "/");

  if (!targetPath) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  fs.stat(targetPath, (statError, stats) => {
    if (statError || !stats.isFile()) {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("Not Found");
      return;
    }

    const ext = path.extname(targetPath).toLowerCase();
    const contentType = mimeTypes[ext] || "application/octet-stream";
    res.writeHead(200, {
      "Content-Type": contentType,
      "Cache-Control": "no-store"
    });
    fs.createReadStream(targetPath).pipe(res);
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || "/", `http://${req.headers.host || `127.0.0.1:${config.port}`}`);

  if (url.pathname.startsWith("/api/")) {
    await handleApiRequest(req, res, url);
    return;
  }

  serveStatic(req, res);
});

server.listen(config.port, () => {
  console.log(`[edison-web] listening on http://127.0.0.1:${config.port}`);
});
