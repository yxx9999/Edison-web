(function () {
  var API_BASE = "/api";

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;");
  }

  function renderMarkdown(markdown) {
    var lines = String(markdown || "").trim().split("\n");
    var html = "";
    var inList = false;
    var inCode = false;
    var codeBuffer = [];

    function flushList() {
      if (inList) {
        html += "</ul>";
        inList = false;
      }
    }

    function flushCode() {
      if (inCode) {
        html += "<pre><code>" + escapeHtml(codeBuffer.join("\n")) + "</code></pre>";
        inCode = false;
        codeBuffer = [];
      }
    }

    lines.forEach(function (rawLine) {
      var line = rawLine.trimEnd();

      if (line.startsWith("```")) {
        flushList();
        if (inCode) {
          flushCode();
        } else {
          inCode = true;
        }
        return;
      }

      if (inCode) {
        codeBuffer.push(rawLine);
        return;
      }

      if (!line.trim()) {
        flushList();
        return;
      }

      if (line.startsWith("## ")) {
        flushList();
        html += "<h3>" + escapeHtml(line.slice(3)) + "</h3>";
        return;
      }

      if (/^\d+\.\s+/.test(line)) {
        flushList();
        html += "<p>" + escapeHtml(line) + "</p>";
        return;
      }

      if (line.startsWith("- ")) {
        if (!inList) {
          html += "<ul>";
          inList = true;
        }
        html += "<li>" + escapeHtml(line.slice(2)) + "</li>";
        return;
      }

      flushList();
      html += "<p>" + escapeHtml(line) + "</p>";
    });

    flushList();
    flushCode();
    return html;
  }

  async function apiRequest(path, options) {
    var response = await fetch(API_BASE + path, {
      credentials: "same-origin",
      headers: {
        "Content-Type": "application/json"
      },
      ...(options || {})
    });

    var data = {};

    try {
      data = await response.json();
    } catch (error) {
      data = {};
    }

    if (!response.ok || data.ok === false) {
      throw new Error(data.error || "Request failed");
    }

    return data;
  }

  function formatMetric(value, suffix) {
    return String(value || 0) + " " + suffix;
  }

  function getPostCover(post) {
    return post.cover || "/image/blog/banner.jpg";
  }

  async function trackEvent(eventName, metadata) {
    try {
      await apiRequest("/analytics", {
        method: "POST",
        body: JSON.stringify({
          eventName: eventName,
          page: window.location.pathname,
          postSlug: metadata && metadata.postSlug ? metadata.postSlug : null,
          metadata: metadata || {}
        })
      });
    } catch (error) {
      return;
    }
  }

  function renderCommentList(comments) {
    if (!comments.length) {
      return '<div class="status-card"><p>No published comments yet.</p></div>';
    }

    return (
      '<div class="comment-list">' +
      comments
        .map(function (comment) {
          return (
            '<article class="comment-card">' +
            '<div class="comment-heading">' +
            "<strong>" +
            escapeHtml(comment.nickname || "Anonymous") +
            "</strong>" +
            '<time class="comment-date" datetime="' +
            escapeHtml(comment.created_at || "") +
            '">' +
            escapeHtml(new Date(comment.created_at).toLocaleString()) +
            "</time>" +
            "</div>" +
            '<p class="comment-content">' +
            escapeHtml(comment.content) +
            "</p>" +
            "</article>"
          );
        })
        .join("") +
      "</div>"
    );
  }

  function renderPostList(posts, statsMap) {
    return (
      '<div class="post-list">' +
      posts
        .map(function (post) {
          var stats = statsMap[post.slug] || {};
          var viewCount = typeof stats.view_count === "number" ? stats.view_count : post.views;
          var likeCount = typeof stats.like_count === "number" ? stats.like_count : post.likes;
          var commentCount = typeof stats.comment_count === "number" ? stats.comment_count : 0;

          return (
            '<article class="post-card">' +
            '<a class="post-cover" href="/blog.html?slug=' +
            encodeURIComponent(post.slug) +
            '" aria-label="' +
            escapeHtml(post.title) +
            '">' +
            '<img src="' +
            escapeHtml(getPostCover(post)) +
            '" alt="' +
            escapeHtml(post.title) +
            '" />' +
            "</a>" +
            '<div class="post-card-body">' +
            "<h3>" +
            escapeHtml(post.title) +
            "</h3>" +
            "<p>" +
            escapeHtml(post.excerpt) +
            "</p>" +
            '<div class="post-card-footer">' +
            '<div class="post-meta">' +
            "<span>" +
            escapeHtml(post.date) +
            "</span>" +
            "<span>" +
            escapeHtml(post.category) +
            "</span>" +
            "<span>" +
            formatMetric(viewCount, "views") +
            "</span>" +
            "<span>" +
            formatMetric(likeCount, "likes") +
            "</span>" +
            "<span>" +
            formatMetric(commentCount, "comments") +
            "</span>" +
            "</div>" +
            '<a class="button button-primary" href="/blog.html?slug=' +
            encodeURIComponent(post.slug) +
            '">Read</a>' +
            "</div>" +
            "</div>" +
            "</article>"
          );
        })
        .join("") +
      "</div>"
    );
  }

  function renderPostDetail(post, stats, comments, feedback) {
    var viewCount = typeof stats.view_count === "number" ? stats.view_count : post.views;
    var likeCount = typeof stats.like_count === "number" ? stats.like_count : post.likes;
    var commentCount = typeof stats.comment_count === "number" ? stats.comment_count : comments.length;

    return (
      '<article class="blog-article">' +
      '<p class="blog-article-subtitle">' +
      escapeHtml(post.excerpt) +
      "</p>" +
      '<div class="blog-meta">' +
      "<span>" +
      escapeHtml(post.date) +
      "</span>" +
      "<span>" +
      escapeHtml(post.category) +
      "</span>" +
      '<span id="post-view-count">' +
      formatMetric(viewCount, "views") +
      "</span>" +
      '<span id="post-like-count">' +
      formatMetric(likeCount, "likes") +
      "</span>" +
      '<span id="post-comment-count">' +
      formatMetric(commentCount, "comments") +
      "</span>" +
      "</div>" +
      '<div class="markdown-body">' +
      renderMarkdown(post.content) +
      "</div>" +
      '<nav class="article-action-nav" aria-label="Article actions">' +
      '<button class="button button-secondary like-button" type="button" id="post-like-button">Like This Post</button>' +
      '<button class="button button-primary" type="button" id="post-share-button">Share With Friend</button>' +
      '<button class="button button-secondary" type="button" id="post-comment-button">Chat With Others</button>' +
      "</nav>" +
      '<p class="status-inline article-action-status" id="post-like-status"></p>' +
      '<section class="comment-section" id="comments">' +
      '<div class="section-heading">' +
      '<p class="eyebrow">Comments</p>' +
      "<h3>Join the thread</h3>" +
      "</div>" +
      '<div id="comment-list">' +
      renderCommentList(comments) +
      "</div>" +
      "</section>" +
      '<div class="comment-modal" id="comment-modal" hidden>' +
      '<button class="comment-modal-backdrop" type="button" data-comment-close aria-label="Close comment form"></button>' +
      '<section class="comment-modal-panel" role="dialog" aria-modal="true" aria-labelledby="comment-modal-title">' +
      '<div class="comment-modal-header">' +
      '<div><p class="eyebrow">Write Comment</p><h3 id="comment-modal-title">Chat With Others</h3></div>' +
      '<button class="comment-modal-close" type="button" data-comment-close aria-label="Close comment form">Close</button>' +
      "</div>" +
      '<form class="comment-form" id="comment-form">' +
      '<input type="text" name="website" class="bot-field" tabindex="-1" autocomplete="off" aria-hidden="true" />' +
      '<label>Name (optional)<input type="text" name="nickname" maxlength="24" placeholder="Anonymous is fine" /></label>' +
      '<label>Comment<textarea name="content" rows="4" required minlength="4" maxlength="300" placeholder="Share a thought"></textarea></label>' +
      '<div class="detail-actions">' +
      '<button class="button button-secondary" type="submit">Submit Comment</button>' +
      '<p class="status-inline" id="comment-form-status">' +
      escapeHtml(feedback || "") +
      "</p>" +
      "</div>" +
      "</form>" +
      "</section>" +
      "</div>" +
      "</article>"
    );
  }

  async function fetchStatsMap(posts) {
    try {
      var data = await apiRequest(
        "/posts/stats?slugs=" +
          posts
            .map(function (post) {
              return encodeURIComponent(post.slug);
            })
            .join(",")
      );
      return (data.stats || []).reduce(function (acc, item) {
        acc[item.post_slug] = item;
        return acc;
      }, {});
    } catch (error) {
      return {};
    }
  }

  async function loadBlogPosts() {
    var fallbackPosts = Array.isArray(window.BLOG_POSTS) ? window.BLOG_POSTS : [];

    try {
      var data = await apiRequest("/posts");
      if (Array.isArray(data.posts) && data.posts.length) {
        return data.posts;
      }
    } catch (error) {
      return fallbackPosts;
    }

    return fallbackPosts;
  }

  function attachPostInteractions(post, content, stats, comments) {
    var likeButton = document.getElementById("post-like-button");
    var likeStatus = document.getElementById("post-like-status");
    var shareButton = document.getElementById("post-share-button");
    var commentButton = document.getElementById("post-comment-button");
    var commentModal = document.getElementById("comment-modal");
    var commentCloseButtons = document.querySelectorAll("[data-comment-close]");
    var commentForm = document.getElementById("comment-form");
    var commentStatus = document.getElementById("comment-form-status");

    if (likeButton && likeStatus) {
      likeButton.addEventListener("click", async function () {
        likeButton.disabled = true;
        likeStatus.textContent = "Saving like...";

        try {
          var data = await apiRequest("/posts/" + encodeURIComponent(post.slug) + "/like", {
            method: "POST",
            body: JSON.stringify({})
          });
          content.innerHTML = renderPostDetail(post, data.stats || stats, comments, commentStatus.textContent);
          attachPostInteractions(post, content, data.stats || stats, comments);
          likeStatus = document.getElementById("post-like-status");
          if (likeStatus) {
            likeStatus.textContent = data.counted ? "Like recorded." : "Like already counted for this visitor.";
          }
          trackEvent("blog_like", { postSlug: post.slug });
        } catch (error) {
          likeButton.disabled = false;
          likeStatus.textContent = error.message;
        }
      });
    }

    if (shareButton) {
      shareButton.addEventListener("click", async function () {
        var sharePayload = {
          title: post.title,
          text: post.excerpt || post.title,
          url: window.location.href
        };

        try {
          if (navigator.share) {
            await navigator.share(sharePayload);
            shareButton.textContent = "Shared";
          } else {
            await navigator.clipboard.writeText(window.location.href);
            shareButton.textContent = "Link Copied";
          }
          trackEvent("blog_share", { postSlug: post.slug });
        } catch (error) {
          shareButton.textContent = "Share Unavailable";
        }
      });
    }

    if (commentButton && commentModal) {
      var closeCommentModal = function () {
        commentModal.hidden = true;
        document.body.classList.remove("modal-open");
      };

      var openCommentModal = function () {
        commentModal.hidden = false;
        document.body.classList.add("modal-open");
        var commentInput = commentModal.querySelector("textarea[name='content']");
        if (commentInput) {
          commentInput.focus();
        }
      };

      commentButton.addEventListener("click", openCommentModal);
      commentCloseButtons.forEach(function (button) {
        button.addEventListener("click", closeCommentModal);
      });
      document.addEventListener("keydown", function (event) {
        if (event.key === "Escape" && !commentModal.hidden) {
          closeCommentModal();
        }
      });
    }
    if (commentForm && commentStatus) {
      commentForm.addEventListener("submit", async function (event) {
        event.preventDefault();
        commentStatus.textContent = "Submitting comment...";
        var formData = new FormData(commentForm);
        var payload = {
          nickname: String(formData.get("nickname") || "").trim(),
          content: String(formData.get("content") || "").trim(),
          website: String(formData.get("website") || "").trim()
        };

        try {
          var data = await apiRequest("/posts/" + encodeURIComponent(post.slug) + "/comments", {
            method: "POST",
            body: JSON.stringify(payload)
          });
          commentForm.reset();
          commentStatus.textContent = data.message || "Comment submitted.";

          var commentsResponse = await apiRequest("/posts/" + encodeURIComponent(post.slug) + "/comments");
          comments = commentsResponse.comments || [];
          var latestStatsMap = await fetchStatsMap([post]);
          stats = latestStatsMap[post.slug] || stats;
          content.innerHTML = renderPostDetail(post, stats, comments, commentStatus.textContent);
          attachPostInteractions(post, content, stats, comments);
          trackEvent("blog_comment_submit", { postSlug: post.slug, status: data.comment.status });
        } catch (error) {
          commentStatus.textContent = error.message;
        }
      });
    }
  }

  async function initBlog() {
    var app = document.getElementById("blog-app");
    if (!app) {
      return;
    }

    var params = new URLSearchParams(window.location.search);
    var slug = params.get("slug");
    var posts = await loadBlogPosts();
    var featured = document.getElementById("featured-posts");
    var content = document.getElementById("blog-content");
    var title = document.getElementById("blog-view-title");
    var toolbar = title ? title.closest(".blog-toolbar") : null;

    function setBackLink(visible) {
      if (!toolbar) {
        return;
      }

      var backLink = document.getElementById("blog-back-link");

      if (!visible) {
        if (backLink) {
          backLink.remove();
        }
        return;
      }

      if (!backLink) {
        backLink = document.createElement("a");
        backLink.className = "button button-secondary";
        backLink.id = "blog-back-link";
        backLink.href = "/blog.html";
        backLink.textContent = "Go Back";
        toolbar.appendChild(backLink);
      }
    }

    if (!posts.length) {
      title.textContent = "Blogs";
      title.classList.remove("blog-detail-title");
      content.innerHTML = '<div class="status-card"><p>No posts are available yet.</p></div>';
      return;
    }

    featured.innerHTML = posts
      .filter(function (post) {
        return post.featured;
      })
      .slice(0, 5)
      .map(function (post) {
        return '<li><a href="/blog.html?slug=' + encodeURIComponent(post.slug) + '">' + escapeHtml(post.title) + "</a></li>";
      })
      .join("");

    if (!slug) {
      title.textContent = "Blogs";
      title.classList.remove("blog-detail-title");
      setBackLink(false);
      content.innerHTML = renderPostList(posts, {});
      var listStatsMap = await fetchStatsMap(posts);
      content.innerHTML = renderPostList(posts, listStatsMap);
      return;
    }

    var post = posts.find(function (entry) {
      return entry.slug === slug;
    });

    if (!post) {
      title.textContent = "Post Not Found";
      title.classList.add("blog-detail-title");
      setBackLink(true);
      content.innerHTML = '<div class="status-card"><p>Post not found. Return to the list and try again.</p></div>';
      return;
    }

    title.textContent = post.title;
    title.classList.add("blog-detail-title");
    setBackLink(true);
    content.innerHTML = renderPostDetail(post, {}, [], "");

    var stats = {};
    var comments = [];

    try {
      var viewResponse = await apiRequest("/posts/" + encodeURIComponent(post.slug) + "/view", {
        method: "POST",
        body: JSON.stringify({})
      });
      stats = viewResponse.stats || {};
    } catch (error) {
      stats = {};
    }

    try {
      var commentsResponse = await apiRequest("/posts/" + encodeURIComponent(post.slug) + "/comments");
      comments = commentsResponse.comments || [];
    } catch (error) {
      comments = [];
    }

    content.innerHTML = renderPostDetail(post, stats, comments, "");
    attachPostInteractions(post, content, stats, comments);
  }

  function renderMailStatus(message, tone) {
    var className = tone === "error" ? "status-card status-card-error" : "status-card";
    return '<div class="' + className + '"><p>' + escapeHtml(message) + "</p></div>";
  }

  function initMailForm() {
    var form = document.getElementById("mail-form");
    var log = document.getElementById("submission-log");
    if (!form || !log) {
      return;
    }

    log.innerHTML = renderMailStatus("Messages will be sent to the backend service. If Supabase keys are missing, dev mode uses memory storage.", "info");

    form.addEventListener("submit", async function (event) {
      event.preventDefault();
      var formData = new FormData(form);
      var payload = {
        topic: String(formData.get("topic") || "").trim(),
        nickname: String(formData.get("nickname") || "").trim(),
        replyEmail: String(formData.get("replyEmail") || "").trim(),
        message: String(formData.get("message") || "").trim(),
        website: String(formData.get("website") || "").trim()
      };

      if (!payload.topic || payload.message.length < 12) {
        log.innerHTML = renderMailStatus("Please provide a topic and a message with at least 12 characters.", "error");
        return;
      }

      log.innerHTML = renderMailStatus("Submitting message...", "info");

      try {
        var data = await apiRequest("/messages", {
          method: "POST",
          body: JSON.stringify(payload)
        });
        form.reset();
        var notificationText = data.notification && data.notification.sent ? "Email notification sent." : "Stored successfully. Email notification is not configured yet.";
        log.innerHTML = renderMailStatus("Message stored. " + notificationText, "info");
        trackEvent("mail_submit", { topic: payload.topic });
      } catch (error) {
        log.innerHTML = renderMailStatus(error.message, "error");
      }
    });
  }

  function initContactActions() {
    var copyButton = document.getElementById("copy-email-button");
    var copyStatus = document.getElementById("copy-email-status");
    var shareButton = document.getElementById("share-contact-button");
    var externalLinks = document.querySelectorAll('.icon-link-grid a[href^="http"]');

    if (copyButton && copyStatus) {
      copyButton.addEventListener("click", async function () {
        var email = copyButton.dataset.email || "";

        try {
          await navigator.clipboard.writeText(email);
          copyStatus.textContent = "Email copied.";
          trackEvent("contact_copy_email", { email: email });
        } catch (error) {
          copyStatus.textContent = "Copy failed. Please copy the email manually.";
        }
      });
    }

    if (shareButton) {
      shareButton.addEventListener("click", async function () {
        var sharePayload = {
          title: document.title,
          text: "Edison Contact",
          url: window.location.href
        };

        try {
          if (navigator.share) {
            await navigator.share(sharePayload);
            shareButton.textContent = "Shared";
          } else {
            await navigator.clipboard.writeText(window.location.href);
            shareButton.textContent = "Link Copied";
          }
          trackEvent("contact_share", {});
        } catch (error) {
          shareButton.textContent = "Share Unavailable";
        }
      });
    }

    externalLinks.forEach(function (link) {
      link.addEventListener("click", function () {
        trackEvent("contact_outbound_click", {
          href: link.href
        });
      });
    });
  }

  function initStartTracking() {
    var objectLinks = document.querySelectorAll(".object-link");
    objectLinks.forEach(function (link) {
      link.addEventListener("click", function () {
        trackEvent("start_object_click", {
          href: link.getAttribute("href") || "",
          label: link.closest(".object-card") ? link.closest(".object-card").querySelector("h2").textContent : ""
        });
      });
    });
  }

  initBlog();
  initMailForm();
  initContactActions();
  initStartTracking();
})();
