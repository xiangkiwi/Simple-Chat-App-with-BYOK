const test = require("node:test");
const assert = require("node:assert/strict");

const { normalizePreferences } = require("../src/preferences");

test("defaults preferences to Chinese and light mode", () => {
  assert.deepEqual(normalizePreferences({}), { language: "zh", theme: "light" });
});

test("keeps supported language and theme values", () => {
  assert.deepEqual(normalizePreferences({ language: "en", theme: "dark" }), {
    language: "en",
    theme: "dark",
  });
});

test("falls back from unsupported preference values", () => {
  assert.deepEqual(normalizePreferences({ language: "fr", theme: "blue" }), {
    language: "zh",
    theme: "light",
  });
});
