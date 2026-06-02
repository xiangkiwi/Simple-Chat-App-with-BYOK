# Simple Chat App with BYOK

A simple Windows desktop chat app built with Electron. Users bring their own API URL, API key, and model name. The app stores settings locally on the user's computer.

## Features

- Bring your own API key and API-compatible `/v1` base URL.
- Local-only settings storage through Electron user data.
- Conversation history with new chats, delete, rename, and pin support.
- Language switcher: Chinese and English.
- Theme switcher: light mode and dark mode.
- Reasoning effort selector: fast, balanced, and deep.
- Optional web search toggle for APIs that support Responses API web search tools.
- Image upload by file picker or drag and drop.
- Dedicated Video Creation workspace with text-to-video and image-plus-text-to-video inputs.
- Separate Video API settings, aspect ratio, duration, quality, preview, download, copy link, and local video history.
- Markdown rendering for assistant replies, including headings, bold text, lists, links, blockquotes, and code blocks.
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

On first launch, the app asks for:

- `API URL`, for example `https://api.openai.com/v1`
- `API Key`
- `Model name`

The app sends requests to:

```text
{API URL}/responses
```

API keys are not committed to this repository. They are entered by the user in the desktop app and stored locally by Electron in the user's app data folder.

## Video API Configuration

The Video Creation workspace has separate settings:

- `Video API URL`, for example `https://video-api.example.com/v1`
- `Video API Key`
- `Video model name`

The first implementation sends requests to:

```text
{Video API URL}/generate
```

The video API is expected to return a direct video URL. The app accepts common response fields such as `video_url`, `videoUrl`, `url`, and `output_url`.

## Privacy Notes

- No API key is hardcoded in the source code.
- Local configuration, preferences, chat history, video API settings, and video history are intentionally excluded from Git.
- Build outputs and `node_modules` are excluded from Git.

## Project Structure

```text
src/
  api.js                 Responses API request helpers
  conversations.js       Conversation history, rename, pin, and delete logic
  main.js                Electron main process and IPC handlers
  markdown.js            Safe Markdown rendering
  preferences.js         Language and theme preference helpers
  preload.js             Renderer-safe API bridge
  videoApi.js            Video generation request and response helpers
  videos.js              Local video history helpers
  renderer/              HTML, CSS, and browser-side app code
test/                    Node test suite
```

## Notes

This project expects a Responses API-compatible endpoint. Some third-party providers or proxies may differ in tool names or multimodal support, so web search and image inputs depend on the configured API provider.

---

# Simple Chat App with BYOK 中文说明

这是一个使用 Electron 制作的 Windows 桌面聊天软件。用户可以自己填写 API URL、API Key 和模型名，所有设置都会保存在用户自己的电脑本地。

## 功能

- 支持用户自带 API Key 和兼容 `/v1` 的 API 地址。
- 设置只保存在本地 Electron 用户数据目录。
- 支持对话历史、新聊天、删除、重命名和置顶。
- 支持语言切换：中文和英文。
- 支持主题切换：浅色模式和深色模式。
- 支持 reasoning effort 档位：快速、均衡、深度。
- 支持联网搜索开关，前提是配置的 API 支持 Responses API web search 工具。
- 支持选择图片或拖拽图片上传。
- 支持独立的视频制作页面，可以用文字或文字加图片生成视频。
- 支持独立 Video API 设置、竖屏/横屏/方形比例、时长、清晰度、视频预览、下载、复制链接和本地视频历史。
- 支持 Markdown 回复显示，包括标题、加粗、列表、链接、引用和代码块。
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

第一次打开软件时，需要填写：

- `API URL`，例如 `https://api.openai.com/v1`
- `API Key`
- `模型名`

软件会请求：

```text
{API URL}/responses
```

API Key 不会提交到这个仓库。用户在软件里填写后，会由 Electron 保存在用户电脑本地。

## Video API 设置

视频制作页面有独立设置：

- `Video API URL`，例如 `https://video-api.example.com/v1`
- `Video API Key`
- `视频模型名`

软件会请求：

```text
{Video API URL}/generate
```

目前版本假设视频 API 会直接返回视频链接。软件支持常见返回字段，例如 `video_url`、`videoUrl`、`url` 和 `output_url`。

## 隐私说明

- 源码里没有硬编码 API Key。
- 本地配置、偏好设置、聊天记录、Video API 设置和视频历史都不会提交到 Git。
- 构建产物和 `node_modules` 不会提交到 Git。
