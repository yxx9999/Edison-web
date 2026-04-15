"use strict";

const crypto = require("crypto");
const postCatalog = require("../post-catalog");
const fallbackPosts = require("../fallback-posts");
const { getConfig } = require("../config");
const { getSupabaseClient } = require("./supabase");

const postMap = new Map(postCatalog.map((post) => [post.slug, post]));
let forcedMemoryMode = false;

const memoryState = {
  stats: new Map(
    postCatalog.map((post) => [
      post.slug,
      {
        slug: post.slug,
        view_count: post.fallbackViews,
        like_count: post.fallbackLikes,
        comment_count: 0
      }
    ])
  ),
  views: new Set(),
  likes: new Set(),
  comments: [],
  messages: [],
  analytics: [],
  posts: fallbackPosts.map((post) => ({
    id: makeId(),
    slug: post.slug,
    title: post.title,
    excerpt: post.excerpt,
    category: post.category,
    cover_url: post.cover,
    content: post.content,
    status: "published",
    featured: Boolean(post.featured),
    published_at: post.date,
    created_at: nowIso(),
    updated_at: nowIso()
  })),
  replies: [],
  assets: [],
  adminLogs: []
};

function assertKnownPost(slug) {
  if (!slug || typeof slug !== "string") {
    const error = new Error("Post slug is required");
    error.statusCode = 400;
    throw error;
  }
}

function makeId() {
  return crypto.randomUUID();
}

function nowIso() {
  return new Date().toISOString();
}

function makeTodayKey() {
  return new Date().toISOString().slice(0, 10);
}

function normalizePost(row) {
  return {
    slug: row.slug,
    title: row.title,
    date: row.published_at ? String(row.published_at).slice(0, 10) : row.date,
    category: row.category,
    excerpt: row.excerpt,
    cover: row.cover_url || row.cover || "./image/blog/banner.jpg",
    views: row.views || 0,
    likes: row.likes || 0,
    featured: Boolean(row.featured),
    content: row.content || ""
  };
}

function normalizeAdminPost(row) {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    category: row.category,
    cover_url: row.cover_url || "",
    content: row.content || "",
    status: row.status || "draft",
    featured: Boolean(row.featured),
    published_at: row.published_at || null,
    created_at: row.created_at || null,
    updated_at: row.updated_at || null
  };
}

