(function () {
  var loginForm = document.getElementById("admin-login-form");
  var loginStatus = document.getElementById("admin-login-status");
  var dashboard = document.getElementById("admin-dashboard");
  var logoutButton = document.getElementById("admin-logout-button");
  var summaryGrid = document.getElementById("admin-summary-grid");
  var metricsTable = document.getElementById("admin-post-metrics-table");
  var messageList = document.getElementById("admin-message-list");
  var messageDetail = document.getElementById("admin-message-detail");
  var postListTable = document.getElementById("admin-post-list-table");
  var postForm = document.getElementById("admin-post-form");
  var postStatus = document.getElementById("admin-post-status");
  var newPostButton = document.getElementById("admin-new-post-button");
  var publishPostButton = document.getElementById("admin-publish-post-button");
  var archivePostButton = document.getElementById("admin-archive-post-button");
  var uploadImageButton = document.getElementById("admin-upload-image-button");
  var markdownPreview = document.getElementById("admin-markdown-preview");
  var state = {
    messages: [],
    posts: [],
    selectedPost: null
  };
  var isLoginPage = Boolean(loginForm) && !dashboard;
  var isDashboardPage = Boolean(dashboard);

  function setStatus(message) {
    if (loginStatus) {
      loginStatus.textContent = message || "";
    }
  }

  function setPostStatus(message) {
    if (postStatus) {
      postStatus.textContent = message || "";
    }
  }

  function makePublicPostUrl(slug) {
    return "/blog.html?slug=" + encodeURIComponent(slug);
  }

  function escapeHtml(value) {
    return String(value || "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;");
  }

  function markdownToHtml(markdown) {
    var lines = String(markdown || "").split("\n");
    var html = [];
    var inList = false;

    lines.forEach(function (line) {
      if (/^##\s+/.test(line)) {
        if (inList) {
          html.push("</ul>");
          inList = false;
        }
        html.push("<h4>" + escapeHtml(line.replace(/^##\s+/, "")) + "</h4>");
        return;
      }

      if (/^-\s+/.test(line)) {
        if (!inList) {
          html.push("<ul>");
          inList = true;
        }
        html.push("<li>" + escapeHtml(line.replace(/^-\s+/, "")) + "</li>");
        return;
      }

      if (inList) {
        html.push("</ul>");
        inList = false;
      }

      if (/^!\[[^\]]*]\([^)]+\)/.test(line)) {
        var imageMatch = line.match(/^!\[([^\]]*)]\(([^)]+)\)/);
        html.push('<img src="' + escapeHtml(imageMatch[2]) + '" alt="' + escapeHtml(imageMatch[1]) + '" />');
        return;
      }

      if (line.trim()) {
        html.push("<p>" + escapeHtml(line) + "</p>");
      }
    });

    if (inList) {
      html.push("</ul>");
    }

    return html.join("");
  }

  async function request(path, options) {
    var response = await fetch(path, {
      credentials: "same-origin",
      headers: {
        "Content-Type": "application/json"
      },
      ...(options || {})
    });
    var data = await response.json();

    if (!response.ok || data.ok === false) {
      if (response.status === 401 && data.error === "Admin authentication required") {
        throw new Error("后台登录状态已失效，请重新登录后再操作。");
      }
      throw new Error(data.error || "请求失败");
    }

    return data;
  }

  async function ensureAdminSession() {
    var data = await request("/api/admin/session");
    if (!data.authenticated) {
      renderAuthenticated(false);
      throw new Error("后台登录状态已失效，请重新登录后再操作。");
    }
  }

  async function verifyPublishedPost(slug) {
    var adminPostsResponse = await request("/api/admin/posts");
    var adminPost = (adminPostsResponse.posts || []).find(function (post) {
      return post.slug === slug;
    });

    if (!adminPost || adminPost.status !== "published") {
      throw new Error("数据库未确认发布状态，请刷新后台后重试。");
    }

    var publicResponse = await request("/api/posts/" + encodeURIComponent(slug));
    if (!publicResponse.post || publicResponse.post.slug !== slug) {
      throw new Error("文章已保存，但前端公开接口暂时没有读到。");
    }

    return {
      adminPost: adminPost,
      publicPost: publicResponse.post
    };
  }

  function readFileAsDataUrl(file) {
    return new Promise(function (resolve, reject) {
      var reader = new FileReader();
      reader.onload = function () {
        resolve(String(reader.result || ""));
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  function renderAuthenticated(authenticated) {
    if (isLoginPage) {
      if (authenticated) {
        window.location.replace("/admin.html");
      }
      return;
    }

    if (!isDashboardPage) {
      return;
    }

    if (!authenticated) {
      window.location.replace("/admin-login.html");
      return;
    }

    dashboard.hidden = false;

    loadDashboard();
  }

  function renderSummary(posts, messages) {
    var totalViews = posts.reduce(function (sum, post) {
      return sum + Number(post.view_count || 0);
    }, 0);
    var totalLikes = posts.reduce(function (sum, post) {
      return sum + Number(post.like_count || 0);
    }, 0);
    var pendingMessages = messages.filter(function (message) {
      return message.status === "new";
    }).length;
    var publishedPosts = state.posts.filter(function (post) {
      return post.status === "published";
    }).length;

    summaryGrid.innerHTML =
      '<article class="admin-summary-card"><span>总浏览量</span><strong>' +
      totalViews +
      "</strong></article>" +
      '<article class="admin-summary-card"><span>总点赞数</span><strong>' +
      totalLikes +
      "</strong></article>" +
      '<article class="admin-summary-card"><span>来信总数</span><strong>' +
      messages.length +
      "</strong></article>" +
      '<article class="admin-summary-card"><span>已发布文章</span><strong>' +
      publishedPosts +
      "</strong></article>" +
      '<article class="admin-summary-card"><span>未处理来信</span><strong>' +
      pendingMessages +
      "</strong></article>";
  }

  function renderMetrics(posts) {
    if (!posts.length) {
      metricsTable.innerHTML = '<tbody><tr><td>暂无文章数据。</td></tr></tbody>';
      return;
    }

    metricsTable.innerHTML =
      "<thead><tr><th>文章</th><th>浏览</th><th>点赞</th><th>评论</th><th>互动率</th></tr></thead><tbody>" +
      posts
        .map(function (post) {
          return (
            "<tr><td>" +
            escapeHtml(post.title) +
            "<br><small>" +
            escapeHtml(post.post_slug) +
            "</small></td><td>" +
            Number(post.view_count || 0) +
            "</td><td>" +
            Number(post.like_count || 0) +
            "</td><td>" +
            Number(post.comment_count || 0) +
            "</td><td>" +
            Math.round(Number(post.engagement_rate || 0) * 10000) / 100 +
            "%</td></tr>"
          );
        })
        .join("") +
      "</tbody>";
  }

  function renderMessages(messages) {
    if (!messages.length) {
      messageList.innerHTML = '<div class="status-card"><p>暂无来信。</p></div>';
      return;
    }

    messageList.innerHTML = messages
      .map(function (message) {
        var replyable = message.reply_email ? "可回复" : "未留邮箱";
        return (
          '<article class="admin-message-card" data-message-id="' +
          escapeHtml(message.id) +
          '">' +
          "<div><strong>" +
          escapeHtml(message.topic) +
          "</strong><span>" +
          escapeHtml(message.status) +
          "</span></div>" +
          "<p>" +
          escapeHtml(message.preview) +
          "</p><small>" +
          escapeHtml(message.nickname || "匿名") +
          " | " +
          escapeHtml(replyable) +
          " | " +
          new Date(message.created_at).toLocaleString() +
          '</small><button class="button button-secondary" type="button" data-open-message="' +
          escapeHtml(message.id) +
          '">打开</button></article>'
        );
      })
      .join("");
  }

  function renderMessageDetail(message) {
    if (!messageDetail) {
      return;
    }

    var replyable = Boolean(message.reply_email);
    messageDetail.innerHTML =
      '<article class="admin-detail-card"><h4>' +
      escapeHtml(message.topic) +
      "</h4><p>" +
      escapeHtml(message.message) +
      "</p><small>发件人：" +
      escapeHtml(message.nickname || "匿名") +
      " | 回复邮箱：" +
      escapeHtml(message.reply_email || "未提供") +
      "</small>" +
      '<div class="form-actions"><button class="button button-secondary" type="button" data-message-status="read" data-message-id="' +
      escapeHtml(message.id) +
      '">标记已读</button><button class="button button-secondary" type="button" data-message-status="archived" data-message-id="' +
      escapeHtml(message.id) +
      '">归档</button></div>' +
      '<form class="admin-reply-form" data-reply-message-id="' +
      escapeHtml(message.id) +
      '">' +
      '<label>回复主题<input name="subject" value="Re: ' +
      escapeHtml(message.topic) +
      '" ' +
      (replyable ? "" : "disabled") +
      " /></label>" +
      '<label>回复内容<textarea name="body" rows="5" ' +
      (replyable ? "" : "disabled") +
      "></textarea></label>" +
      '<button class="button button-primary" type="submit" ' +
      (replyable ? "" : "disabled") +
      ">发送回复</button></form>" +
      "<h5>回复记录</h5>" +
      (message.replies || [])
        .map(function (reply) {
          return "<p><strong>" + escapeHtml(reply.subject) + "</strong><br />" + escapeHtml(reply.body) + "</p>";
        })
        .join("") +
      "</article>";
  }

  function getPostFormPayload(status) {
    var formData = new FormData(postForm);
    return {
      id: String(formData.get("id") || ""),
      title: String(formData.get("title") || ""),
      slug: String(formData.get("slug") || ""),
      category: String(formData.get("category") || ""),
      excerpt: String(formData.get("excerpt") || ""),
      coverUrl: String(formData.get("coverUrl") || ""),
      content: String(formData.get("content") || ""),
      featured: Boolean(formData.get("featured")),
      status: status || "draft"
    };
  }

  function fillPostForm(post) {
    state.selectedPost = post || null;
    postForm.elements.id.value = post ? post.id : "";
    postForm.elements.title.value = post ? post.title : "";
    postForm.elements.slug.value = post ? post.slug : "";
    postForm.elements.category.value = post ? post.category : "";
    postForm.elements.excerpt.value = post ? post.excerpt : "";
    postForm.elements.coverUrl.value = post ? post.cover_url : "";
    postForm.elements.content.value = post ? post.content : "";
    postForm.elements.featured.checked = post ? Boolean(post.featured) : false;
    renderPreview();
  }

  function renderPostList(posts) {
    if (!postListTable) {
      return;
    }

    if (!posts.length) {
      postListTable.innerHTML = "<tbody><tr><td>暂无文章。</td></tr></tbody>";
      return;
    }

    postListTable.innerHTML =
      "<thead><tr><th>标题</th><th>状态</th><th>更新时间</th><th></th></tr></thead><tbody>" +
      posts
        .map(function (post) {
          return (
            "<tr><td>" +
            escapeHtml(post.title) +
            "<br><small>" +
            escapeHtml(post.slug) +
            "</small></td><td>" +
            escapeHtml(post.status) +
            "</td><td>" +
            (post.updated_at ? new Date(post.updated_at).toLocaleString() : "") +
            '</td><td><button class="button button-secondary" type="button" data-edit-post="' +
            escapeHtml(post.id) +
            '">编辑</button></td></tr>'
          );
        })
        .join("") +
      "</tbody>";
  }

  function renderPreview() {
    if (!markdownPreview || !postForm) {
      return;
    }
    var payload = getPostFormPayload();
    markdownPreview.innerHTML =
      "<h4>" +
      escapeHtml(payload.title || "预览") +
      "</h4><p>" +
      escapeHtml(payload.excerpt) +
      "</p>" +
      markdownToHtml(payload.content);
  }

  async function loadDashboard() {
    if (!summaryGrid || !metricsTable || !messageList) {
      return;
    }

    summaryGrid.innerHTML = '<div class="status-card"><p>正在加载后台数据...</p></div>';

    try {
      var metricsResponse = await request("/api/admin/metrics/posts");
      var messagesResponse = await request("/api/admin/messages");
      var postsResponse = await request("/api/admin/posts");
      var posts = metricsResponse.posts || [];
      var messages = messagesResponse.messages || [];
      state.messages = messages;
      state.posts = postsResponse.posts || [];
      renderSummary(posts, messages);
      renderMetrics(posts);
      renderMessages(messages);
      renderPostList(state.posts);
      if (!state.selectedPost && state.posts[0]) {
        fillPostForm(state.posts[0]);
      }
    } catch (error) {
      summaryGrid.innerHTML = '<div class="status-card status-card-error"><p>' + escapeHtml(error.message) + "</p></div>";
    }
  }

  async function loadSession() {
    try {
      var data = await request("/api/admin/session");
      if (!data.configured) {
        setStatus("后台密码尚未在 .env 中配置。");
      }
      renderAuthenticated(data.authenticated);
    } catch (error) {
      setStatus(error.message);
      renderAuthenticated(false);
    }
  }

  if (loginForm) {
    loginForm.addEventListener("submit", async function (event) {
      event.preventDefault();
      setStatus("正在验证...");
      var formData = new FormData(loginForm);

      try {
        await request("/api/admin/login", {
          method: "POST",
          body: JSON.stringify({
            password: String(formData.get("password") || "")
          })
        });
        loginForm.reset();
        setStatus("");
        window.location.replace("/admin.html");
      } catch (error) {
        setStatus(error.message);
      }
    });
  }

  if (logoutButton) {
    logoutButton.addEventListener("click", async function () {
      await request("/api/admin/logout", {
        method: "POST",
        body: JSON.stringify({})
      });
      window.location.replace("/admin-login.html");
    });
  }

  if (messageList) {
    messageList.addEventListener("click", async function (event) {
      var button = event.target.closest("[data-open-message]");
      if (!button) {
        return;
      }

      var data = await request("/api/admin/messages/" + encodeURIComponent(button.dataset.openMessage));
      renderMessageDetail(data.message);
    });
  }

  if (messageDetail) {
    messageDetail.addEventListener("click", async function (event) {
      var button = event.target.closest("[data-message-status]");
      if (!button) {
        return;
      }

      await request("/api/admin/messages/" + encodeURIComponent(button.dataset.messageId), {
        method: "PATCH",
        body: JSON.stringify({ status: button.dataset.messageStatus })
      });
      await loadDashboard();
    });

    messageDetail.addEventListener("submit", async function (event) {
      var form = event.target.closest("[data-reply-message-id]");
      if (!form) {
        return;
      }
      event.preventDefault();
      var formData = new FormData(form);

      try {
        await ensureAdminSession();
        await request("/api/admin/messages/" + encodeURIComponent(form.dataset.replyMessageId) + "/reply", {
          method: "POST",
          body: JSON.stringify({
            subject: String(formData.get("subject") || ""),
            body: String(formData.get("body") || "")
          })
        });
        var data = await request("/api/admin/messages/" + encodeURIComponent(form.dataset.replyMessageId));
        renderMessageDetail(data.message);
        await loadDashboard();
      } catch (error) {
        setStatus(error.message);
      }
    });
  }

  if (postListTable) {
    postListTable.addEventListener("click", function (event) {
      var button = event.target.closest("[data-edit-post]");
      if (!button) {
        return;
      }
      var post = state.posts.find(function (entry) {
        return entry.id === button.dataset.editPost;
      });
      fillPostForm(post);
    });
  }

  if (newPostButton) {
    newPostButton.addEventListener("click", function () {
      fillPostForm(null);
      setPostStatus("新草稿");
    });
  }

  if (postForm) {
    postForm.addEventListener("input", renderPreview);
    postForm.addEventListener("submit", async function (event) {
      event.preventDefault();
      setPostStatus("正在保存草稿...");

      try {
        await ensureAdminSession();
        var payload = getPostFormPayload("draft");
        var path = payload.id ? "/api/admin/posts/" + encodeURIComponent(payload.id) : "/api/admin/posts";
        var method = payload.id ? "PATCH" : "POST";
        var data = await request(path, {
          method: method,
          body: JSON.stringify(payload)
        });
        setPostStatus("草稿已保存到数据库。");
        state.selectedPost = data.post;
        fillPostForm(data.post);
        await loadDashboard();
      } catch (error) {
        setPostStatus("保存失败：" + error.message);
      }
    });
  }

  if (publishPostButton) {
    publishPostButton.addEventListener("click", async function () {
      setPostStatus("正在发布并验证前端可见性...");

      try {
        await ensureAdminSession();
        var payload = getPostFormPayload("published");
        if (!payload.id) {
          var created = await request("/api/admin/posts", {
            method: "POST",
            body: JSON.stringify(payload)
          });
          payload.id = created.post.id;
        } else {
          await request("/api/admin/posts/" + encodeURIComponent(payload.id), {
            method: "PATCH",
            body: JSON.stringify(payload)
          });
        }
        var published = await request("/api/admin/posts/" + encodeURIComponent(payload.id) + "/publish", {
          method: "POST",
          body: JSON.stringify({})
        });
        var verification = await verifyPublishedPost(published.post.slug);
        state.selectedPost = verification.adminPost;
        setPostStatus("发布成功：数据库已保存，前端可显示。公开地址：" + makePublicPostUrl(published.post.slug));
        await loadDashboard();
      } catch (error) {
        setPostStatus("发布失败：" + error.message);
      }
    });
  }

  if (archivePostButton) {
    archivePostButton.addEventListener("click", async function () {
      var payload = getPostFormPayload();
      if (!payload.id) {
        setPostStatus("请先选择一篇文章");
        return;
      }
      setPostStatus("正在归档...");

      try {
        await ensureAdminSession();
        await request("/api/admin/posts/" + encodeURIComponent(payload.id) + "/archive", {
          method: "POST",
          body: JSON.stringify({})
        });
        setPostStatus("已归档：前端将不再显示这篇文章。");
        await loadDashboard();
      } catch (error) {
        setPostStatus("归档失败：" + error.message);
      }
    });
  }

  if (uploadImageButton) {
    uploadImageButton.addEventListener("click", async function () {
      var fileInput = postForm.elements.image;
      var file = fileInput.files && fileInput.files[0];
      if (!file) {
        setPostStatus("请先选择一张图片");
        return;
      }

      setPostStatus("正在上传图片...");

      try {
        await ensureAdminSession();
        var dataUrl = await readFileAsDataUrl(file);
        var data = await request("/api/admin/uploads/blog-image", {
          method: "POST",
          body: JSON.stringify({
            fileName: file.name,
            mimeType: file.type,
            dataUrl: dataUrl,
            postId: postForm.elements.id.value || null,
            altText: postForm.elements.title.value || file.name
          })
        });
        postForm.elements.coverUrl.value = data.asset.public_url;
        postForm.elements.content.value += "\n\n![" + (postForm.elements.title.value || "图片") + "](" + data.asset.public_url + ")\n";
        setPostStatus("图片已上传。注意：上传图片不会发布文章，需要点击“发布”。");
        renderPreview();
      } catch (error) {
        setPostStatus("图片上传失败：" + error.message);
      }
    });
  }

  loadSession();
})();