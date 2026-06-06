# Simple Chat App with BYOK

A simple Windows desktop app built with Electron. It has three workspaces: Chat, Image Creation, and Video Creation. Users bring their own API URL, API key, and model name. All settings and history stay on the user's own computer.

## Features

- Chat workspace with conversation history, rename, pin, delete, Markdown rendering, image upload, web search toggle, and reasoning effort.
- Image Creation workspace with text-to-image, image size, preview, download, copy link, local image history, and Clear history.
- Video Creation workspace with text or image-plus-text input, aspect ratio, 1-15 second duration, quality, preview, download, copy link, staged status messages, local video history, and Clear history.
- Unified settings modal with separate tabs for Chat API, Image API, and Video API.
- Chinese and English language switcher.
- Light and dark theme switcher.
- Windows NSIS installer build through `electron-builder`.

## Setup

Install dependencies:

```bash
npm install
```

Run the app locally:

```bash
npm start
```

Run tests:

```bash
npm test
```

Build the Windows installer:

```bash
npm run dist
```

The installer is generated under `outputs/dist/`.

## API Configuration

Open Settings in the lower-left corner. The Unified settings modal has three tabs:

- Chat API: `API URL`, `API Key`, and `Model name`
- Image API: `Image API URL`, `Image API Key`, and `Image model name`
- Video API: `Video API URL`, `Video API Key`, and `Video model name`

Chat requests are sent to:

```text
{API URL}/responses
```

Image and video requests currently use:

```text
{Image API URL}/generate
{Video API URL}/generate
```

The image API may return a direct image URL, base64 image data, a data URL, or a Markdown image link. The video API currently expects a direct video URL in common fields such as `video_url`, `videoUrl`, `url`, or `output_url`.

## Privacy Notes

- No API key is hardcoded in the source code.
- API settings, preferences, chat history, image history, and video history are saved locally by Electron in the user's app data folder.
- Local settings, build outputs, and `node_modules` are excluded from Git.

## Project Structure

```text
src/
  api.js                 Responses API request helpers
  conversations.js       Conversation history helpers
  imageApi.js            Image generation request and response helpers
  images.js              Local image history helpers
  main.js                Electron main process and IPC handlers
  markdown.js            Safe Markdown rendering
  preferences.js         Language and theme preference helpers
  preload.js             Renderer-safe API bridge
  renderer/              HTML, CSS, and browser-side app code
  store.js               Local JSON storage helpers
  videoApi.js            Video generation request and response helpers
  videos.js              Local video history helpers
test/                    Node test suite
```

---

# Simple Chat App with BYOK 中文说明

这是一个使用 Electron 制作的 Windows 桌面软件。它包含三个工作区：聊天、图片制作、视频制作。用户自己填写 API URL、API Key 和模型名，所有设置和历史都会保存在用户自己的电脑本地。

## 功能

- 聊天工作区：支持对话历史、新聊天、删除、重命名、置顶、Markdown 显示、图片上传、联网开关和 reasoning effort。
- 图片制作工作区：支持文字生成图片、图片尺寸、预览、下载、复制链接、本地图片历史和清空历史。
- 视频制作工作区：支持文字或图片加文字生成视频、横竖屏/方形比例、1 到 15 秒时长、清晰度、预览、下载、复制链接、分阶段状态提示、本地视频历史和清空历史。
- 统一设置窗口：在一个设置弹窗里用三个 tab 分别管理 Chat API、Image API 和 Video API。
- 支持中文和英文切换。
- 支持浅色和深色主题。
- 支持通过 `electron-builder` 构建 Windows NSIS 安装包。

## 安装和运行

安装依赖：

```bash
npm install
```

本地运行：

```bash
npm start
```

运行测试：

```bash
npm test
```

构建 Windows 安装包：

```bash
npm run dist
```

安装包会生成在 `outputs/dist/`。

## API 设置

点击左下角的设置。统一设置窗口里有三个 tab：

- Chat API：`API URL`、`API Key`、`模型名`
- Image API：`Image API URL`、`Image API Key`、`图片模型名`
- Video API：`Video API URL`、`Video API Key`、`视频模型名`

聊天请求会发送到：

```text
{API URL}/responses
```

图片和视频请求目前会发送到：

```text
{Image API URL}/generate
{Video API URL}/generate
```

图片 API 可以返回图片链接、base64 图片、data URL 或 Markdown 图片链接。视频 API 目前预期直接返回视频链接，支持常见字段，例如 `video_url`、`videoUrl`、`url` 和 `output_url`。

## 隐私说明

- 源码里没有硬编码 API Key。
- API 设置、偏好设置、聊天历史、图片历史和视频历史都会由 Electron 保存在用户电脑本地。
- 本地设置、构建产物和 `node_modules` 不会提交到 Git。