function normalizeSlug(slug) {
  return String(slug || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

function validatePostInput(payload, options) {
  const mode = options && options.mode ? options.mode : "draft";
  const title = String(payload.title || "").trim();
  const slug = normalizeSlug(payload.slug || title);
  const excerpt = String(payload.excerpt || "").trim();
  const category = String(payload.category || "").trim();
  const coverUrl = String(payload.coverUrl || payload.cover_url || "").trim();
  const content = String(payload.content || "").trim();
  const status = String(payload.status || "draft").trim();

  if (!title || title.length > 160) {
    const error = new Error("Post title is required and must be under 160 characters");
    error.statusCode = 400;
    throw error;
  }

  if (!slug || slug.length > 120) {
    const error = new Error("Post slug is required and must be URL-safe");
    error.statusCode = 400;
    throw error;
  }

  if (excerpt.length > 360) {
    const error = new Error("Post excerpt must be under 360 characters");
    error.statusCode = 400;
    throw error;
  }

  if (content.length > 60000) {
    const error = new Error("Post content is too long");
    error.statusCode = 400;
    throw error;
  }

  if (mode === "publish" && (!excerpt || !category || !content)) {
    const error = new Error("Publishing requires title, slug, excerpt, category, and content");
    error.statusCode = 400;
    throw error;
  }

  return {
    title,
    slug,
    excerpt,
    category,
    cover_url: coverUrl,
    content,
    status: ["draft", "published", "archived"].includes(status) ? status : "draft",
    featured: Boolean(payload.featured)
  };
}

function isSupabaseReady() {
  return Boolean(getSupabaseClient()) && !forcedMemoryMode;
}

function isSupabaseConfigured() {
  return Boolean(getSupabaseClient());
}

function getActiveStorageMode() {
  return isSupabaseReady() ? "supabase" : "memory";
}

function shouldFallbackToMemory(error) {
  const message = String((error && error.message) || "").toLowerCase();
  return (
    message.includes("schema cache") ||
    message.includes("could not find the table") ||
    message.includes("relation") ||
    message.includes("does not exist") ||
    error.code === "42P01"
  );
}

async function withStorageFallback(runSupabase, runMemory) {
  if (!isSupabaseReady()) {
    return runMemory();
  }

  try {
    return await runSupabase();
  } catch (error) {
    if (shouldFallbackToMemory(error)) {
      forcedMemoryMode = true;
      return runMemory();
    }
    throw error;
  }
}

async function ensureSupabaseMetricRow(slug) {
  const supabase = getSupabaseClient();
  const defaults = postMap.get(slug);

  const { error } = await supabase.from("post_metrics").insert({
    post_slug: slug,
    title: defaults ? defaults.title : slug,
    view_count: defaults ? defaults.fallbackViews : 0,
    like_count: defaults ? defaults.fallbackLikes : 0,
    comment_count: 0
  });

  if (error && error.code !== "23505") {
    throw error;
  }
}

async function listStats(slugs) {
  const requested = Array.isArray(slugs) && slugs.length ? slugs : postCatalog.map((post) => post.slug);
  requested.forEach(assertKnownPost);

  function runMemory() {
    return requested.map((slug) => {
      const stat = memoryState.stats.get(slug) || {
        view_count: 0,
        like_count: 0,
        comment_count: 0
      };
      return {
        post_slug: slug,
        view_count: stat.view_count,
        like_count: stat.like_count,
        comment_count: stat.comment_count
      };
    });
  }

  return withStorageFallback(
    async function runSupabase() {
      const supabase = getSupabaseClient();
      await Promise.all(requested.map((slug) => ensureSupabaseMetricRow(slug)));

      const { data, error } = await supabase
        .from("post_metrics")
        .select("post_slug, view_count, like_count, comment_count")
        .in("post_slug", requested);

      if (error) {
        throw error;
      }

      const dataMap = new Map((data || []).map((row) => [row.post_slug, row]));
      return requested.map((slug) => dataMap.get(slug)).filter(Boolean);
    },
    runMemory
  );
}

async function listPublishedPosts() {
  function runMemory() {
    return memoryState.posts
      .filter((post) => post.status === "published")
      .sort((left, right) => new Date(right.published_at || 0) - new Date(left.published_at || 0))
      .map(normalizePost);
  }

  return withStorageFallback(
    async function runSupabase() {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from("blog_posts")
        .select("slug, title, excerpt, category, cover_url, content, featured, published_at")
        .eq("status", "published")
        .order("published_at", { ascending: false });

      if (error) {
        throw error;
      }

      if (!data || !data.length) {
        return runMemory();
      }

      return data.map(normalizePost);
    },
    runMemory
  );
}

async function getPublishedPost(slug) {
  function runMemory() {
    const post = memoryState.posts.find((entry) => entry.slug === slug && entry.status === "published");
    return post ? normalizePost(post) : null;
  }

  return withStorageFallback(
    async function runSupabase() {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from("blog_posts")
        .select("slug, title, excerpt, category, cover_url, content, featured, published_at")
        .eq("slug", slug)
        .eq("status", "published")
        .maybeSingle();

      if (error) {
        throw error;
      }

      return data ? normalizePost(data) : runMemory();
    },
    runMemory
  );
}

async function recordView({ slug, visitorHash, sessionId, userAgent }) {
  assertKnownPost(slug);
  const todayKey = makeTodayKey();

  function runMemory() {
    const viewKey = `${slug}:${visitorHash}:${todayKey}`;
    const stat =
      memoryState.stats.get(slug) ||
      {
        slug,
        view_count: 0,
        like_count: 0,
        comment_count: 0
      };
    memoryState.stats.set(slug, stat);

    if (memoryState.views.has(viewKey)) {
      return {
        counted: false,
        stats: { ...stat }
      };
    }

    memoryState.views.add(viewKey);
    stat.view_count += 1;
    return {
      counted: true,
      stats: { ...stat }
    };
  }

  return withStorageFallback(
    async function runSupabase() {
      const supabase = getSupabaseClient();
      await ensureSupabaseMetricRow(slug);

      const { error: insertError } = await supabase.from("post_view_events").insert({
        id: makeId(),
        post_slug: slug,
        visitor_hash: visitorHash,
        session_id: sessionId,
        user_agent: userAgent,
        viewed_on: todayKey
      });

      if (insertError && insertError.code !== "23505") {
        throw insertError;
      }

      const counted = !insertError;

      if (counted) {
        const { error: updateError } = await supabase.rpc("increment_post_view_count", {
          target_slug: slug
        });

        if (updateError) {
          throw updateError;
        }
      }

      const [stats] = await listStats([slug]);
      return {
        counted,
        stats
      };
    },
    runMemory
  );
}

async function likePost({ slug, visitorHash }) {
  assertKnownPost(slug);

  function runMemory() {
    const likeKey = `${slug}:${visitorHash}`;
    const stat =
      memoryState.stats.get(slug) ||
      {
        slug,
        view_count: 0,
        like_count: 0,
        comment_count: 0
      };
    memoryState.stats.set(slug, stat);

    if (memoryState.likes.has(likeKey)) {
      return {
        counted: false,
        stats: { ...stat }
      };
    }

    memoryState.likes.add(likeKey);
    stat.like_count += 1;
    return {
      counted: true,
      stats: { ...stat }
    };
  }

  return withStorageFallback(
    async function runSupabase() {
      const supabase = getSupabaseClient();
      await ensureSupabaseMetricRow(slug);

      const { error: insertError } = await supabase.from("post_like_events").insert({
        id: makeId(),
        post_slug: slug,
        visitor_hash: visitorHash
      });

      if (insertError && insertError.code !== "23505") {
        throw insertError;
      }

      const counted = !insertError;

      if (counted) {
        const { error: updateError } = await supabase.rpc("increment_post_like_count", {
          target_slug: slug
        });

        if (updateError) {
          throw updateError;
        }
      }

      const [stats] = await listStats([slug]);
      return {
        counted,
        stats
      };
    },
    runMemory
  );
}

async function listComments(slug) {
  assertKnownPost(slug);

  function runMemory() {
    return memoryState.comments
      .filter((comment) => comment.post_slug === slug && comment.status === "published")
      .sort((left, right) => new Date(right.created_at) - new Date(left.created_at));
  }

  return withStorageFallback(
    async function runSupabase() {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from("comments")
        .select("id, post_slug, nickname, content, status, created_at")
        .eq("post_slug", slug)
        .eq("status", "published")
        .order("created_at", { ascending: false });

      if (error) {
        throw error;
      }

      return data || [];
    },
    runMemory
  );
}

async function submitComment({ slug, nickname, content }) {
  assertKnownPost(slug);
  const config = getConfig();
  const status = config.autoPublishComments ? "published" : "pending";
  const payload = {
    id: makeId(),
    post_slug: slug,
    nickname: nickname || "Anonymous",
    content,
    status,
    created_at: nowIso()
  };

  function runMemory() {
    memoryState.comments.unshift(payload);
    if (status === "published") {
      const stat = memoryState.stats.get(slug);
      stat.comment_count += 1;
    }
    return payload;
  }

  return withStorageFallback(
    async function runSupabase() {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase.from("comments").insert(payload).select().single();

      if (error) {
        throw error;
      }

      if (status === "published") {
        const { error: updateError } = await supabase.rpc("increment_post_comment_count", {
          target_slug: slug
        });

        if (updateError) {
          throw updateError;
        }
      }

      return data;
    },
    runMemory
  );
}

async function submitMessage({ topic, nickname, message, replyEmail, sessionId, visitorHash }) {
  const payload = {
    id: makeId(),
    topic,
    nickname: nickname || "Anonymous",
    message,
    status: "new",
    session_id: sessionId,
    visitor_hash: visitorHash,
    created_at: nowIso()
  };

  if (replyEmail) {
    payload.reply_email = replyEmail;
  }

  function runMemory() {
    memoryState.messages.unshift(payload);
    return payload;
  }

  return withStorageFallback(
    async function runSupabase() {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase.from("messages").insert(payload).select().single();

      if (error) {
        throw error;
      }

      return data;
    },
    runMemory
  );
}

async function recordAnalytics({ eventName, page, postSlug, sessionId, visitorHash, metadata }) {
  const payload = {
    id: makeId(),
    event_name: eventName,
    page: page || null,
    post_slug: postSlug || null,
    session_id: sessionId || null,
    visitor_hash: visitorHash || null,
    metadata: metadata || {},
    created_at: nowIso()
  };

  function runMemory() {
    memoryState.analytics.unshift(payload);
    return payload;
  }

  return withStorageFallback(
    async function runSupabase() {
      const supabase = getSupabaseClient();
      const { error } = await supabase.from("analytics_events").insert(payload);

      if (error) {
        throw error;
      }

      return payload;
    },
    runMemory
  );
}

async function listAdminPostMetrics() {
  if (!isSupabaseReady()) {
    const stats = await listStats();
    return stats.map((row) => ({
      ...row,
      title: postMap.get(row.post_slug) ? postMap.get(row.post_slug).title : row.post_slug,
      engagement_rate: row.view_count ? Number(((row.like_count + row.comment_count) / row.view_count).toFixed(4)) : 0,
      updated_at: null
    }));
  }

  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("post_metrics")
    .select("post_slug, title, view_count, like_count, comment_count, updated_at")
    .order("updated_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data || []).map((row) => ({
    ...row,
    engagement_rate: row.view_count ? Number(((row.like_count + row.comment_count) / row.view_count).toFixed(4)) : 0
  }));
}

