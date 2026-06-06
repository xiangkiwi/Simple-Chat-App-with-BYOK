const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { test } = require("node:test");

const html = readFileSync("src/renderer/index.html", "utf8");
const css = readFileSync("src/renderer/styles.css", "utf8");
const app = readFileSync("src/renderer/app.js", "utf8");
const readme = readFileSync("README.md", "utf8");
const changelog = readFileSync("CHANGELOG.md", "utf8");

test("sidebar workspace order is chat image video", () => {
  const chatIndex = html.indexOf('id="chatWorkspaceButton"');
  const imageIndex = html.indexOf('id="imageWorkspaceButton"');
  const videoIndex = html.indexOf('id="videoWorkspaceButton"');

  assert.ok(chatIndex >= 0);
  assert.ok(imageIndex > chatIndex);
  assert.ok(videoIndex > imageIndex);
});

test("sidebar workspace buttons are in one switcher", () => {
  const switcherMatch = html.match(/<div class="workspace-switcher"[^>]*>([\s\S]*?)<\/div>/);

  assert.ok(switcherMatch);
  assert.match(switcherMatch[1], /id="chatWorkspaceButton"/);
  assert.match(switcherMatch[1], /id="imageWorkspaceButton"/);
  assert.match(switcherMatch[1], /id="videoWorkspaceButton"/);
  assert.equal(switcherMatch[1].includes('id="newChatButton"'), false);
});

test("video duration options cover one to fifteen seconds", () => {
  const selectMatch = html.match(/<select id="videoDurationSelect" hidden>([\s\S]*?)<\/select>/);
  const values = Array.from(selectMatch[1].matchAll(/<option value="(\d+)"/g), (match) => match[1]);

  assert.deepEqual(values, Array.from({ length: 15 }, (_, index) => String(index + 1)));
});

test("video duration uses a custom downward dropdown", () => {
  assert.match(html, /<select id="videoDurationSelect" hidden>/);
  assert.match(html, /id="videoDurationButton"/);
  assert.match(html, /id="videoDurationMenu"/);
  assert.match(css, /\.duration-menu\s*{[^}]*top:\s*calc\(100% \+ 6px\)/s);
  assert.match(app, /function setVideoDuration/);
});

test("image workspace does not show advanced image options", () => {
  const imageWorkspaceHtml = html.slice(
    html.indexOf('id="imageWorkspace"'),
    html.indexOf('id="imageSettingsModal"')
  );

  assert.equal(imageWorkspaceHtml.includes('class="advanced-video-options"'), false);
  assert.equal(imageWorkspaceHtml.includes('id="imageQualitySelect"'), false);
  assert.equal(imageWorkspaceHtml.includes('id="imageModelOverrideInput"'), false);
  assert.equal(app.includes("imageQualitySelect"), false);
  assert.equal(app.includes("imageModelOverrideInput"), false);
});

test("image workspace uses a wider 60 40 split", () => {
  assert.match(css, /\.image-layout\s*{[^}]*grid-template-columns:\s*minmax\(0,\s*3fr\)\s+minmax\(360px,\s*2fr\)/s);
});

test("api settings are grouped into one tabbed modal", () => {
  assert.match(html, /id="apiSettingsModal"/);
  assert.match(html, /id="chatSettingsTab"/);
  assert.match(html, /id="imageSettingsTab"/);
  assert.match(html, /id="videoSettingsTab"/);
  assert.equal(html.includes('id="videoSettingsModal"'), false);
  assert.equal(html.includes('id="imageSettingsModal"'), false);
});

test("workspaces expose clear history actions", () => {
  assert.match(html, /id="clearChatsButton"/);
  assert.match(html, /id="clearImagesButton"/);
  assert.match(html, /id="clearVideosButton"/);
  assert.match(app, /clearChatHistory/);
  assert.match(app, /clearImageHistory/);
  assert.match(app, /clearVideoHistory/);
});

test("video generation reports staged progress", () => {
  assert.match(app, /videoStatusCheckingSettings/);
  assert.match(app, /videoStatusSubmitting/);
  assert.match(app, /videoStatusWaiting/);
  assert.match(app, /videoStatusSaving/);
});

test("readme and changelog document unified settings and clearing history", () => {
  assert.match(readme, /Unified settings/i);
  assert.match(readme, /Clear history/i);
  assert.match(readme, /统一设置/);
  assert.match(readme, /清空历史/);
  assert.match(changelog, /Unified settings/i);
  assert.match(changelog, /Clear history/i);
});
