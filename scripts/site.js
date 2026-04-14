(function () {
  function escapeHtml(value) {
    return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
  }

  function renderMarkdown(markdown) {
    const lines = markdown.trim().split("\n");
    let html = "";
    let inList = false;
    let inCode = false;
    let codeBuffer = [];

    function flushList() {
      if (inList) {
        html += "</ul>";
        inList = false;
      }
    }

    function flushCode() {
      if (inCode) {
        html += `<pre><code>${escapeHtml(codeBuffer.join("\n"))}</code></pre>`;
        inCode = false;
        codeBuffer = [];
      }
    }

    for (const rawLine of lines) {
      const line = rawLine.trimEnd();

      if (line.startsWith("```")) {
        flushList();
        if (inCode) {
          flushCode();
        } else {
          inCode = true;
        }
        continue;
      }

      if (inCode) {
        codeBuffer.push(rawLine);
        continue;
      }

      if (!line.trim()) {
        flushList();
        continue;
      }

      if (line.startsWith("## ")) {
        flushList();
        html += `<h3>${escapeHtml(line.slice(3))}</h3>`;
        continue;
      }

      if (/^\d+\.\s+/.test(line)) {
        flushList();
        html += `<p>${escapeHtml(line)}</p>`;
        continue;
      }

      if (line.startsWith("- ")) {
        if (!inList) {
          html += "<ul>";
          inList = true;
        }
        html += `<li>${escapeHtml(line.slice(2))}</li>`;
        continue;
      }

      flushList();
      html += `<p>${escapeHtml(line)}</p>`;
    }

    flushList();
    flushCode();
    return html;
  }

  function initBlog() {
    const app = document.getElementById("blog-app");
    if (!app || !Array.isArray(window.BLOG_POSTS)) {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const slug = params.get("slug");
    const posts = window.BLOG_POSTS;
    const featured = document.getElementById("featured-posts");
    const content = document.getElementById("blog-content");
    const title = document.getElementById("blog-view-title");

    function getPostCover(post) {
      return post.cover || "./image/about/banner.jpg";
    }

    featured.innerHTML = posts
      .filter((post) => post.featured)
      .slice(0, 5)
      .map((post) => `<li><a href="./blog.html?slug=${post.slug}">${post.title}</a></li>`)
      .join("");

    if (!slug) {
      title.textContent = "Blogs";
      content.innerHTML = `
        <div class="post-list">
          ${posts
            .map(
              (post) => `
                <article class="post-card">
                  <a class="post-cover" href="./blog.html?slug=${post.slug}" aria-label="${post.title}">
                    <img src="${getPostCover(post)}" alt="${post.title}" />
                  </a>
                  <div class="post-card-body">
                    <h3>${post.title}</h3>
                    <div class="post-meta">
                      <span>${post.date}</span>
                      <span>${post.category}</span>
                      <span>${post.views} views</span>
                      <span>${post.likes} likes</span>
                    </div>
                    <p>${post.excerpt}</p>
                    <div class="hero-actions">
                      <a class="button button-primary" href="./blog.html?slug=${post.slug}">阅读全文</a>
                    </div>
                  </div>
                </article>
              `
            )
            .join("")}
        </div>
      `;
      return;
    }

    const post = posts.find((entry) => entry.slug === slug);
    if (!post) {
      title.textContent = "Post Not Found";
      content.innerHTML = '<div class="status-card"><p>没有找到对应文章，请返回列表重新选择。</p></div>';
      return;
    }

    title.textContent = post.title;
    content.innerHTML = `
      <article class="blog-article">
        <h2>${post.title}</h2>
        <div class="blog-meta">
          <span>${post.date}</span>
          <span>${post.category}</span>
          <span>${post.views} views</span>
          <span>${post.likes} likes</span>
        </div>
        <p>${post.excerpt}</p>
        <div class="markdown-body">${renderMarkdown(post.content)}</div>
      </article>
    `;
  }

  function initMailForm() {
    const form = document.getElementById("mail-form");
    const log = document.getElementById("submission-log");
    if (!form || !log) {
      return;
    }

    const storageKey = "edison-mail-submissions";

    function renderLatest() {
      const submissions = JSON.parse(localStorage.getItem(storageKey) || "[]");
      if (!submissions.length) {
        log.innerHTML = "<p>还没有本地提交记录。</p>";
        return;
      }

      const latest = submissions[0];
      log.innerHTML = `
        <div class="status-card">
          <p><strong>最近一次提交</strong></p>
          <p>主题：${latest.topic}</p>
          <p>称呼：${latest.nickname || "匿名"}</p>
          <p>时间：${latest.createdAt}</p>
          <p>内容预览：${latest.message.slice(0, 80)}</p>
        </div>
      `;
    }

    renderLatest();

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      const formData = new FormData(form);
      const payload = {
        topic: String(formData.get("topic") || "").trim(),
        nickname: String(formData.get("nickname") || "").trim(),
        message: String(formData.get("message") || "").trim(),
        createdAt: new Date().toLocaleString("zh-CN"),
      };

      if (!payload.topic || payload.message.length < 12) {
        log.innerHTML = "<p>请先填写完整主题和至少 12 个字符的留言。</p>";
        return;
      }

      const submissions = JSON.parse(localStorage.getItem(storageKey) || "[]");
      submissions.unshift(payload);
      localStorage.setItem(storageKey, JSON.stringify(submissions.slice(0, 10)));
      form.reset();
      renderLatest();
    });
  }

  function initContactActions() {
    const copyButton = document.getElementById("copy-email-button");
    const copyStatus = document.getElementById("copy-email-status");
    const shareButton = document.getElementById("share-contact-button");

    if (copyButton && copyStatus) {
      copyButton.addEventListener("click", async function () {
        const email = copyButton.dataset.email || "";

        try {
          await navigator.clipboard.writeText(email);
          copyStatus.textContent = "邮箱已复制";
        } catch (error) {
          copyStatus.textContent = "复制失败，请手动复制邮箱";
        }
      });
    }

    if (shareButton) {
      shareButton.addEventListener("click", async function () {
        const sharePayload = {
          title: document.title,
          text: "Edison Contact",
          url: window.location.href,
        };

        try {
          if (navigator.share) {
            await navigator.share(sharePayload);
            shareButton.textContent = "已分享成功";
            return;
          }

          await navigator.clipboard.writeText(window.location.href);
          shareButton.textContent = "链接已复制";
        } catch (error) {
          shareButton.textContent = "暂时无法分享";
        }
      });
    }
  }

  initBlog();
  initMailForm();
  initContactActions();
})();