async function listAdminMessages() {
  if (!isSupabaseReady()) {
    return memoryState.messages.map((message) => ({
      id: message.id,
      topic: message.topic,
      nickname: message.nickname,
      status: message.status,
      reply_email: message.reply_email || null,
      created_at: message.created_at,
      preview: String(message.message || "").slice(0, 160)
    }));
  }

  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("messages")
    .select("id, topic, nickname, status, reply_email, created_at, message")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error && String(error.message || "").includes("reply_email")) {
    const fallback = await supabase
      .from("messages")
      .select("id, topic, nickname, status, created_at, message")
      .order("created_at", { ascending: false })
      .limit(50);

    if (fallback.error) {
      throw fallback.error;
    }

    return (fallback.data || []).map((message) => ({
      ...message,
      reply_email: null,
      preview: String(message.message || "").slice(0, 160)
    }));
  }

  if (error) {
    throw error;
  }

  return (data || []).map((message) => ({
    ...message,
    preview: String(message.message || "").slice(0, 160)
  }));
}

async function getAdminMessage(messageId) {
  if (!messageId) {
    const error = new Error("Message id is required");
    error.statusCode = 400;
    throw error;
  }

  if (!isSupabaseReady()) {
    const message = memoryState.messages.find((entry) => entry.id === messageId);
    if (!message) {
      return null;
    }

    return {
      ...message,
      replies: memoryState.replies.filter((reply) => reply.message_id === messageId)
    };
  }

  const supabase = getSupabaseClient();
  const [{ data: message, error: messageError }, { data: replies, error: repliesError }] = await Promise.all([
    supabase
      .from("messages")
      .select("id, topic, nickname, status, reply_email, message, created_at")
      .eq("id", messageId)
      .maybeSingle(),
    supabase
      .from("message_replies")
      .select("id, message_id, reply_to, subject, body, resend_email_id, sent_at, created_at")
      .eq("message_id", messageId)
      .order("created_at", { ascending: false })
  ]);

  if (messageError) {
    throw messageError;
  }

  if (repliesError) {
    throw repliesError;
  }

  return message ? { ...message, replies: replies || [] } : null;
}

