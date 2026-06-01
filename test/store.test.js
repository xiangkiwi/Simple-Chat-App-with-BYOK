const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const { readJson, writeJson } = require("../src/store");

function tempPath(name) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "simple-chat-store-"));
  return path.join(dir, name);
}

test("readJson creates missing file with default value", () => {
  const filePath = tempPath("config.json");
  const value = readJson(filePath, { apiUrl: "", model: "" });

  assert.deepEqual(value, { apiUrl: "", model: "" });
  assert.deepEqual(JSON.parse(fs.readFileSync(filePath, "utf8")), { apiUrl: "", model: "" });
});

test("readJson returns existing JSON", () => {
  const filePath = tempPath("config.json");
  fs.writeFileSync(filePath, JSON.stringify({ apiUrl: "https://api.openai.com/v1" }), "utf8");

  assert.deepEqual(readJson(filePath, {}), { apiUrl: "https://api.openai.com/v1" });
});

test("writeJson writes formatted JSON", () => {
  const filePath = tempPath("chats.json");
  writeJson(filePath, { messages: [{ role: "user", content: "hello" }] });

  assert.deepEqual(JSON.parse(fs.readFileSync(filePath, "utf8")), {
    messages: [{ role: "user", content: "hello" }],
  });
});

test("readJson recovers invalid JSON to default value", () => {
  const filePath = tempPath("broken.json");
  fs.writeFileSync(filePath, "{ nope", "utf8");

  assert.deepEqual(readJson(filePath, { messages: [] }), { messages: [] });
  assert.deepEqual(JSON.parse(fs.readFileSync(filePath, "utf8")), { messages: [] });
});
