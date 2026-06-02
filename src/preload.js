const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("simpleChat", {
  getState: () => ipcRenderer.invoke("get-state"),
  getChats: () => ipcRenderer.invoke("get-chats"),
  saveConfig: (config) => ipcRenderer.invoke("save-config", config),
  savePreferences: (preferences) => ipcRenderer.invoke("save-preferences", preferences),
  sendMessage: (payload) => ipcRenderer.invoke("send-message", payload),
  createChat: () => ipcRenderer.invoke("create-chat"),
  setActiveChat: (conversationId) => ipcRenderer.invoke("set-active-chat", conversationId),
  deleteChat: (conversationId) => ipcRenderer.invoke("delete-chat", conversationId),
  renameChat: (conversationId, title) => ipcRenderer.invoke("rename-chat", conversationId, title),
  togglePinChat: (conversationId, pinned) => ipcRenderer.invoke("toggle-pin-chat", conversationId, pinned),
  exportDiagnostics: () => ipcRenderer.invoke("export-diagnostics"),
  renderMarkdown: (markdown) => ipcRenderer.invoke("render-markdown", markdown),
});