async function updateAdminMessageStatus(messageId, status) {
  if (!["new", "read", "replied", "archived"].includes(status)) {
    const error = new Error("Invalid message status");
    error.statusCode = 400;
    throw error;
  }

  if (!isSupabaseReady()) {
    const message = memoryState.messages.find((entry) => entry.id === messageId);
    if (!message) {
      return null;
    }
    message.status = status;
    await logAdminAction({ action: "message.status", targetType: "message", targetId: messageId, metadata: { status } });
    return message;
  }

  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("messages")
    .update({ status })
    .eq("id", messageId)
    .select("id, topic, nickname, status, reply_email, message, created_at")
    .maybeSingle();

  if (error) {
    throw error;
  }

  await logAdminAction({ action: "message.status", targetType: "message", targetId: messageId, metadata: { status } });
  return data;
}

async function recordMessageReply({ messageId, replyTo, subject, body, resendEmailId }) {
  const payload = {
    id: makeId(),
    message_id: messageId,
    reply_to: replyTo,
    subject,
    body,
    resend_email_id: resendEmailId || null,
    sent_at: nowIso(),
    created_at: nowIso()
  };

  if (!isSupabaseReady()) {
    memoryState.replies.unshift(payload);
    const message = memoryState.messages.find((entry) => entry.id === messageId);
    if (message) {
      message.status = "replied";
    }
    await logAdminAction({ action: "message.reply", targetType: "message", targetId: messageId, metadata: { replyTo } });
    return payload;
  }

  const supabase = getSupabaseClient();
  const { data, error } = await supabase.from("message_replies").insert(payload).select().single();

  if (error) {
    throw error;
  }

  await supabase.from("messages").update({ status: "replied" }).eq("id", messageId);
  await logAdminAction({ action: "message.reply", targetType: "message", targetId: messageId, metadata: { replyTo } });
  return data;
}

