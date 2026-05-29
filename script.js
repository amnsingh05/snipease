import {
  db,
  collection,
  addDoc,
  getDocs
} from "./firebase.js";

/* ==========================================
   ELEMENTS
========================================== */

const menuToggle = document.querySelector(".menu-toggle");
const mainNav = document.getElementById("main-nav");

const yearTarget = document.getElementById("year");

const form = document.getElementById("booking-form");
const websiteType = document.getElementById("websiteType");
const statusText = document.getElementById("form-status");

const planButtons =
  document.querySelectorAll(".plan-select");

const bookingSection =
  document.getElementById("book");

const pageLoader =
  document.getElementById("page-loader");

const submitButton =
  form
    ? form.querySelector(
        "button[type='submit']"
      )
    : null;

const commentForm =
  document.getElementById(
    "comment-form"
  );

const commentList =
  document.getElementById(
    "comment-list"
  );

const commentStatus =
  document.getElementById(
    "comment-status"
  );

/* ==========================================
   CONFIG
========================================== */

const contactEmail =
  "snipease@gmail.com";

const submitEndpoint =
  `https://formsubmit.co/ajax/${contactEmail}`;

/* ==========================================
   YEAR
========================================== */

if (yearTarget) {

  yearTarget.textContent =
    String(
      new Date().getFullYear()
    );

}

/* ==========================================
   MOBILE MENU
========================================== */

if (menuToggle && mainNav) {

  menuToggle.addEventListener(
    "click",
    () => {

      const isOpen =
        mainNav.classList.toggle(
          "open"
        );

      menuToggle.setAttribute(
        "aria-expanded",
        String(isOpen)
      );

    }
  );

  mainNav
    .querySelectorAll("a")
    .forEach((link) => {

      link.addEventListener(
        "click",
        () => {

          mainNav.classList.remove(
            "open"
          );

          menuToggle.setAttribute(
            "aria-expanded",
            "false"
          );

        }
      );

    });

}

/* ==========================================
   PAGE LOADER
========================================== */

if (pageLoader) {

  const hideLoader = () => {

    pageLoader.classList.add(
      "hidden"
    );

  };

  window.addEventListener(
    "load",
    hideLoader,
    { once: true }
  );

  setTimeout(
    hideLoader,
    1600
  );

}

/* ==========================================
   STAGGER EFFECT
========================================== */

document
  .querySelectorAll(".stagger-group")
  .forEach((group) => {

    [...group.children].forEach(
      (item, index) => {

        item.style.setProperty(
          "--stagger-index",
          String(index)
        );

      }
    );

  });

/* ==========================================
   REVEAL ANIMATION
========================================== */

if (
  "IntersectionObserver"
  in window
) {

  const observer =
    new IntersectionObserver(
      (entries) => {

        entries.forEach(
          (entry) => {

            if (
              entry.isIntersecting
            ) {

              entry.target.classList.add(
                "visible"
              );

              observer.unobserve(
                entry.target
              );

            }

          }
        );

      },
      {
        threshold: 0.14
      }
    );

  document
    .querySelectorAll(".reveal")
    .forEach((element) =>
      observer.observe(element)
    );

} else {

  document
    .querySelectorAll(".reveal")
    .forEach((element) =>
      element.classList.add(
        "visible"
      )
    );

}

/* ==========================================
   PLAN BUTTONS
========================================== */

planButtons.forEach(
  (button) => {

    button.addEventListener(
      "click",
      () => {

        const planName =
          button.dataset.plan;

        if (
          websiteType &&
          planName
        ) {

          websiteType.value =
            planName;

        }

        if (
          bookingSection
        ) {

          bookingSection.scrollIntoView(
            {
              behavior:
                "smooth",
              block:
                "start"
            }
          );

        }

      }
    );

  }
);

/* ==========================================
   ESCAPE HTML
========================================== */

const escapeHtml = (
  value
) =>
  String(value)
    .replaceAll(
      "&",
      "&amp;"
    )
    .replaceAll(
      "<",
      "&lt;"
    )
    .replaceAll(
      ">",
      "&gt;"
    )
    .replaceAll(
      '"',
      "&quot;"
    )
    .replaceAll(
      "'",
      "&#39;"
    );

/* ==========================================
   BOOKING FORM
========================================== */

