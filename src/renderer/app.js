const setupView = document.querySelector("#setupView");
const chatView = document.querySelector("#chatView");
const setupForm = document.querySelector("#setupForm");
const apiUrlInput = document.querySelector("#apiUrlInput");
const apiKeyInput = document.querySelector("#apiKeyInput");
const modelInput = document.querySelector("#modelInput");
const modelName = document.querySelector("#modelName");
const conversationTitle = document.querySelector("#conversationTitle");
const messageList = document.querySelector("#messageList");
const chatForm = document.querySelector("#chatForm");
const messageInput = document.querySelector("#messageInput");
const statusText = document.querySelector("#statusText");
const settingsButton = document.querySelector("#settingsButton");
const newChatButton = document.querySelector("#newChatButton");
const settingsModal = document.querySelector("#settingsModal");
const settingsForm = document.querySelector("#settingsForm");
const closeSettingsButton = document.querySelector("#closeSettingsButton");
const settingsApiUrl = document.querySelector("#settingsApiUrl");
const settingsApiKey = document.querySelector("#settingsApiKey");
const settingsModel = document.querySelector("#settingsModel");
const modeButtons = Array.from(document.querySelectorAll(".mode-button"));
const chatList = document.querySelector("#chatList");
const webSearchToggle = document.querySelector("#webSearchToggle");
const imageButton = document.querySelector("#imageButton");
const imageInput = document.querySelector("#imageInput");
const attachmentTray = document.querySelector("#attachmentTray");
const renameModal = document.querySelector("#renameModal");
const renameForm = document.querySelector("#renameForm");
const renameInput = document.querySelector("#renameInput");
const closeRenameButton = document.querySelector("#closeRenameButton");
const cancelRenameButton = document.querySelector("#cancelRenameButton");
const languageSelect = document.querySelector("#languageSelect");
const themeSelect = document.querySelector("#themeSelect");
const imagePreviewModal = document.querySelector("#imagePreviewModal");
const imagePreviewImage = document.querySelector("#imagePreviewImage");
const imagePreviewTitle = document.querySelector("#imagePreviewTitle");
const closeImagePreviewButton = document.querySelector("#closeImagePreviewButton");

const chatContextMenu = document.createElement("div");
chatContextMenu.className = "chat-context-menu";
chatContextMenu.hidden = true;
document.body.append(chatContextMenu);

let state = {
  config: { apiUrl: "", apiKey: "", model: "" },
  chats: { activeConversationId: "", conversations: [] },
  preferences: { language: "zh", theme: "light" },
};
let reasoningLabel = "快速";
let pendingImages = [];
let menuConversationId = "";
let renameConversationId = "";

const translations = {
  zh: {
    addImage: "添加图片",
    apiKeyPlaceholder: "输入你的 API Key",
    apiSettings: "API 设置",
    balanced: "均衡",
    cancel: "取消",
    chatDeleted: "对话已删除。",
    chatName: "对话名称",
    currentModel: "当前模式",
    darkMode: "深色",
    deep: "深度",
    delete: "删除",
    emptyState: "这里还没有聊天记录。写下第一句话，就可以开始了。",
    fast: "快速",
    language: "语言",
    lightMode: "浅色",
    messagePlaceholder: "想聊什么？",
    modelFallback: "未设置模型",
    modelName: "模型名",
    newChat: "新聊天",
    newChatStarted: "已开始新的聊天。",
    pin: "置顶",
    rename: "重命名",
    renameChat: "重命名对话",
    saveAndStart: "保存并开始",
    saveName: "保存名称",
    saveSettings: "保存设置",
    settings: "设置",
    settingsSaved: "设置已保存。",
    setupCopy: "只需要设置一次，之后打开就能直接聊天。",
    setupError: "设置保存失败，请重新检查后再试。",
    setupTitle: "先连接你的模型",
    theme: "主题",
    untitled: "新聊天",
    unpin: "取消置顶",
    webSearch: "联网",
  },
  en: {
    addImage: "Add image",
    apiKeyPlaceholder: "Enter your API key",
    apiSettings: "API settings",
    balanced: "Balanced",
    cancel: "Cancel",
    chatDeleted: "Chat deleted.",
    chatName: "Chat name",
    currentModel: "Current model",
    darkMode: "Dark",
    deep: "Deep",
    delete: "Delete",
    emptyState: "No messages yet. Write the first message to begin.",
    fast: "Fast",
    language: "Language",
    lightMode: "Light",
    messagePlaceholder: "What would you like to chat about?",
    modelFallback: "No model set",
    modelName: "Model name",
    newChat: "New chat",
    newChatStarted: "Started a new chat.",
    pin: "Pin",
    rename: "Rename",
    renameChat: "Rename chat",
    saveAndStart: "Save and start",
    saveName: "Save name",
    saveSettings: "Save settings",
    settings: "Settings",
    settingsSaved: "Settings saved.",
    setupCopy: "Set this up once, then open the app and chat anytime.",
    setupError: "Settings could not be saved. Please check and try again.",
    setupTitle: "Connect your model",
    theme: "Theme",
    untitled: "New chat",
    unpin: "Unpin",
    webSearch: "Web",
  },
};

