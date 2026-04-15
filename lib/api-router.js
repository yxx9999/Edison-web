"use strict";

const {
  getActiveStorageMode,
  archiveAdminPost,
  createAdminPost,
  isSupabaseConfigured,
  isSupabaseReady,
  getAdminMessage,
  getPublishedPost,
  listAdminMessages,
  listAdminPostMetrics,
  listAdminPosts,
  listStats,
  listPublishedPosts,
  publishAdminPost,
  recordView,
  likePost,
  listComments,
  recordMessageReply,
  submitComment,
  submitMessage,
  recordAnalytics,
  updateAdminMessageStatus,
  updateAdminPost,
  uploadBlogImage
} = require("./services/store");
const { sendAdminReply, sendMessageNotification } = require("./services/notify");
const { sendJson, sendError, readJson, getSession, hashVisitor } = require("./http");
const { assertRateLimit } = require("./rate-limit");
const {
  clearAdminCookie,
  createAdminCookie,
  getAdminSession,
  isAdminConfigured,
  requireAdmin,
  verifyPassword
} = require("./admin-auth");

function getPostSlugFromPath(pathname) {
  const match = pathname.match(/^\/api\/posts\/([^/]+)\//);
  return match ? decodeURIComponent(match[1]) : "";
}

function validateMessage(payload) {
  if (payload.website) {
    const error = new Error("Message accepted");
    error.statusCode = 202;
    error.isHoneypot = true;
    throw error;
  }

  if (!payload.topic || typeof payload.topic !== "string") {
    const error = new Error("Topic is required");
    error.statusCode = 400;
    throw error;
  }

  if (!payload.message || typeof payload.message !== "string" || payload.message.trim().length < 12) {
    const error = new Error("Message must be at least 12 characters");
    error.statusCode = 400;
    throw error;
  }

  if (payload.replyEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(payload.replyEmail).trim())) {
    const error = new Error("Reply email is invalid");
    error.statusCode = 400;
    throw error;
  }
}

function validateComment(payload) {
  if (payload.website) {
    const error = new Error("Comment accepted");
    error.statusCode = 202;
    error.isHoneypot = true;
    throw error;
  }

  if (!payload.content || typeof payload.content !== "string" || payload.content.trim().length < 4) {
    const error = new Error("Comment must be at least 4 characters");
    error.statusCode = 400;
    throw error;
  }
}

function assertSameOrigin(req) {
  const origin = req.headers.origin;
  if (!origin) {
    return;
  }

  const host = req.headers.host;
  if (!host) {
    return;
  }

  try {
    const originUrl = new URL(origin);
    if (originUrl.host === host) {
      return;
    }
  } catch (error) {
    return;
  }

  const error = new Error("Cross-origin request rejected");
  error.statusCode = 403;
  throw error;
}

function getIdFromPath(pathname, pattern) {
  const match = pathname.match(pattern);
  return match ? decodeURIComponent(match[1]) : "";
}

function validateReplyPayload(payload) {
  const subject = String(payload.subject || "").trim();
  const body = String(payload.body || "").trim();

  if (!subject || subject.length > 180) {
    const error = new Error("Reply subject is required and must be under 180 characters");
    error.statusCode = 400;
    throw error;
  }

  if (!body || body.length < 2 || body.length > 10000) {
    const error = new Error("Reply body is required and must be under 10000 characters");
    error.statusCode = 400;
    throw error;
  }

  return { subject, body };
}

