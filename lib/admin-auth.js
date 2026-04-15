"use strict";

const crypto = require("crypto");
const { getConfig } = require("./config");
const { parseCookieValues } = require("./http");

const cookieName = "edison_admin";
const maxAgeSeconds = 8 * 60 * 60;

function base64UrlEncode(value) {
  return Buffer.from(value).toString("base64url");
}

function base64UrlDecode(value) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function sign(value, secret) {
  return crypto.createHmac("sha256", secret).update(value).digest("base64url");
}

function safeEqual(left, right) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

function isAdminConfigured() {
  const config = getConfig();
  return Boolean(config.adminPassword && config.adminSessionSecret);
}

function assertAdminConfigured() {
  if (isAdminConfigured()) {
    return;
  }

  const error = new Error("Admin authentication is not configured");
  error.statusCode = 503;
  throw error;
}

function verifyPassword(password) {
  const config = getConfig();
  assertAdminConfigured();

  if (!safeEqual(String(password || ""), config.adminPassword)) {
    const error = new Error("Invalid admin password");
    error.statusCode = 401;
    throw error;
  }
}

function createAdminCookie() {
  const config = getConfig();
  assertAdminConfigured();

  const payload = base64UrlEncode(
    JSON.stringify({
      role: "admin",
      createdAt: Date.now(),
      expiresAt: Date.now() + maxAgeSeconds * 1000
    })
  );
  const signature = sign(payload, config.adminSessionSecret);
  return `${cookieName}=${payload}.${signature}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAgeSeconds}`;
}

function clearAdminCookie() {
  return `${cookieName}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}

function getAdminSession(req) {
  const config = getConfig();
  if (!isAdminConfigured()) {
    return null;
  }

  const tokens = parseCookieValues(req, cookieName);
  for (const token of tokens) {
    if (!token || !token.includes(".")) {
      continue;
    }

    const [payload, signature] = token.split(".");
    const expected = sign(payload, config.adminSessionSecret);

    if (!safeEqual(signature, expected)) {
      continue;
    }

    try {
      const session = JSON.parse(base64UrlDecode(payload));
      if (session.role !== "admin" || Number(session.expiresAt || 0) < Date.now()) {
        continue;
      }

      return session;
    } catch (error) {
      continue;
    }
  }

  return null;
}

function requireAdmin(req) {
  const session = getAdminSession(req);
  if (session) {
    return session;
  }

  const error = new Error("Admin authentication required");
  error.statusCode = 401;
  throw error;
}

module.exports = {
  assertAdminConfigured,
  clearAdminCookie,
  createAdminCookie,
  getAdminSession,
  isAdminConfigured,
  requireAdmin,
  verifyPassword
};