async function listAdminPosts() {
  if (!isSupabaseReady()) {
    return memoryState.posts.map(normalizeAdminPost);
  }

  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("blog_posts")
    .select("id, slug, title, excerpt, category, cover_url, content, status, featured, published_at, created_at, updated_at")
    .order("updated_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data || []).map(normalizeAdminPost);
}

async function createAdminPost(payload) {
  const post = {
    id: makeId(),
    ...validatePostInput(payload, { mode: "draft" }),
    status: "draft",
    created_at: nowIso(),
    updated_at: nowIso(),
    published_at: null
  };

  if (!isSupabaseReady()) {
    memoryState.posts.unshift(post);
    await logAdminAction({ action: "post.create", targetType: "blog_post", targetId: post.id, metadata: { slug: post.slug } });
    return normalizeAdminPost(post);
  }

  const supabase = getSupabaseClient();
  const { data, error } = await supabase.from("blog_posts").insert(post).select().single();

  if (error) {
    throw error;
  }

  await logAdminAction({ action: "post.create", targetType: "blog_post", targetId: data.id, metadata: { slug: data.slug } });
  return normalizeAdminPost(data);
}

async function updateAdminPost(postId, payload) {
  const next = {
    ...validatePostInput(payload, { mode: payload.status === "published" ? "publish" : "draft" }),
    updated_at: nowIso()
  };

  if (next.status === "published") {
    next.published_at = payload.publishedAt || payload.published_at || nowIso();
  }

  if (!isSupabaseReady()) {
    const post = memoryState.posts.find((entry) => entry.id === postId);
    if (!post) {
      return null;
    }
    Object.assign(post, next);
    await logAdminAction({ action: "post.update", targetType: "blog_post", targetId: postId, metadata: { slug: post.slug } });
    return normalizeAdminPost(post);
  }

  const supabase = getSupabaseClient();
  const { data, error } = await supabase.from("blog_posts").update(next).eq("id", postId).select().maybeSingle();

  if (error) {
    throw error;
  }

  if (data) {
    await logAdminAction({ action: "post.update", targetType: "blog_post", targetId: postId, metadata: { slug: data.slug } });
  }

  return data ? normalizeAdminPost(data) : null;
}

async function publishAdminPost(postId) {
  const posts = await listAdminPosts();
  const post = posts.find((entry) => entry.id === postId);

  if (!post) {
    return null;
  }

  const published = await updateAdminPost(postId, {
    ...post,
    status: "published",
    publishedAt: post.published_at || nowIso()
  });

  if (published && isSupabaseReady()) {
    await ensureSupabaseMetricRow(published.slug);
  }

  if (published) {
    await logAdminAction({ action: "post.publish", targetType: "blog_post", targetId: postId, metadata: { slug: published.slug } });
  }

  return published;
}

async function archiveAdminPost(postId) {
  const posts = await listAdminPosts();
  const post = posts.find((entry) => entry.id === postId);

  if (!post) {
    return null;
  }

  const archived = await updateAdminPost(postId, {
    ...post,
    status: "archived"
  });

  if (archived) {
    await logAdminAction({ action: "post.archive", targetType: "blog_post", targetId: postId, metadata: { slug: archived.slug } });
  }

  return archived;
}

async function uploadBlogImage({ fileName, mimeType, base64Data, postId, altText }) {
  if (!/^image\/(png|jpe?g|webp|gif)$/i.test(mimeType || "")) {
    const error = new Error("Only png, jpg, webp, and gif images are allowed");
    error.statusCode = 400;
    throw error;
  }

  const buffer = Buffer.from(String(base64Data || ""), "base64");
  if (!buffer.length || buffer.length > 4_000_000) {
    const error = new Error("Image must be smaller than 4MB");
    error.statusCode = 400;
    throw error;
  }

  const safeName = String(fileName || "image")
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+/, "");
  const storagePath = `${new Date().toISOString().slice(0, 10)}/${makeId()}-${safeName || "image"}`;

  if (!isSupabaseReady()) {
    const asset = {
      id: makeId(),
      post_id: postId || null,
      storage_bucket: "blog-assets",
      storage_path: storagePath,
      public_url: "",
      alt_text: altText || null,
      created_at: nowIso()
    };
    memoryState.assets.unshift(asset);
    return asset;
  }

  const supabase = getSupabaseClient();
  const { error: uploadError } = await supabase.storage.from("blog-assets").upload(storagePath, buffer, {
    contentType: mimeType,
    upsert: false
  });

  if (uploadError) {
    throw uploadError;
  }

  const { data: publicData } = supabase.storage.from("blog-assets").getPublicUrl(storagePath);
  const publicUrl = publicData.publicUrl;
  const payload = {
    id: makeId(),
    post_id: postId || null,
    storage_bucket: "blog-assets",
    storage_path: storagePath,
    public_url: publicUrl,
    alt_text: altText || null,
    created_at: nowIso()
  };

  const { data, error } = await supabase.from("blog_assets").insert(payload).select().single();

  if (error) {
    throw error;
  }

  await logAdminAction({ action: "asset.upload", targetType: "blog_asset", targetId: data.id, metadata: { storagePath } });
  return data;
}

async function logAdminAction({ action, targetType, targetId, metadata }) {
  const payload = {
    id: makeId(),
    action,
    target_type: targetType,
    target_id: targetId || null,
    metadata: metadata || {},
    created_at: nowIso()
  };

  if (!isSupabaseReady()) {
    memoryState.adminLogs.unshift(payload);
    return payload;
  }

  const supabase = getSupabaseClient();
  const { error } = await supabase.from("admin_action_logs").insert(payload);

  if (error) {
    throw error;
  }

  return payload;
}

module.exports = {
  getActiveStorageMode,
  isSupabaseConfigured,
  isSupabaseReady,
  archiveAdminPost,
  createAdminPost,
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
};
