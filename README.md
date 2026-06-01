# Simple Chat App with BYOK

A simple Windows desktop chat app built with Electron. It lets the user bring their own API URL, API key, and model name, then keeps those settings locally on their own computer.

## Features

- Bring your own API key and API-compatible `/v1` base URL.
- Local-only settings storage through Electron user data.
- Conversation history with new chats, delete, rename, and pin support.
- Reasoning effort selector: fast, balanced, and deep.
- Optional web search toggle for APIs that support Responses API web search tools.
- Image upload by file picker or drag and drop.
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

## Privacy Notes

- No API key is hardcoded in the source code.
- Local configuration and chat history are intentionally excluded from Git.
- Build outputs and `node_modules` are excluded from Git.

## Project Structure

```text
src/
  api.js                 Responses API request helpers
  conversations.js       Conversation history, rename, pin, and delete logic
  main.js                Electron main process and IPC handlers
  markdown.js            Safe Markdown rendering
  preload.js             Renderer-safe API bridge
  renderer/              HTML, CSS, and browser-side app code
test/                    Node test suite
```

## Notes

This project expects a Responses API-compatible endpoint. Some third-party providers or proxies may differ in tool names or multimodal support, so web search and image inputs depend on the configured API provider.
