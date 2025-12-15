(function () {
  const ENDPOINT = "https://khaledux-ai.khaled-moheby.workers.dev";
  const TIMEOUT_MS = 10000;
  const SYSTEM_PROMPT =
    "You are Khaled's AI assistant for khaledux.de. Be concise and helpful.";
  const INITIAL_ASSISTANT_MESSAGE =
    "Hi! I'm Khaled's assistant. How can I help with your project today?";
  const ERROR_MESSAGE =
    "Sorry, I could not reach the assistant. Please try again.";
  const FALLBACK_REPLY =
    "Thanks for reaching out! I'll review your message and respond shortly.";

  const BUTTON_ID = "chatBtn";
  const WIDGET_ID = "chatWidget";
  const CLOSE_ID = "chatCloseButton";
  const FORM_ID = "chatForm";
  const INPUT_ID = "chatInput";
  const MESSAGES_ID = "chatMessages";
  const SEND_ID = "chatSendButton";

  const BOT_AVATAR = '<span class="mil-chat-avatar-pill">AI</span>';
  const USER_AVATAR = '<span class="mil-chat-avatar-pill">YOU</span>';

  let isOpen = false;
  let isSending = false;
  let hasRenderedGreeting = false;
  let elements = {};
  const messages = [{ role: "system", content: SYSTEM_PROMPT }];

  const chatTemplate = `
    <button
      id="${BUTTON_ID}"
      class="mil-chat-launch"
      type="button"
      aria-haspopup="dialog"
      aria-expanded="false"
      data-chat-button="true"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <path d="m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z" />
      </svg>
    </button>

    <div
      class="mil-chat-widget"
      id="${WIDGET_ID}"
      role="dialog"
      aria-live="polite"
      aria-hidden="true"
    >
      <div class="mil-chat-header">
        <div>
          <p class="mil-chat-title">Chatbot</p>
          <p class="mil-chat-subtitle">Powered by Khaled AI</p>
        </div>
        <button
          type="button"
          class="mil-chat-close"
          id="${CLOSE_ID}"
          aria-label="Close chat"
        >
          ×
        </button>
      </div>

      <div class="mil-chat-body">
        <div class="mil-chat-messages" id="${MESSAGES_ID}" aria-live="polite"></div>
      </div>

      <p class="mil-chat-disclaimer">Do not share sensitive information.</p>

      <form class="mil-chat-input" id="${FORM_ID}" novalidate>
        <label class="mil-chat-sr-only" for="${INPUT_ID}">Your message</label>
        <input
          type="text"
          id="${INPUT_ID}"
          name="message"
          placeholder="Type your message"
          autocomplete="off"
          required
        />
        <button type="submit" class="mil-chat-send" id="${SEND_ID}">
          <span>Send</span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              d="M22 2L11 13"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
            <polygon
              points="22 2 15 22 11 13 2 9 22 2"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </button>
      </form>
    </div>
  `;

  const ensureMarkup = () => {
    if (!document.getElementById(WIDGET_ID)) {
      document.body.insertAdjacentHTML("beforeend", chatTemplate);
    }
    elements = {
      chatButton: document.getElementById(BUTTON_ID),
      widget: document.getElementById(WIDGET_ID),
      closeButton: document.getElementById(CLOSE_ID),
      form: document.getElementById(FORM_ID),
      input: document.getElementById(INPUT_ID),
      messages: document.getElementById(MESSAGES_ID),
      sendButton: document.getElementById(SEND_ID),
    };
  };

  const setVisibility = (visible) => {
    if (!elements.widget || !elements.chatButton) {
      return;
    }
    isOpen = visible;
    elements.widget.classList.toggle("is-visible", visible);
    elements.widget.setAttribute("aria-hidden", String(!visible));
    elements.chatButton.setAttribute("aria-expanded", String(visible));
    if (visible && elements.input) {
      elements.input.focus();
    }
  };

  const buildMessageRow = (text, role) => {
    const isAssistant = role === "assistant";
    const row = document.createElement("div");
    row.className = `mil-chat-row ${
      isAssistant ? "mil-chat-row--bot" : "mil-chat-row--user"
    }`;

    const avatar = document.createElement("div");
    avatar.className = "mil-chat-avatar";
    avatar.innerHTML = isAssistant ? BOT_AVATAR : USER_AVATAR;

    const bubble = document.createElement("div");
    bubble.className = `mil-chat-bubble ${
      isAssistant ? "mil-chat-bubble--bot" : "mil-chat-bubble--user"
    }`;

    const author = document.createElement("span");
    author.className = "mil-chat-author";
    author.textContent = isAssistant ? "AI" : "You";

    const textElement = document.createElement("p");
    textElement.textContent = text;

    bubble.appendChild(author);
    bubble.appendChild(textElement);
    row.appendChild(avatar);
    row.appendChild(bubble);

    return { row, textElement };
  };

  const appendMessage = (text, role) => {
    if (!elements.messages) {
      return { row: null, textElement: null };
    }
    const messageRow = buildMessageRow(text, role);
    elements.messages.appendChild(messageRow.row);
    elements.messages.scrollTop = elements.messages.scrollHeight;
    return messageRow;
  };

  const renderGreeting = () => {
    if (hasRenderedGreeting) return;
    const greeting = INITIAL_ASSISTANT_MESSAGE;
    appendMessage(greeting, "assistant");
    messages.push({ role: "assistant", content: greeting });
    hasRenderedGreeting = true;
  };

  const handleOutsideClick = (event) => {
    if (!isOpen || !elements.widget) return;
    const target = event.target;
    if (
      elements.widget.contains(target) ||
      (elements.chatButton && elements.chatButton.contains(target))
    ) {
      return;
    }
    setVisibility(false);
  };

  const handleKeydown = (event) => {
    if (event.key === "Escape" && isOpen) {
      setVisibility(false);
    }
  };

  const setSendingState = (sending) => {
    isSending = sending;
    if (elements.sendButton) {
      elements.sendButton.disabled = sending;
    }
  };

  const requestReply = async () => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      const response = await fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages }),
        signal: controller.signal,
      });
      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }
      const data = await response.json();
      return data?.reply?.trim() || "";
    } finally {
      clearTimeout(timeout);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!elements.input || isSending) {
      return;
    }

    const userText = elements.input.value.trim();
    if (!userText) {
      return;
    }

    appendMessage(userText, "user");
    messages.push({ role: "user", content: userText });
    elements.input.value = "";

    const pending = appendMessage("Typing…", "assistant");
    setSendingState(true);

    try {
      const reply = await requestReply();
      const safeReply = reply || FALLBACK_REPLY;
      if (pending.textElement) {
        pending.textElement.textContent = safeReply;
      } else {
        appendMessage(safeReply, "assistant");
      }
      messages.push({ role: "assistant", content: safeReply });
    } catch (error) {
      console.error("Chat request failed:", error);
      const message = ERROR_MESSAGE;
      if (pending.textElement) {
        pending.textElement.textContent = message;
      } else {
        appendMessage(message, "assistant");
      }
      messages.push({ role: "assistant", content: message });
    } finally {
      setSendingState(false);
      if (elements.input) {
        elements.input.focus();
      }
    }
  };

  const bindEvents = () => {
    if (elements.chatButton && !elements.chatButton.dataset.boundChat) {
      elements.chatButton.addEventListener("click", () => setVisibility(true));
      elements.chatButton.dataset.boundChat = "true";
    }
    if (elements.closeButton && !elements.closeButton.dataset.boundChat) {
      elements.closeButton.addEventListener("click", () =>
        setVisibility(false)
      );
      elements.closeButton.dataset.boundChat = "true";
    }
    if (elements.form && !elements.form.dataset.boundChat) {
      elements.form.addEventListener("submit", handleSubmit);
      elements.form.dataset.boundChat = "true";
    }
    document.addEventListener("click", handleOutsideClick);
    document.addEventListener("keydown", handleKeydown);
  };

  const init = () => {
    ensureMarkup();
    if (!elements.widget || !elements.chatButton) {
      return;
    }
    renderGreeting();
    bindEvents();
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