translations.zh.imagePreview = "预览图片";
translations.zh.closePreview = "关闭预览";
translations.en.imagePreview = "Preview image";
translations.en.closePreview = "Close preview";

function t(key) {
  const language = state.preferences?.language === "en" ? "en" : "zh";
  return translations[language][key] || translations.zh[key] || key;
}

function applyPreferences(preferences) {
  state.preferences = {
    language: preferences?.language === "en" ? "en" : "zh",
    theme: preferences?.theme === "dark" ? "dark" : "light",
  };

  document.documentElement.lang = state.preferences.language === "en" ? "en" : "zh-CN";
  document.documentElement.dataset.theme = state.preferences.theme;
  languageSelect.value = state.preferences.language;
  themeSelect.value = state.preferences.theme;

  for (const element of document.querySelectorAll("[data-i18n]")) {
    element.textContent = t(element.dataset.i18n);
  }

  for (const element of document.querySelectorAll("[data-i18n-placeholder]")) {
    element.placeholder = t(element.dataset.i18nPlaceholder);
  }

  for (const element of document.querySelectorAll("[data-i18n-title]")) {
    element.title = t(element.dataset.i18nTitle);
  }

  for (const button of modeButtons) {
    button.classList.toggle("active", button.dataset.mode === reasoningLabel);
  }
}

async function savePreferences(nextPreferences) {
  state.preferences = await window.simpleChat.savePreferences(nextPreferences);
  applyPreferences(state.preferences);
  renderChatList();
  await renderConversation();
}

function hasConfig(config) {
  return Boolean(config.apiUrl && config.apiKey && config.model);
}

function setStatus(message, isError = false) {
  statusText.textContent = message;
  statusText.classList.toggle("error", isError);
}

function setSetupError(message) {
  let error = document.querySelector("#setupError");
  if (!error) {
    error = document.createElement("p");
    error.id = "setupError";
    error.className = "status-text error setup-error";
    setupForm.append(error);
  }
  error.textContent = message;
}

function activeConversation() {
  return state.chats.conversations.find((conversation) => conversation.id === state.chats.activeConversationId) || state.chats.conversations[0];
}

function sortedConversations() {
  return [...state.chats.conversations].sort((a, b) => {
    if (Boolean(a.pinned) !== Boolean(b.pinned)) {
      return a.pinned ? -1 : 1;
    }
    return String(b.updatedAt).localeCompare(String(a.updatedAt));
  });
}

function iconSvg(kind) {
  if (kind === "pin") {
    return `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M14 3l7 7-3 1-3 6-2-2-5 5-1-1 5-5-2-2 6-3z" fill="currentColor"></path>
      </svg>
    `;
  }

  if (kind === "trash") {
    return `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M9 3h6l1 2h4v2H4V5h4l1-2zm1 6h2v8h-2V9zm4 0h2v8h-2V9zM7 9h2v8H7V9zM6 21h12l1-10H5l1 10z" fill="currentColor"></path>
      </svg>
    `;
  }

  return "";
}

async function refreshChats(chats) {
  state.chats = chats;
  renderChatList();
  await renderConversation();
}

function hideChatContextMenu() {
  chatContextMenu.hidden = true;
  chatContextMenu.innerHTML = "";
  menuConversationId = "";
}

function openRenameModal(conversation) {
  renameConversationId = conversation.id;
  renameInput.value = conversation.title || t("untitled");
  renameModal.hidden = false;
  renameInput.focus();
  renameInput.select();
}

