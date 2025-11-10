/* Chat widget behaviour */
(function () {
  const API_BASE = "http://localhost:4000";
  const TEMPLATE_PATH = "partials/chat-widget.html";
  const BOT_AVATAR = '<span class="mil-chat-avatar-pill">AI</span>';
  const USER_AVATAR = '<span class="mil-chat-avatar-pill">YOU</span>';

  const ensureMarkup = async () => {
    if (document.getElementById("chatWidget")) {
      return;
    }

    const response = await fetch(TEMPLATE_PATH, { cache: "no-cache" });
    if (!response.ok) {
      throw new Error("Unable to load chat widget template");
    }
    const markup = await response.text();
    document.body.insertAdjacentHTML("beforeend", markup);
  };

  const initChatWidget = () => {
    const widget = document.getElementById("chatWidget");
    const closeBtn = document.getElementById("chatCloseButton");
    const form = document.getElementById("chatForm");
    const input = document.getElementById("chatInput");
    const messages = document.getElementById("chatMessages");
    const triggers = document.querySelectorAll("[data-chat-trigger]");

    if (!widget || !closeBtn || !form || !input || !messages) {
      return;
    }

    const setVisibility = (isVisible) => {
      widget.classList.toggle("is-visible", isVisible);
      widget.setAttribute("aria-hidden", String(!isVisible));
      triggers.forEach((trigger) => {
        if (trigger.hasAttribute("aria-expanded")) {
          trigger.setAttribute("aria-expanded", String(isVisible));
        }
      });
      if (isVisible) {
        input.focus();
      }
    };

    const buildMessageRow = (text, isBot) => {
      const row = document.createElement("div");
      row.className = `mil-chat-row ${
        isBot ? "mil-chat-row--bot" : "mil-chat-row--user"
      }`;

      const avatar = document.createElement("div");
      avatar.className = "mil-chat-avatar";
      avatar.innerHTML = isBot ? BOT_AVATAR : USER_AVATAR;

      const bubble = document.createElement("div");
      bubble.className = `mil-chat-bubble ${
        isBot ? "mil-chat-bubble--bot" : "mil-chat-bubble--user"
      }`;

      const author = document.createElement("span");
      author.className = "mil-chat-author";
      author.textContent = isBot ? "AI" : "You";

      const textElement = document.createElement("p");
      textElement.textContent = text;

      bubble.appendChild(author);
      bubble.appendChild(textElement);
      row.appendChild(avatar);
      row.appendChild(bubble);

      return { row, textElement };
    };

    const appendMessage = (text, isBot = false) => {
      const { row } = buildMessageRow(text, isBot);
      messages.appendChild(row);
      messages.scrollTop = messages.scrollHeight;
    };

    triggers.forEach((trigger) => {
      trigger.addEventListener("click", (event) => {
        event.preventDefault();
        setVisibility(true);
      });
    });

    closeBtn.addEventListener("click", () => setVisibility(false));

    const showBotPlaceholder = (text = "...") => {
      const { row, textElement } = buildMessageRow(text, true);
      row.dataset.status = "pending";
      messages.appendChild(row);
      messages.scrollTop = messages.scrollHeight;
      return { row, textElement };
    };

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const value = input.value.trim();
      if (!value) {
        return;
      }
      appendMessage(value, false);
      input.value = "";
      const pendingBubble = showBotPlaceholder("Typing…");
      try {
        const response = await fetch(`${API_BASE}/api/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: value }),
        });
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        const data = await response.json();
        pendingBubble.textElement.textContent =
          data?.reply?.trim() ||
          "Thanks for reaching out! I'll review your message and respond shortly.";
      } catch (error) {
        console.error(error);
        pendingBubble.textElement.textContent =
          "Sorry, I could not reach the assistant. Please try again.";
      } finally {
        delete pendingBubble.row.dataset.status;
      }
    });
  };

  const boot = async () => {
    try {
      await ensureMarkup();
      initChatWidget();
    } catch (error) {
      console.error("Chat widget failed to initialise:", error);
    }
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
