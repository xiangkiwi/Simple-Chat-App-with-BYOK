const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("simpleChat", {
  getState: () => ipcRenderer.invoke("get-state"),
  getChats: () => ipcRenderer.invoke("get-chats"),
  getVideos: () => ipcRenderer.invoke("get-videos"),
  saveConfig: (config) => ipcRenderer.invoke("save-config", config),
  saveVideoConfig: (config) => ipcRenderer.invoke("save-video-config", config),
  savePreferences: (preferences) => ipcRenderer.invoke("save-preferences", preferences),
  sendMessage: (payload) => ipcRenderer.invoke("send-message", payload),
  generateVideo: (payload) => ipcRenderer.invoke("generate-video", payload),
  createChat: () => ipcRenderer.invoke("create-chat"),
  setActiveChat: (conversationId) => ipcRenderer.invoke("set-active-chat", conversationId),
  deleteChat: (conversationId) => ipcRenderer.invoke("delete-chat", conversationId),
  deleteVideo: (videoId) => ipcRenderer.invoke("delete-video", videoId),
  renameChat: (conversationId, title) => ipcRenderer.invoke("rename-chat", conversationId, title),
  togglePinChat: (conversationId, pinned) => ipcRenderer.invoke("toggle-pin-chat", conversationId, pinned),
  exportDiagnostics: () => ipcRenderer.invoke("export-diagnostics"),
  renderMarkdown: (markdown) => ipcRenderer.invoke("render-markdown", markdown),
});