function closeRenameModal() {
  renameModal.hidden = true;
  renameConversationId = "";
  renameInput.value = "";
}

function openImagePreview(image) {
  if (!image?.dataUrl) {
    return;
  }

  const title = image.name || t("imagePreview");
  imagePreviewImage.src = image.dataUrl;
  imagePreviewImage.alt = title;
  imagePreviewTitle.textContent = title;
  imagePreviewModal.hidden = false;
  closeImagePreviewButton.focus();
}

function closeImagePreview() {
  imagePreviewModal.hidden = true;
  imagePreviewImage.removeAttribute("src");
  imagePreviewImage.alt = t("imagePreview");
  imagePreviewTitle.textContent = t("imagePreview");
}

function makeImagePreviewable(thumbnail, image) {
  thumbnail.classList.add("message-image-thumb");
  thumbnail.tabIndex = 0;
  thumbnail.setAttribute("role", "button");
  thumbnail.setAttribute("aria-label", image.name ? `${t("imagePreview")}: ${image.name}` : t("imagePreview"));
  thumbnail.addEventListener("click", () => openImagePreview(image));
  thumbnail.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openImagePreview(image);
    }
  });
}

function openChatContextMenu(conversation, x, y) {
  menuConversationId = conversation.id;
  chatContextMenu.innerHTML = "";
  chatContextMenu.hidden = false;

  const renameItem = document.createElement("button");
  renameItem.type = "button";
  renameItem.className = "chat-context-item";
  renameItem.textContent = t("rename");

  const pinItem = document.createElement("button");
  pinItem.type = "button";
  pinItem.className = "chat-context-item";
  pinItem.textContent = conversation.pinned ? t("unpin") : t("pin");

  const deleteItem = document.createElement("button");
  deleteItem.type = "button";
  deleteItem.className = "chat-context-item danger";
  deleteItem.textContent = t("delete");

  renameItem.addEventListener("click", () => {
    hideChatContextMenu();
    openRenameModal(conversation);
  });

  pinItem.addEventListener("click", async () => {
    hideChatContextMenu();
    state.chats = await window.simpleChat.togglePinChat(conversation.id, !conversation.pinned);
    renderChatList();
    await renderConversation();
  });

  deleteItem.addEventListener("click", async () => {
    hideChatContextMenu();
    state.chats = await window.simpleChat.deleteChat(conversation.id);
    renderChatList();
    await renderConversation();
    setStatus(t("chatDeleted"));
  });

  chatContextMenu.append(renameItem, pinItem, deleteItem);

  const width = 168;
  const height = 138;
  const left = Math.min(x, window.innerWidth - width - 8);
  const top = Math.min(y, window.innerHeight - height - 8);

  chatContextMenu.style.left = `${Math.max(8, left)}px`;
  chatContextMenu.style.top = `${Math.max(8, top)}px`;
}

function showSetup() {
  setupView.hidden = false;
  chatView.hidden = true;
  apiUrlInput.value = state.config.apiUrl || "https://api.openai.com/v1";
  apiKeyInput.value = state.config.apiKey || "";
  modelInput.value = state.config.model || "";
}

async function showChat() {
  setupView.hidden = true;
  chatView.hidden = false;
  modelName.textContent = state.config.model || t("modelFallback");
  renderChatList();
  await renderConversation();
}

