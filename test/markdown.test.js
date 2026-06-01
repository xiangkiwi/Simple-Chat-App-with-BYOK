const test = require("node:test");
const assert = require("node:assert/strict");

const { renderMarkdown } = require("../src/markdown");

test("renders bold markdown and bare URLs", () => {
  assert.equal(
    renderMarkdown("这是 **重点** https://example.com/path").trim(),
    '<p>这是 <strong>重点</strong> <a href="https://example.com/path" target="_blank" rel="noreferrer">https://example.com/path</a></p>'
  );
});

test("escapes unsafe html before rendering markdown", () => {
  assert.equal(
    renderMarkdown('<script>alert(1)</script> **ok**').trim(),
    "<p>&lt;script&gt;alert(1)&lt;/script&gt; <strong>ok</strong></p>"
  );
});

test("renders markdown headings", () => {
  assert.equal(renderMarkdown("### 近期/官方内容").trim(), "<h3>近期/官方内容</h3>");
});
