const menuToggle = document.querySelector(".menu-toggle");
const mainNav = document.getElementById("main-nav");
const yearTarget = document.getElementById("year");
const form = document.getElementById("booking-form");
const websiteType = document.getElementById("websiteType");
const statusText = document.getElementById("form-status");
const planButtons = document.querySelectorAll(".plan-select");
const bookingSection = document.getElementById("book");
const pageLoader = document.getElementById("page-loader");
const submitButton = form ? form.querySelector("button[type='submit']") : null;
const commentForm = document.getElementById("comment-form");
const commentList = document.getElementById("comment-list");
const commentStatus = document.getElementById("comment-status");

const contactEmail = "snipease@gmail.com";
const submitEndpoint = `https://formsubmit.co/ajax/${contactEmail}`;
const commentsStorageKey = "snipease_comments_v1";
const makeCommentId = () => `c_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

if (yearTarget) {
  yearTarget.textContent = String(new Date().getFullYear());
}

if (menuToggle && mainNav) {
  menuToggle.addEventListener("click", () => {
    const isOpen = mainNav.classList.toggle("open");
    menuToggle.setAttribute("aria-expanded", String(isOpen));
  });

  mainNav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      mainNav.classList.remove("open");
      menuToggle.setAttribute("aria-expanded", "false");
    });
  });
}

if (pageLoader) {
  const hideLoader = () => {
    pageLoader.classList.add("hidden");
  };

  window.addEventListener("load", hideLoader, { once: true });
  window.setTimeout(hideLoader, 1600);
}

document.querySelectorAll(".stagger-group").forEach((group) => {
  [...group.children].forEach((item, index) => {
    item.style.setProperty("--stagger-index", String(index));
  });
});

if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.14 }
  );

  document.querySelectorAll(".reveal").forEach((element) => observer.observe(element));
} else {
  document.querySelectorAll(".reveal").forEach((element) => element.classList.add("visible"));
}

planButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const planName = button.dataset.plan;
    if (websiteType && planName) {
      websiteType.value = planName;
    }
    if (bookingSection) {
      bookingSection.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  });
});

const escapeHtml = (value) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

if (form) {
  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const data = Object.fromEntries(new FormData(form).entries());
    const subject = `New Website Booking - ${data.websiteType}`;

    const lines = [
      "Hi Snipease team,",
      "",
      "I want to book a website project.",
      "",
      `Name: ${data.name}`,
      `Business: ${data.business}`,
      `Email: ${data.email}`,
      `Phone: ${data.phone}`,
      `Website Type: ${data.websiteType}`,
      `Timeline: ${data.timeline}`,
      `Preferred Contact: ${data.contactMethod}`,
      "",
      "Project Notes:",
      data.message
    ];
    const body = lines.join("\r\n");
    const payload = {
      name: data.name,
      business: data.business,
      email: data.email,
      phone: data.phone,
      websiteType: data.websiteType,
      timeline: data.timeline,
      preferredContact: data.contactMethod,
      message: data.message,
      _subject: subject,
      _template: "table"
    };

    const safeName = escapeHtml(data.name.trim());
    const manualMailto = `mailto:${contactEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    try {
      if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = "Sending...";
      }

      if (statusText) {
        statusText.textContent = "Sending your request...";
      }

      const response = await fetch(submitEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json"
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json().catch(() => ({}));
      if (!response.ok || result.success === false) {
        throw new Error(result.message || "Submission failed");
      }

      if (statusText) {
        statusText.innerHTML = `Thanks ${safeName}. Your request has been sent to <a href="mailto:${contactEmail}">${contactEmail}</a>.`;
      }
      form.reset();
    } catch {
      if (statusText) {
        statusText.innerHTML = `Auto-send failed on this browser. Please use <a href="${manualMailto}">this quick backup email link</a>.`;
      }
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = "Send Booking Request";
      }
    }

    // Keeps old behavior available as fallback for users if AJAX fails.
  });
}

