"use strict";

const fallbackPosts = require("./fallback-posts");

module.exports = fallbackPosts.map((post) => ({
  slug: post.slug,
  title: post.title,
  fallbackViews: post.views,
  fallbackLikes: post.likes
}));