async function handleApiRequest(req, res, url) {
  const { sessionId, setCookieHeader } = getSession(req);
  const visitorHash = hashVisitor(sessionId, req);
  const headers = setCookieHeader ? { "Set-Cookie": setCookieHeader } : undefined;

  try {
    if (req.method === "GET" && url.pathname === "/api/health") {
      await listStats(["agent-workflow-notes"]);

      sendJson(
        res,
        200,
        {
          ok: true,
          storage: getActiveStorageMode(),
          supabaseConfigured: isSupabaseConfigured(),
          supabaseActive: isSupabaseReady(),
          now: new Date().toISOString()
        },
        headers
      );
      return;
    }

    if (req.method === "GET" && url.pathname === "/api/admin/session") {
      const adminSession = getAdminSession(req);
      sendJson(res, 200, {
        ok: true,
        configured: isAdminConfigured(),
        authenticated: Boolean(adminSession)
      });
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/admin/login") {
      assertSameOrigin(req);
      assertRateLimit("adminLogin", visitorHash);
      const payload = await readJson(req);
      verifyPassword(payload.password);
      sendJson(
        res,
        200,
        {
          ok: true,
          authenticated: true
        },
        {
          "Set-Cookie": createAdminCookie()
        }
      );
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/admin/logout") {
      sendJson(
        res,
        200,
        {
          ok: true,
          authenticated: false
        },
        {
          "Set-Cookie": clearAdminCookie()
        }
      );
      return;
    }

    if (req.method === "GET" && url.pathname === "/api/admin/metrics/posts") {
      requireAdmin(req);
      const posts = await listAdminPostMetrics();
      sendJson(res, 200, { ok: true, posts });
      return;
    }

    if (req.method === "GET" && url.pathname === "/api/admin/messages") {
      requireAdmin(req);
      const messages = await listAdminMessages();
      sendJson(res, 200, { ok: true, messages });
      return;
    }

    if (req.method === "GET" && /^\/api\/admin\/messages\/[^/]+$/.test(url.pathname)) {
      requireAdmin(req);
      const messageId = getIdFromPath(url.pathname, /^\/api\/admin\/messages\/([^/]+)$/);
      const message = await getAdminMessage(messageId);

      if (!message) {
        sendError(res, 404, "Message not found");
        return;
      }

      sendJson(res, 200, { ok: true, message });
      return;
    }

    if (req.method === "PATCH" && /^\/api\/admin\/messages\/[^/]+$/.test(url.pathname)) {
      requireAdmin(req);
      assertSameOrigin(req);
      const messageId = getIdFromPath(url.pathname, /^\/api\/admin\/messages\/([^/]+)$/);
      const payload = await readJson(req);
      const message = await updateAdminMessageStatus(messageId, String(payload.status || "").trim());

      if (!message) {
        sendError(res, 404, "Message not found");
        return;
      }

      sendJson(res, 200, { ok: true, message });
      return;
    }

    if (req.method === "POST" && /^\/api\/admin\/messages\/[^/]+\/reply$/.test(url.pathname)) {
      requireAdmin(req);
      assertSameOrigin(req);
      const messageId = getIdFromPath(url.pathname, /^\/api\/admin\/messages\/([^/]+)\/reply$/);
      const payload = validateReplyPayload(await readJson(req));
      const message = await getAdminMessage(messageId);

      if (!message) {
        sendError(res, 404, "Message not found");
        return;
      }

      if (!message.reply_email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(message.reply_email))) {
        sendError(res, 400, "Message has no valid reply email");
        return;
      }

      const delivery = await sendAdminReply({
        to: message.reply_email,
        subject: payload.subject,
        body: payload.body
      });
      const reply = await recordMessageReply({
        messageId,
        replyTo: message.reply_email,
        subject: payload.subject,
        body: payload.body,
        resendEmailId: delivery.id
      });

      sendJson(res, 201, { ok: true, reply, delivery });
      return;
    }

    if (req.method === "GET" && url.pathname === "/api/admin/posts") {
      requireAdmin(req);
      const posts = await listAdminPosts();
      sendJson(res, 200, { ok: true, posts });
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/admin/posts") {
      requireAdmin(req);
      assertSameOrigin(req);
      const post = await createAdminPost(await readJson(req));
      sendJson(res, 201, { ok: true, post });
      return;
    }

    if (req.method === "PATCH" && /^\/api\/admin\/posts\/[^/]+$/.test(url.pathname)) {
      requireAdmin(req);
      assertSameOrigin(req);
      const postId = getIdFromPath(url.pathname, /^\/api\/admin\/posts\/([^/]+)$/);
      const post = await updateAdminPost(postId, await readJson(req));

      if (!post) {
        sendError(res, 404, "Post not found");
        return;
      }

      sendJson(res, 200, { ok: true, post });
      return;
    }

    if (req.method === "POST" && /^\/api\/admin\/posts\/[^/]+\/publish$/.test(url.pathname)) {
      requireAdmin(req);
      assertSameOrigin(req);
      const postId = getIdFromPath(url.pathname, /^\/api\/admin\/posts\/([^/]+)\/publish$/);
      const post = await publishAdminPost(postId);

      if (!post) {
        sendError(res, 404, "Post not found");
        return;
      }

      sendJson(res, 200, { ok: true, post });
      return;
    }

    if (req.method === "POST" && /^\/api\/admin\/posts\/[^/]+\/archive$/.test(url.pathname)) {
      requireAdmin(req);
      assertSameOrigin(req);
      const postId = getIdFromPath(url.pathname, /^\/api\/admin\/posts\/([^/]+)\/archive$/);
      const post = await archiveAdminPost(postId);

      if (!post) {
        sendError(res, 404, "Post not found");
        return;
      }

      sendJson(res, 200, { ok: true, post });
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/admin/uploads/blog-image") {
      requireAdmin(req);
      assertSameOrigin(req);
      const payload = await readJson(req);
      const dataUrl = String(payload.dataUrl || "");
      const base64Data = dataUrl.includes(",") ? dataUrl.split(",").pop() : String(payload.base64Data || "");
      const asset = await uploadBlogImage({
        fileName: payload.fileName,
        mimeType: payload.mimeType,
        base64Data,
        postId: payload.postId,
        altText: payload.altText
      });

      sendJson(res, 201, { ok: true, asset });
      return;
    }

    if (req.method === "GET" && url.pathname === "/api/posts/stats") {
      const slugs = (url.searchParams.get("slugs") || "")
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
      const stats = await listStats(slugs);
      sendJson(res, 200, { ok: true, stats }, headers);
      return;
    }

    if (req.method === "GET" && url.pathname === "/api/posts") {
      const posts = await listPublishedPosts();
      sendJson(res, 200, { ok: true, posts }, headers);
      return;
    }

    if (req.method === "GET" && /^\/api\/posts\/[^/]+$/.test(url.pathname)) {
      const slug = decodeURIComponent(url.pathname.replace("/api/posts/", ""));
      const post = await getPublishedPost(slug);

      if (!post) {
        sendError(res, 404, "Post not found");
        return;
      }

      sendJson(res, 200, { ok: true, post }, headers);
      return;
    }

    if (req.method === "POST" && /^\/api\/posts\/[^/]+\/view$/.test(url.pathname)) {
      assertSameOrigin(req);
      assertRateLimit("view", visitorHash);
      const slug = getPostSlugFromPath(url.pathname);
      const result = await recordView({
        slug,
        visitorHash,
        sessionId,
        userAgent: req.headers["user-agent"] || ""
      });
      sendJson(res, 200, { ok: true, ...result }, headers);
      return;
    }

    if (req.method === "POST" && /^\/api\/posts\/[^/]+\/like$/.test(url.pathname)) {
      assertSameOrigin(req);
      assertRateLimit("like", visitorHash);
      const slug = getPostSlugFromPath(url.pathname);
      const result = await likePost({
        slug,
        visitorHash
      });
      sendJson(res, 200, { ok: true, ...result }, headers);
      return;
    }

    if (req.method === "GET" && /^\/api\/posts\/[^/]+\/comments$/.test(url.pathname)) {
      const slug = getPostSlugFromPath(url.pathname);
      const comments = await listComments(slug);
      sendJson(res, 200, { ok: true, comments }, headers);
      return;
    }

    if (req.method === "POST" && /^\/api\/posts\/[^/]+\/comments$/.test(url.pathname)) {
      assertSameOrigin(req);
      assertRateLimit("comment", visitorHash);
      const slug = getPostSlugFromPath(url.pathname);
      const payload = await readJson(req);
      validateComment(payload);
      const comment = await submitComment({
        slug,
        nickname: String(payload.nickname || "").trim(),
        content: String(payload.content || "").trim()
      });
      sendJson(
        res,
        201,
        {
          ok: true,
          comment,
          message: comment.status === "published" ? "Comment published" : "Comment submitted for review"
        },
        headers
      );
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/messages") {
      assertSameOrigin(req);
      assertRateLimit("message", visitorHash);
      const payload = await readJson(req);
      validateMessage(payload);
      const messageRecord = await submitMessage({
        topic: String(payload.topic || "").trim(),
        nickname: String(payload.nickname || "").trim(),
        message: String(payload.message || "").trim(),
        replyEmail: String(payload.replyEmail || "").trim(),
        sessionId,
        visitorHash
      });
      const notification = await sendMessageNotification(messageRecord);
      sendJson(
        res,
        201,
        {
          ok: true,
          message: messageRecord,
          notification
        },
        headers
      );
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/analytics") {
      assertSameOrigin(req);
      assertRateLimit("analytics", visitorHash);
      const payload = await readJson(req);
      if (!payload.eventName || typeof payload.eventName !== "string") {
        sendError(res, 400, "eventName is required");
        return;
      }

      await recordAnalytics({
        eventName: payload.eventName,
        page: payload.page,
        postSlug: payload.postSlug,
        sessionId,
        visitorHash,
        metadata: payload.metadata || {}
      });

      sendJson(res, 202, { ok: true }, headers);
      return;
    }

    sendError(res, 404, "API route not found");
  } catch (error) {
    if (error.isHoneypot) {
      sendJson(res, error.statusCode || 202, { ok: true, accepted: true }, headers);
      return;
    }

    sendError(res, error.statusCode || 500, error.message || "Internal Server Error", {
      storage: isSupabaseReady() ? "supabase" : "memory"
    });
  }
}

module.exports = {
  handleApiRequest
};