const normalizeComments = (comments) => {
  let changed = false;
  const normalized = [];

  comments.forEach((item, index) => {
    if (!item || typeof item !== "object") {
      changed = true;
      return;
    }

    const id =
      typeof item.id === "string" && item.id.trim()
        ? item.id.trim()
        : `legacy_${index}_${makeCommentId()}`;
    const name = String(item.name || "").trim() || "Anonymous";
    const role = String(item.role || "").trim() || "Client";
    const text = String(item.text || "").trim();
    const likes = Number.isFinite(Number(item.likes)) ? Math.max(0, Number(item.likes)) : 0;
    const dislikes = Number.isFinite(Number(item.dislikes)) ? Math.max(0, Number(item.dislikes)) : 0;

    if (!item.id || item.name !== name || item.role !== role || item.likes !== likes || item.dislikes !== dislikes) {
      changed = true;
    }

    if (text) {
      normalized.push({ id, name, role, text, likes, dislikes });
    } else {
      changed = true;
    }
  });

  return { normalized, changed };
};

const renderComments = (comments) => {
  if (!commentList) {
    return;
  }

  commentList.innerHTML = "";

  if (!comments.length) {
    const empty = document.createElement("li");
    empty.className = "comment-empty";
    empty.textContent = "No comments yet. Be the first one to share feedback.";
    commentList.appendChild(empty);
    return;
  }

  comments.forEach((item) => {
    const li = document.createElement("li");
    const safeName = escapeHtml(item.name);
    const safeRole = escapeHtml(item.role || "Client");
    const safeText = escapeHtml(item.text);
    const safeId = escapeHtml(item.id);

    li.innerHTML = `
      <strong>${safeName}</strong>
      <div class="meta">${safeRole}</div>
      <p>${safeText}</p>
      <div class="comment-actions">
        <button type="button" class="comment-action" data-action="like" data-id="${safeId}" aria-label="Like this comment">👍 <span>${item.likes}</span></button>
        <button type="button" class="comment-action" data-action="dislike" data-id="${safeId}" aria-label="Dislike this comment">👎 <span>${item.dislikes}</span></button>
        <button type="button" class="comment-action comment-delete" data-action="delete" data-id="${safeId}" aria-label="Delete this comment">Delete</button>
      </div>
    `;
    commentList.appendChild(li);
  });
};

const loadComments = () => {
  try {
    const raw = localStorage.getItem(commentsStorageKey);
    const comments = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(comments)) {
      return [];
    }

    const { normalized, changed } = normalizeComments(comments);
    if (changed) {
      saveComments(normalized);
    }
    return normalized;
  } catch {
    return [];
  }
};

const saveComments = (comments) => {
  try {
    localStorage.setItem(commentsStorageKey, JSON.stringify(comments));
  } catch {
    // Ignore storage failures quietly.
  }
};

if (commentList) {
  const initialComments = loadComments();
  renderComments(initialComments);

  commentList.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof Element)) {
      return;
    }

    const actionButton = target.closest("button[data-action]");
    if (!actionButton) {
      return;
    }

    const action = actionButton.getAttribute("data-action");
    const id = actionButton.getAttribute("data-id");
    if (!action || !id) {
      return;
    }

    const comments = loadComments();
    const index = comments.findIndex((comment) => comment.id === id);
    if (index < 0) {
      return;
    }

    if (action === "like") {
      comments[index].likes += 1;
      if (commentStatus) {
        commentStatus.textContent = "You liked this comment.";
      }
    } else if (action === "dislike") {
      comments[index].dislikes += 1;
      if (commentStatus) {
        commentStatus.textContent = "You disliked this comment.";
      }
    } else if (action === "delete") {
      const approved = window.confirm("Delete this comment?");
      if (!approved) {
        return;
      }
      comments.splice(index, 1);
      if (commentStatus) {
        commentStatus.textContent = "Comment deleted.";
      }
    } else {
      return;
    }

    const recent = comments.slice(0, 12);
    saveComments(recent);
    renderComments(recent);
  });
}

if (commentForm) {
  commentForm.addEventListener("submit", (event) => {
    event.preventDefault();

    if (!commentForm.checkValidity()) {
      commentForm.reportValidity();
      return;
    }

    const data = Object.fromEntries(new FormData(commentForm).entries());
    const comments = loadComments();
    comments.unshift({
      id: makeCommentId(),
      name: String(data.commentName || "").trim(),
      role: String(data.commentRole || "").trim(),
      text: String(data.commentText || "").trim(),
      likes: 0,
      dislikes: 0
    });

    const recent = comments.slice(0, 12);
    saveComments(recent);
    renderComments(recent);
    commentForm.reset();

    if (commentStatus) {
      commentStatus.textContent = "Thanks! Your comment has been posted.";
    }
  });
}
