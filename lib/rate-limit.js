"use strict";

const buckets = new Map();

const rules = {
  view: { limit: 120, windowMs: 60 * 1000 },
  like: { limit: 20, windowMs: 60 * 1000 },
  comment: { limit: 6, windowMs: 10 * 60 * 1000 },
  message: { limit: 4, windowMs: 10 * 60 * 1000 },
  analytics: { limit: 180, windowMs: 60 * 1000 },
  adminLogin: { limit: 8, windowMs: 10 * 60 * 1000 }
};

function assertRateLimit(ruleName, visitorHash) {
  const rule = rules[ruleName] || rules.analytics;
  const now = Date.now();
  const key = `${ruleName}:${visitorHash}`;
  const bucket = buckets.get(key) || { count: 0, resetAt: now + rule.windowMs };

  if (bucket.resetAt <= now) {
    bucket.count = 0;
    bucket.resetAt = now + rule.windowMs;
  }

  bucket.count += 1;
  buckets.set(key, bucket);

  if (bucket.count > rule.limit) {
    const error = new Error("Too many requests. Please try again later.");
    error.statusCode = 429;
    throw error;
  }
}

module.exports = {
  assertRateLimit
};
