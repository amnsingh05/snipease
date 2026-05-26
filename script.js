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

const renderComments = (comments) => {
  if (!commentList) {
    return;
  }

  commentList.innerHTML = "";
  comments.forEach((item) => {
    const li = document.createElement("li");
    const safeName = escapeHtml(item.name);
    const safeRole = escapeHtml(item.role || "Client");
    const safeText = escapeHtml(item.text);
    li.innerHTML = `<strong>${safeName}</strong><div class="meta">${safeRole}</div><p>${safeText}</p>`;
    commentList.appendChild(li);
  });
};

const loadComments = () => {
  try {
    const raw = localStorage.getItem(commentsStorageKey);
    const comments = raw ? JSON.parse(raw) : [];
    return Array.isArray(comments) ? comments : [];
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
      name: String(data.commentName || "").trim(),
      role: String(data.commentRole || "").trim(),
      text: String(data.commentText || "").trim()
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
