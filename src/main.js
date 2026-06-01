const path = require("node:path");
const { app, BrowserWindow, Menu, ipcMain } = require("electron");

const { buildResponsesBody, extractResponseText, responsesUrl } = require("./api");
const { renderMarkdown } = require("./markdown");
const {
  normalizeChats,
  createConversation,
  appendMessagesToActive,
  setActiveConversation,
  deleteConversation,
  renameConversation,
  togglePinnedConversation,
  activeConversation,
} = require("./conversations");
const { readJson, readJsonIfExists, writeJson } = require("./store");

const DEFAULT_CONFIG = {
  apiUrl: "",
  apiKey: "",
  model: "",
};

const DEFAULT_CHATS = {
  activeConversationId: "",
  conversations: [],
};

let mainWindow;

function filePaths() {
  const userData = app.getPath("userData");
  return {
    config: path.join(userData, "config.json"),
    chats: path.join(userData, "chats.json"),
  };
}

function loadState() {
  const paths = filePaths();
  const config = readJson(paths.config, DEFAULT_CONFIG);
  const chats = normalizeChats(readJsonIfExists(paths.chats, DEFAULT_CHATS));
  writeJson(paths.chats, chats);

  return {
    config: {
      apiUrl: config.apiUrl || "",
      apiKey: config.apiKey || "",
      model: config.model || "",
    },
    chats,
  };
}

function saveConfig(config) {
  const cleanConfig = {
    apiUrl: String(config.apiUrl || "").trim(),
    apiKey: String(config.apiKey || "").trim(),
    model: String(config.model || "").trim(),
  };

  writeJson(filePaths().config, cleanConfig);
  return cleanConfig;
}

function saveChats(chats) {
  writeJson(filePaths().chats, chats);
}

function validateConfig(config) {
  if (!config.apiUrl || !config.apiKey || !config.model) {
    throw new Error("请先填写 API URL、API Key 和模型名。");
  }
}

async function sendMessage(_event, { content, images = [], reasoningLabel, useWebSearch }) {
  const state = loadState();
  validateConfig(state.config);
  let chats = state.chats;

  const userMessage = {
    role: "user",
    content: String(content || "").trim(),
    images: Array.isArray(images) ? images : [],
    createdAt: new Date().toISOString(),
  };

  if (!userMessage.content && !userMessage.images.length) {
    throw new Error("请输入内容或添加图片。");
  }

  chats = appendMessagesToActive(chats, [userMessage]);
  saveChats(chats);
  const requestMessages = activeConversation(chats).messages.map((message) => ({
    role: message.role,
    content: message.content,
    images: message.images,
  }));

  const response = await fetch(responsesUrl(state.config.apiUrl), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${state.config.apiKey}`,
    },
    body: JSON.stringify(
      buildResponsesBody({
        model: state.config.model,
        messages: requestMessages,
        reasoningLabel,
        useWebSearch,
      })
    ),
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = payload?.error?.message || "连接失败，请检查 API 地址、密钥或模型名。";
    throw new Error(message);
  }

  const assistantText = extractResponseText(payload);
  if (!assistantText) {
    throw new Error("模型返回了空内容，请稍后再试。");
  }

  const assistantMessage = {
    role: "assistant",
    content: assistantText,
    createdAt: new Date().toISOString(),
  };

  chats = appendMessagesToActive(chats, [assistantMessage]);
  saveChats(chats);

  return chats;
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1120,
    height: 760,
    minWidth: 860,
    minHeight: 620,
    title: "Simple Chat",
    backgroundColor: "#f7f2ea",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.loadFile(path.join(__dirname, "renderer", "index.html"));
}

app.whenReady().then(() => {
  Menu.setApplicationMenu(null);
  ipcMain.handle("get-state", loadState);
  ipcMain.handle("save-config", (_event, config) => saveConfig(config));
  ipcMain.handle("send-message", sendMessage);
  ipcMain.handle("get-chats", () => loadState().chats);
  ipcMain.handle("create-chat", () => {
    const chats = createConversation(loadState().chats);
    saveChats(chats);
    return chats;
  });
  ipcMain.handle("set-active-chat", (_event, conversationId) => {
    const chats = setActiveConversation(loadState().chats, conversationId);
    saveChats(chats);
    return chats;
  });
  ipcMain.handle("delete-chat", (_event, conversationId) => {
    const chats = deleteConversation(loadState().chats, conversationId);
    saveChats(chats);
    return chats;
  });
  ipcMain.handle("rename-chat", (_event, conversationId, title) => {
    const chats = renameConversation(loadState().chats, conversationId, title);
    saveChats(chats);
    return chats;
  });
  ipcMain.handle("toggle-pin-chat", (_event, conversationId, pinned) => {
    const chats = togglePinnedConversation(loadState().chats, conversationId, pinned);
    saveChats(chats);
    return chats;
  });
  ipcMain.handle("render-markdown", (_event, markdown) => renderMarkdown(markdown));
  ipcMain.handle("export-diagnostics", () => {
    const state = loadState();
    return {
      hasApiUrl: Boolean(state.config.apiUrl),
      hasApiKey: Boolean(state.config.apiKey),
      model: state.config.model,
      messageCount: activeConversation(state.chats)?.messages.length || 0,
      conversationCount: state.chats.conversations.length,
      userDataPath: app.getPath("userData"),
    };
  });

  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