function renderChatList() {
  chatList.innerHTML = "";
  const conversations = sortedConversations();

  for (const conversation of conversations) {
    const item = document.createElement("div");
    item.className = `chat-item ${conversation.id === state.chats.activeConversationId ? "active" : ""}${conversation.pinned ? " pinned" : ""}`;

    const button = document.createElement("button");
    button.type = "button";
    button.className = "chat-item-main";

    const title = document.createElement("span");
    title.className = "chat-item-title";
    title.textContent = conversation.title || t("untitled");

    const actions = document.createElement("div");
    actions.className = "chat-item-actions";

    const pinButton = document.createElement("button");
    pinButton.type = "button";
    pinButton.className = "chat-action-button pin";
    pinButton.title = conversation.pinned ? t("unpin") : t("pin");
    pinButton.setAttribute("aria-label", pinButton.title);
    pinButton.innerHTML = iconSvg("pin");

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "chat-action-button";
    deleteButton.title = t("delete");
    deleteButton.setAttribute("aria-label", t("delete"));
    deleteButton.innerHTML = iconSvg("trash");

    button.append(title);
    button.addEventListener("click", async () => {
      hideChatContextMenu();
      state.chats = await window.simpleChat.setActiveChat(conversation.id);
      renderChatList();
      await renderConversation();
    });

    button.addEventListener("contextmenu", (event) => {
      event.preventDefault();
      openChatContextMenu(conversation, event.clientX, event.clientY);
    });

    pinButton.addEventListener("click", async (event) => {
      event.stopPropagation();
      state.chats = await window.simpleChat.togglePinChat(conversation.id, !conversation.pinned);
      hideChatContextMenu();
      renderChatList();
      await renderConversation();
    });

    deleteButton.addEventListener("click", async () => {
      state.chats = await window.simpleChat.deleteChat(conversation.id);
      hideChatContextMenu();
      renderChatList();
      await renderConversation();
      setStatus(t("chatDeleted"));
    });

    actions.append(pinButton, deleteButton);
    item.append(button, actions);
    chatList.append(item);
  }
}

async function renderConversation() {
  const conversation = activeConversation();
  conversationTitle.textContent = conversation?.title || t("untitled");
  messageList.innerHTML = "";

  if (!conversation || !conversation.messages.length) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.textContent = t("emptyState");
    messageList.append(empty);
    return;
  }

  for (const message of conversation.messages) {
    const item = document.createElement("div");
    item.className = `message ${message.role}`;
    const text = document.createElement("div");
    text.className = "message-content";
    text.innerHTML = await window.simpleChat.renderMarkdown(message.content);
    item.append(text);

    if (Array.isArray(message.images) && message.images.length) {
      const images = document.createElement("div");
      images.className = "message-images";
      for (const image of message.images) {
        const thumbnail = document.createElement("img");
        thumbnail.src = image.dataUrl;
        thumbnail.alt = image.name || "图片";
        makeImagePreviewable(thumbnail, image);
        images.append(thumbnail);
      }
      item.append(images);
    }
    messageList.append(item);
  }

  messageList.scrollTop = messageList.scrollHeight;
}

function renderAttachments() {
  attachmentTray.innerHTML = "";
  attachmentTray.hidden = pendingImages.length === 0;

  pendingImages.forEach((image, index) => {
    const item = document.createElement("div");
    item.className = "attachment";

    const thumbnail = document.createElement("img");
    thumbnail.src = image.dataUrl;
    thumbnail.alt = image.name;
    makeImagePreviewable(thumbnail, image);

    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "remove-attachment";
    remove.setAttribute("aria-label", "移除图片");
    remove.textContent = "×";
    remove.addEventListener("click", () => {
      pendingImages = pendingImages.filter((_, itemIndex) => itemIndex !== index);
      renderAttachments();
    });

    item.append(thumbnail, remove);
    attachmentTray.append(item);
  });
}

function fileToImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => {
      resolve({
        name: file.name,
        type: file.type,
        dataUrl: String(reader.result),
      });
    });
    reader.addEventListener("error", () => reject(reader.error));
    reader.readAsDataURL(file);
  });
}

async function addImageFiles(files) {
  const imageFiles = Array.from(files).filter((file) => file.type.startsWith("image/"));
  if (!imageFiles.length) {
    return;
  }
  const images = await Promise.all(imageFiles.map(fileToImage));
  pendingImages = [...pendingImages, ...images].slice(0, 6);
  renderAttachments();
}

function formConfigFrom(inputs) {
  return {
    apiUrl: inputs.apiUrl.value.trim(),
    apiKey: inputs.apiKey.value.trim(),
    model: inputs.model.value.trim(),
  };
}

async function saveConfig(config) {
  state.config = await window.simpleChat.saveConfig(config);
  modelName.textContent = state.config.model || t("modelFallback");
}

setupForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const config = formConfigFrom({
    apiUrl: apiUrlInput,
    apiKey: apiKeyInput,
    model: modelInput,
  });

  try {
    await saveConfig(config);
    state.chats = await window.simpleChat.getChats();
    await showChat();
  } catch (error) {
    setSetupError(error.message || t("setupError"));
  }
});

chatForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const content = messageInput.value.trim();
  const images = pendingImages;
  if (!content && !images.length) {
    return;
  }

  messageInput.value = "";
  pendingImages = [];
  renderAttachments();
  const conversation = activeConversation();
  if (conversation) {
    conversation.messages = [
      ...conversation.messages,
      { role: "user", content, images, createdAt: new Date().toISOString() },
    ];
    conversation.title = conversation.title === "新聊天" || conversation.title === "New chat" ? (content || t("addImage")).slice(0, 32) : conversation.title;
    conversationTitle.textContent = conversation.title;
    await renderConversation();
  }
  setStatus("正在回复...");

  try {
    state.chats = await window.simpleChat.sendMessage({
      content,
      images,
      reasoningLabel,
      useWebSearch: webSearchToggle.checked,
    });
    renderChatList();
    await renderConversation();
    setStatus("");
  } catch (error) {
    state.chats = await window.simpleChat.getChats();
    renderChatList();
    await renderConversation();
    setStatus(error.message || "Connection failed. Please check the API URL, key, or model name.", true);
  }
});

imageButton.addEventListener("click", () => {
  imageInput.click();
});

imageInput.addEventListener("change", async () => {
  await addImageFiles(imageInput.files);
  imageInput.value = "";
});

chatView.addEventListener("dragover", (event) => {
  event.preventDefault();
  chatView.classList.add("dragging");
});

chatView.addEventListener("dragleave", (event) => {
  if (!chatView.contains(event.relatedTarget)) {
    chatView.classList.remove("dragging");
  }
});

chatView.addEventListener("drop", async (event) => {
  event.preventDefault();
  chatView.classList.remove("dragging");
  await addImageFiles(event.dataTransfer.files);
});

for (const button of modeButtons) {
  button.addEventListener("click", () => {
    reasoningLabel = button.dataset.mode;
    for (const item of modeButtons) {
      item.classList.toggle("active", item === button);
    }
  });
}

languageSelect.addEventListener("change", async () => {
  await savePreferences({
    ...state.preferences,
    language: languageSelect.value,
  });
});

themeSelect.addEventListener("change", async () => {
  await savePreferences({
    ...state.preferences,
    theme: themeSelect.value,
  });
});

settingsButton.addEventListener("click", () => {
  settingsApiUrl.value = state.config.apiUrl;
  settingsApiKey.value = state.config.apiKey;
  settingsModel.value = state.config.model;
  settingsModal.hidden = false;
});

closeSettingsButton.addEventListener("click", () => {
  settingsModal.hidden = true;
});

settingsForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const config = formConfigFrom({
    apiUrl: settingsApiUrl,
    apiKey: settingsApiKey,
    model: settingsModel,
  });

  await saveConfig(config);
  settingsModal.hidden = true;
  setStatus(t("settingsSaved"));
});

renameForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const title = renameInput.value.trim();
  if (!title || !renameConversationId) {
    return;
  }

  state.chats = await window.simpleChat.renameChat(renameConversationId, title);
  closeRenameModal();
  renderChatList();
  await renderConversation();
});

closeRenameButton.addEventListener("click", closeRenameModal);
cancelRenameButton.addEventListener("click", closeRenameModal);
renameModal.addEventListener("click", (event) => {
  if (event.target === renameModal) {
    closeRenameModal();
  }
});

closeImagePreviewButton.addEventListener("click", closeImagePreview);
imagePreviewModal.addEventListener("click", (event) => {
  if (event.target === imagePreviewModal) {
    closeImagePreview();
  }
});

newChatButton.addEventListener("click", async () => {
  state.chats = await window.simpleChat.createChat();
  renderChatList();
  await renderConversation();
  setStatus(t("newChatStarted"));
});

messageInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    chatForm.requestSubmit();
  }
});

document.addEventListener("click", (event) => {
  if (!chatContextMenu.contains(event.target)) {
    hideChatContextMenu();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    hideChatContextMenu();
    if (!renameModal.hidden) {
      closeRenameModal();
    }
    if (!imagePreviewModal.hidden) {
      closeImagePreview();
    }
  }
});

window.addEventListener("resize", hideChatContextMenu);
window.addEventListener("scroll", hideChatContextMenu, true);

async function boot() {
  state = await window.simpleChat.getState();
  applyPreferences(state.preferences);
  if (hasConfig(state.config)) {
    await showChat();
  } else {
    showSetup();
  }
}

boot().catch((error) => {
  console.error(error);
  showSetup();
});