if (form) {

  form.addEventListener(
    "submit",
    async (event) => {

      event.preventDefault();

      if (
        !form.checkValidity()
      ) {

        form.reportValidity();

        return;

      }

      const data =
        Object.fromEntries(
          new FormData(
            form
          ).entries()
        );

      /* FIREBASE */

      try {

        await addDoc(
          collection(
            db,
            "bookings"
          ),
          {
            ...data,
            createdAt:
              Date.now()
          }
        );

      } catch (error) {

        console.error(
          "Firestore booking error:",
          error
        );

      }

      /* EMAIL */

      const subject =
        `New Website Booking - ${data.websiteType}`;

      const payload = {

        name:
          data.name,

        business:
          data.business,

        email:
          data.email,

        phone:
          data.phone,

        websiteType:
          data.websiteType,

        timeline:
          data.timeline,

        preferredContact:
          data.contactMethod,

        message:
          data.message,

        _subject:
          subject,

        _template:
          "table"

      };

      const safeName =
        escapeHtml(
          data.name.trim()
        );

      try {

        if (
          submitButton
        ) {

          submitButton.disabled =
            true;

          submitButton.textContent =
            "Sending...";

        }

        if (
          statusText
        ) {

          statusText.textContent =
            "Sending your request...";

        }

        const response =
          await fetch(
            submitEndpoint,
            {
              method:
                "POST",

              headers: {
                "Content-Type":
                  "application/json",

                Accept:
                  "application/json"
              },

              body:
                JSON.stringify(
                  payload
                )
            }
          );

        const result =
          await response
            .json()
            .catch(
              () => ({})
            );

        if (
          !response.ok ||
          result.success ===
            false
        ) {

          throw new Error(
            result.message ||
              "Submission failed"
          );

        }

        if (
          statusText
        ) {

          statusText.innerHTML =
            `Thanks ${safeName}. Your request has been sent successfully.`;

        }

        form.reset();

      } catch (error) {

        console.error(
          error
        );

        if (
          statusText
        ) {

          statusText.textContent =
            "Failed to send request.";

        }

      } finally {

        if (
          submitButton
        ) {

          submitButton.disabled =
            false;

          submitButton.textContent =
            "Send Booking Request";

        }

      }

    }
  );

}

/* ==========================================
   COMMENTS
========================================== */

const renderComments = (
  comments
) => {

  if (
    !commentList
  ) return;

  commentList.innerHTML =
    "";

  if (
    !comments.length
  ) {

    const empty =
      document.createElement(
        "li"
      );

    empty.className =
      "comment-empty";

    empty.textContent =
      "No comments yet. Be the first one to share feedback.";

    commentList.appendChild(
      empty
    );

    return;

  }

  comments.forEach(
    (item) => {

      const li =
        document.createElement(
          "li"
        );

      li.innerHTML = `
        <strong>${escapeHtml(item.name)}</strong>
        <div class="meta">
          ${escapeHtml(item.role || "Client")}
        </div>
        <p>
          ${escapeHtml(item.text)}
        </p>
      `;

      commentList.appendChild(
        li
      );

    }
  );

};

const loadCommentsFromFirebase =
  async () => {

    if (
      !commentList
    ) return;

    try {

      const snapshot =
        await getDocs(
          collection(
            db,
            "comments"
          )
        );

      const comments =
        [];

      snapshot.forEach(
        (doc) => {

          comments.push({
            id:
              doc.id,

            ...doc.data()
          });

        }
      );

      comments.sort(
        (a, b) =>
          (b.createdAt ||
            0) -
          (a.createdAt ||
            0)
      );

      renderComments(
        comments
      );

    } catch (
      error
    ) {

      console.error(
        error
      );

    }

  };

const saveCommentToFirebase =
  async (data) => {

    await addDoc(
      collection(
        db,
        "comments"
      ),
      {
        name:
          data.name,

        role:
          data.role,

        text:
          data.text,

        createdAt:
          Date.now()
      }
    );

  };

if (commentForm) {

  commentForm.addEventListener(
    "submit",
    async (event) => {

      event.preventDefault();

      if (
        !commentForm.checkValidity()
      ) {

        commentForm.reportValidity();

        return;

      }

      const data =
        Object.fromEntries(
          new FormData(
            commentForm
          ).entries()
        );

      try {

        await saveCommentToFirebase(
          {
            name:
              data.commentName,

            role:
              data.commentRole,

            text:
              data.commentText
          }
        );

        commentForm.reset();

        if (
          commentStatus
        ) {

          commentStatus.textContent =
            "Comment posted successfully.";

        }

        await loadCommentsFromFirebase();

      } catch (error) {

        console.error(
          error
        );

      }

    }
  );

}

if (commentList) {

  loadCommentsFromFirebase();

}
