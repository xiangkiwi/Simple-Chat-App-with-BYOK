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
  clearConversations,
  renameConversation,
  togglePinnedConversation,
  activeConversation,
} = require("./conversations");
const { DEFAULT_PREFERENCES, normalizePreferences } = require("./preferences");
const { readJson, readJsonIfExists, writeJson } = require("./store");
const {
  DEFAULT_VIDEO_CONFIG,
  normalizeVideoConfig,
  videoGenerateUrl,
  extractVideoUrl,
  buildVideoRequestBody,
} = require("./videoApi");
const { DEFAULT_VIDEOS, normalizeVideos, addVideo, deleteVideo, clearVideos } = require("./videos");
const {
  DEFAULT_IMAGE_CONFIG,
  normalizeImageConfig,
  imageGenerateUrl,
  assertAbsoluteImageApiUrl,
  extractImageUrl,
  summarizeImageResponse,
  buildImageRequestBody,
} = require("./imageApi");
const { DEFAULT_IMAGES, normalizeImages, addImage, deleteImage, clearImages } = require("./images");

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
    preferences: path.join(userData, "preferences.json"),
    videoConfig: path.join(userData, "videoConfig.json"),
    videos: path.join(userData, "videos.json"),
    imageConfig: path.join(userData, "imageConfig.json"),
    images: path.join(userData, "images.json"),
  };
}

function loadState() {
  const paths = filePaths();
  const config = readJson(paths.config, DEFAULT_CONFIG);
  const videoConfig = normalizeVideoConfig(readJsonIfExists(paths.videoConfig, DEFAULT_VIDEO_CONFIG));
  const chats = normalizeChats(readJsonIfExists(paths.chats, DEFAULT_CHATS));
  const preferences = normalizePreferences(readJsonIfExists(paths.preferences, DEFAULT_PREFERENCES));
  const videos = normalizeVideos(readJsonIfExists(paths.videos, DEFAULT_VIDEOS));
  const imageConfig = normalizeImageConfig(readJsonIfExists(paths.imageConfig, DEFAULT_IMAGE_CONFIG));
  const images = normalizeImages(readJsonIfExists(paths.images, DEFAULT_IMAGES));
  writeJson(paths.chats, chats);
  writeJson(paths.preferences, preferences);
  writeJson(paths.videos, videos);
  writeJson(paths.images, images);

  return {
    config: {
      apiUrl: config.apiUrl || "",
      apiKey: config.apiKey || "",
      model: config.model || "",
    },
    videoConfig,
    imageConfig,
    chats,
    preferences,
    videos,
    images,
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

function savePreferences(preferences) {
  const cleanPreferences = normalizePreferences(preferences);
  writeJson(filePaths().preferences, cleanPreferences);
  return cleanPreferences;
}

function saveVideoConfig(config) {
  const cleanConfig = normalizeVideoConfig(config);
  writeJson(filePaths().videoConfig, cleanConfig);
  return cleanConfig;
}

function saveVideos(videos) {
  writeJson(filePaths().videos, normalizeVideos(videos));
}

function saveImageConfig(config) {
  const cleanConfig = normalizeImageConfig(config);
  writeJson(filePaths().imageConfig, cleanConfig);
  return cleanConfig;
}

function saveImages(images) {
  writeJson(filePaths().images, normalizeImages(images));
}

function validateConfig(config) {
  if (!config.apiUrl || !config.apiKey || !config.model) {
    throw new Error("请先填写 API URL、API Key 和模型名。");
  }
}

function validateVideoConfig(config) {
  if (!config.apiUrl || !config.apiKey || !config.model) {
    throw new Error("Please set Video API URL, Video API Key, and video model name first.");
  }
}

function validateImageConfig(config) {
  if (!config.apiUrl || !config.apiKey || !config.model) {
    throw new Error("Please set Image API URL, Image API Key, and image model name first.");
  }
}

async function generateImage(_event, payload) {
  const state = loadState();
  validateImageConfig(state.imageConfig);

  const prompt = String(payload?.prompt || "").trim();
  if (!prompt) {
    throw new Error("Please enter an image description.");
  }
  assertAbsoluteImageApiUrl(state.imageConfig.apiUrl);

  const response = await fetch(imageGenerateUrl(state.imageConfig.apiUrl), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${state.imageConfig.apiKey}`,
    },
    body: JSON.stringify(
      buildImageRequestBody({
        apiUrl: state.imageConfig.apiUrl,
        model: payload?.model || state.imageConfig.model,
        prompt,
        image: payload?.image,
        size: payload?.size,
        quality: payload?.quality,
      })
    ),
  });

  const responsePayload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = responsePayload?.error?.message || "Image generation failed. Please check the Image API settings.";
    throw new Error(message);
  }

  const imageUrl = extractImageUrl(responsePayload);
  if (!imageUrl) {
    throw new Error(`The Image API did not return an image URL. Response preview: ${summarizeImageResponse(responsePayload)}`);
  }

  const images = addImage(state.images, {
    prompt,
    image: payload?.image,
    imageUrl,
    size: payload?.size,
    quality: payload?.quality,
  });
  saveImages(images);

  return {
    image: images.items[0],
    images,
  };
}

async function generateVideo(_event, payload) {
  const state = loadState();
  validateVideoConfig(state.videoConfig);

  const prompt = String(payload?.prompt || "").trim();
  if (!prompt) {
    throw new Error("Please enter a video description.");
  }

  const response = await fetch(videoGenerateUrl(state.videoConfig.apiUrl), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${state.videoConfig.apiKey}`,
    },
    body: JSON.stringify(
      buildVideoRequestBody({
        model: payload?.model || state.videoConfig.model,
        prompt,
        image: payload?.image,
        aspectRatio: payload?.aspectRatio,
        duration: payload?.duration,
        quality: payload?.quality,
      })
    ),
  });

  const responsePayload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = responsePayload?.error?.message || "Video generation failed. Please check the Video API settings.";
    throw new Error(message);
  }

  const videoUrl = extractVideoUrl(responsePayload);
  if (!videoUrl) {
    throw new Error("The Video API did not return a video URL.");
  }

  const videos = addVideo(state.videos, {
    prompt,
    image: payload?.image,
    videoUrl,
    aspectRatio: payload?.aspectRatio,
    duration: payload?.duration,
    quality: payload?.quality,
  });
  saveVideos(videos);

  return {
    video: videos.items[0],
    videos,
  };
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
  ipcMain.handle("save-video-config", (_event, config) => saveVideoConfig(config));
  ipcMain.handle("save-image-config", (_event, config) => saveImageConfig(config));
  ipcMain.handle("save-preferences", (_event, preferences) => savePreferences(preferences));
  ipcMain.handle("send-message", sendMessage);
  ipcMain.handle("generate-video", generateVideo);
  ipcMain.handle("generate-image", generateImage);
  ipcMain.handle("get-videos", () => loadState().videos);
  ipcMain.handle("get-images", () => loadState().images);
  ipcMain.handle("delete-video", (_event, videoId) => {
    const videos = deleteVideo(loadState().videos, videoId);
    saveVideos(videos);
    return videos;
  });
  ipcMain.handle("clear-videos", () => {
    const videos = clearVideos();
    saveVideos(videos);
    return videos;
  });
  ipcMain.handle("delete-image", (_event, imageId) => {
    const images = deleteImage(loadState().images, imageId);
    saveImages(images);
    return images;
  });
  ipcMain.handle("clear-images", () => {
    const images = clearImages();
    saveImages(images);
    return images;
  });
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
  ipcMain.handle("clear-chats", () => {
    const chats = clearConversations(loadState().chats);
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
