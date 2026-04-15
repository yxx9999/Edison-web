"use strict";

const crypto = require("crypto");

function sendJson(res, statusCode, payload, extraHeaders) {
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    ...(extraHeaders || {})
  });
  res.end(JSON.stringify(payload));
}

function sendError(res, statusCode, message, details) {
  sendJson(res, statusCode, {
    ok: false,
    error: message,
    details: details || null
  });
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    let raw = "";

    req.on("data", (chunk) => {
      raw += chunk;
      if (raw.length > 6_000_000) {
        reject(new Error("Request body too large"));
      }
    });

    req.on("end", () => {
      if (!raw) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(raw));
      } catch (error) {
        reject(new Error("Invalid JSON body"));
      }
    });

    req.on("error", reject);
  });
}

function parseCookies(req) {
  const header = req.headers.cookie || "";
  return header.split(";").reduce((acc, item) => {
    const [key, ...value] = item.trim().split("=");
    if (!key) {
      return acc;
    }
    acc[key] = decodeURIComponent(value.join("="));
    return acc;
  }, {});
}

function parseCookieValues(req, targetKey) {
  const header = req.headers.cookie || "";
  return header
    .split(";")
    .map((item) => item.trim())
    .filter(Boolean)
    .reduce((values, item) => {
      const [key, ...value] = item.split("=");
      if (key === targetKey) {
        values.push(decodeURIComponent(value.join("=")));
      }
      return values;
    }, []);
}

function getClientIp(req) {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.trim()) {
    return forwarded.split(",")[0].trim();
  }
  return req.socket.remoteAddress || "0.0.0.0";
}

function getSession(req) {
  const cookies = parseCookies(req);
  const existing = cookies.edison_sid;

  if (existing) {
    return {
      sessionId: existing,
      setCookieHeader: null
    };
  }

  const sessionId = crypto.randomUUID();
  return {
    sessionId,
    setCookieHeader: `edison_sid=${sessionId}; Path=/; HttpOnly; SameSite=Lax; Max-Age=31536000`
  };
}

function hashVisitor(sessionId, req) {
  const value = `${sessionId}:${getClientIp(req)}:${req.headers["user-agent"] || ""}`;
  return crypto.createHash("sha256").update(value).digest("hex");
}

module.exports = {
  sendJson,
  sendError,
  readJson,
  parseCookies,
  parseCookieValues,
  getSession,
  hashVisitor
};
