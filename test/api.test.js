const test = require("node:test");
const assert = require("node:assert/strict");

const {
  normalizeBaseUrl,
  responsesUrl,
  reasoningEffortForLabel,
  buildResponsesBody,
  extractResponseText,
} = require("../src/api");

test("normalizes base API URL by trimming trailing slashes", () => {
  assert.equal(normalizeBaseUrl("https://api.openai.com/v1/"), "https://api.openai.com/v1");
  assert.equal(normalizeBaseUrl(" https://example.com/v1/// "), "https://example.com/v1");
});

test("builds Responses API endpoint from base URL", () => {
  assert.equal(responsesUrl("https://api.openai.com/v1/"), "https://api.openai.com/v1/responses");
});

test("maps friendly reasoning labels to API effort values", () => {
  assert.equal(reasoningEffortForLabel("快速"), "low");
  assert.equal(reasoningEffortForLabel("均衡"), "medium");
  assert.equal(reasoningEffortForLabel("深度"), "high");
  assert.equal(reasoningEffortForLabel("unknown"), "medium");
});

test("builds Responses API request body", () => {
  const body = buildResponsesBody({
    model: "gpt-5.4-mini",
    messages: [
      { role: "user", content: "你好" },
      { role: "assistant", content: "你好呀" },
      { role: "user", content: "今天聊什么？" },
    ],
    reasoningLabel: "深度",
  });

  assert.equal(body.model, "gpt-5.4-mini");
  assert.equal(body.reasoning.effort, "high");
  assert.deepEqual(body.input, [
    { role: "user", content: "你好" },
    { role: "assistant", content: "你好呀" },
    { role: "user", content: "今天聊什么？" },
  ]);
});

test("adds web search tool only when requested", () => {
  const withoutSearch = buildResponsesBody({
    model: "gpt-5.4-mini",
    messages: [{ role: "user", content: "今天新闻" }],
    reasoningLabel: "快速",
    useWebSearch: false,
  });
  const withSearch = buildResponsesBody({
    model: "gpt-5.4-mini",
    messages: [{ role: "user", content: "今天新闻" }],
    reasoningLabel: "快速",
    useWebSearch: true,
  });

  assert.equal(withoutSearch.tools, undefined);
  assert.deepEqual(withSearch.tools, [{ type: "web_search" }]);
});

test("builds multimodal user content when a message has images", () => {
  const body = buildResponsesBody({
    model: "gpt-5.4-mini",
    messages: [
      {
        role: "user",
        content: "看看这张图",
        images: [{ dataUrl: "data:image/png;base64,abc123" }],
      },
    ],
    reasoningLabel: "均衡",
  });

  assert.deepEqual(body.input, [
    {
      role: "user",
      content: [
        { type: "input_text", text: "看看这张图" },
        { type: "input_image", image_url: "data:image/png;base64,abc123" },
      ],
    },
  ]);
});

test("extracts response text from message content type output_text", () => {
  assert.equal(
    extractResponseText({
      output: [
        {
          type: "message",
          content: [{ type: "output_text", text: "可以搜索到。" }],
        },
      ],
    }),
    "可以搜索到。"
  );
});

test("extracts text from common Responses API shapes", () => {
  assert.equal(extractResponseText({ output_text: "直接文本" }), "直接文本");
  assert.equal(
    extractResponseText({
      output: [
        {
          content: [{ type: "output_text", text: "嵌套文本" }],
        },
      ],
    }),
    "嵌套文本"
  );
});
