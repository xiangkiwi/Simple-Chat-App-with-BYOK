const test = require("node:test");
const assert = require("node:assert/strict");

const {
  normalizeImageConfig,
  imageGenerateUrl,
  assertAbsoluteImageApiUrl,
  extractImageUrl,
  summarizeImageResponse,
  buildImageRequestBody,
} = require("../src/imageApi");

test("normalizeImageConfig trims image settings", () => {
  assert.deepEqual(
    normalizeImageConfig({
      apiUrl: " https://image.example.com/v1/ ",
      apiKey: " key ",
      model: " image-model ",
    }),
    {
      apiUrl: "https://image.example.com/v1",
      apiKey: "key",
      model: "image-model",
    }
  );
});

test("imageGenerateUrl appends generate endpoint", () => {
  assert.equal(imageGenerateUrl("https://image.example.com/v1/"), "https://image.example.com/v1/generate");
});

test("imageGenerateUrl keeps full chat completions endpoint unchanged", () => {
  assert.equal(
    imageGenerateUrl("https://image.example.com/v1/chat/completions/"),
    "https://image.example.com/v1/chat/completions"
  );
});

test("imageGenerateUrl keeps full responses endpoint unchanged", () => {
  assert.equal(
    imageGenerateUrl("https://image.example.com/v1/responses/"),
    "https://image.example.com/v1/responses"
  );
});

test("assertAbsoluteImageApiUrl rejects relative endpoints with a helpful message", () => {
  assert.throws(
    () => assertAbsoluteImageApiUrl("/v1/chat/completions"),
    /Please enter the full Image API URL/
  );
});

test("buildImageRequestBody keeps prompt model size quality and optional image", () => {
  assert.deepEqual(
    buildImageRequestBody({
      model: "image-model",
      prompt: "A warm watercolor portrait",
      image: { dataUrl: "data:image/png;base64,abc", type: "image/png" },
      size: "1024x1024",
      quality: "high",
    }),
    {
      model: "image-model",
      prompt: "A warm watercolor portrait",
      size: "1024x1024",
      quality: "high",
      image: "data:image/png;base64,abc",
    }
  );
});

test("buildImageRequestBody uses simple chat completions text format without reference image", () => {
  assert.deepEqual(
    buildImageRequestBody({
      apiUrl: "https://image.example.com/v1/chat/completions",
      model: "image-model",
      prompt: "A warm watercolor portrait",
      size: "1024x1024",
      quality: "high",
    }),
    {
      model: "image-model",
      stream: false,
      messages: [
        {
          role: "user",
          content: "A warm watercolor portrait\n\nImage size: 1024x1024\nQuality: high",
        },
      ],
    }
  );
});

test("buildImageRequestBody uses multimodal chat completions format with reference image", () => {
  assert.deepEqual(
    buildImageRequestBody({
      apiUrl: "https://image.example.com/v1/chat/completions",
      model: "image-model",
      prompt: "A warm watercolor portrait",
      image: { dataUrl: "data:image/png;base64,abc", type: "image/png" },
      size: "1024x1024",
      quality: "high",
    }),
    {
      model: "image-model",
      stream: false,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: "A warm watercolor portrait\n\nImage size: 1024x1024\nQuality: high" },
            { type: "image_url", image_url: { url: "data:image/png;base64,abc" } },
          ],
        },
      ],
    }
  );
});

test("buildImageRequestBody uses Responses API input format for responses endpoint", () => {
  assert.deepEqual(
    buildImageRequestBody({
      apiUrl: "https://image.example.com/v1/responses",
      model: "gpt-image-2",
      prompt: "A warm watercolor portrait",
      size: "1024x1024",
      quality: "high",
    }),
    {
      model: "gpt-image-2",
      input: [
        {
          role: "user",
          content: "A warm watercolor portrait\n\nImage size: 1024x1024\nQuality: high",
        },
      ],
    }
  );
});

test("buildImageRequestBody supports reference image with Responses API input format", () => {
  assert.deepEqual(
    buildImageRequestBody({
      apiUrl: "https://image.example.com/v1/responses",
      model: "gpt-image-2",
      prompt: "A warm watercolor portrait",
      image: { dataUrl: "data:image/png;base64,abc", type: "image/png" },
      size: "1024x1024",
      quality: "high",
    }),
    {
      model: "gpt-image-2",
      input: [
        {
          role: "user",
          content: [
            { type: "input_text", text: "A warm watercolor portrait\n\nImage size: 1024x1024\nQuality: high" },
            { type: "input_image", image_url: "data:image/png;base64,abc" },
          ],
        },
      ],
    }
  );
});

test("extractImageUrl supports common direct response fields", () => {
  assert.equal(extractImageUrl({ image_url: "https://cdn.example.com/a.png" }), "https://cdn.example.com/a.png");
  assert.equal(extractImageUrl({ imageUrl: "https://cdn.example.com/b.png" }), "https://cdn.example.com/b.png");
  assert.equal(extractImageUrl({ url: "https://cdn.example.com/c.png" }), "https://cdn.example.com/c.png");
  assert.equal(extractImageUrl({ output_url: "https://cdn.example.com/d.png" }), "https://cdn.example.com/d.png");
});

test("extractImageUrl supports base64 and markdown image output", () => {
  assert.equal(extractImageUrl({ b64_json: "abc123" }), "data:image/png;base64,abc123");
  assert.equal(
    extractImageUrl({ text: "Here is it: ![result](https://cdn.example.com/result.png)" }),
    "https://cdn.example.com/result.png"
  );
});

test("extractImageUrl supports Responses API image generation result data", () => {
  assert.equal(
    extractImageUrl({
      output: [
        {
          type: "image_generation_call",
          result: "abc123def456ghi789jkl012",
        },
      ],
    }),
    "data:image/png;base64,abc123def456ghi789jkl012"
  );
});

test("extractImageUrl supports bare image URLs in text content", () => {
  assert.equal(
    extractImageUrl({ text: "Generated: https://cdn.example.com/result.webp" }),
    "https://cdn.example.com/result.webp"
  );
});

test("extractImageUrl supports JSON strings returned inside chat content", () => {
  assert.equal(
    extractImageUrl({
      choices: [
        {
          message: {
            content: "{\"image\":\"https://cdn.example.com/from-json.png\"}",
          },
        },
      ],
    }),
    "https://cdn.example.com/from-json.png"
  );
});

test("extractImageUrl supports image fields and nested result objects", () => {
  assert.equal(extractImageUrl({ image: "https://cdn.example.com/image-field.png" }), "https://cdn.example.com/image-field.png");
  assert.equal(
    extractImageUrl({ result: { image: { url: "https://cdn.example.com/nested-result.jpg" } } }),
    "https://cdn.example.com/nested-result.jpg"
  );
});

test("extractImageUrl supports nested chat-completions style content", () => {
  assert.equal(
    extractImageUrl({
      choices: [
        {
          message: {
            content: "![generated](data:image/png;base64,xyz)",
          },
        },
      ],
    }),
    "data:image/png;base64,xyz"
  );
  assert.equal(
    extractImageUrl({ data: [{ b64_json: "nested123" }] }),
    "data:image/png;base64,nested123"
  );
});

test("extractImageUrl supports chat-completions content arrays with image parts", () => {
  assert.equal(
    extractImageUrl({
      choices: [
        {
          message: {
            content: [
              { type: "text", text: "done" },
              { type: "image_url", image_url: { url: "https://cdn.example.com/final.png" } },
            ],
          },
        },
      ],
    }),
    "https://cdn.example.com/final.png"
  );
});

test("extractImageUrl recursively searches unknown nested response shapes", () => {
  assert.equal(
    extractImageUrl({
      weird: {
        provider: {
          payload: {
            asset: {
              signedUrl: "https://cdn.example.com/deep-image.png",
            },
          },
        },
      },
    }),
    "https://cdn.example.com/deep-image.png"
  );
});

test("summarizeImageResponse returns a safe compact response preview", () => {
  const summary = summarizeImageResponse({
    id: "chatcmpl_123",
    choices: [{ message: { content: "plain text without image" } }],
    request: { apiKey: "fake-secret-value" },
    image: "data:image/png;base64,abcdefghijklmnopqrstuvwxyz",
  });

  assert.match(summary, /chatcmpl_123/);
  assert.match(summary, /\[data:image\/png;base64 omitted\]/);
  assert.doesNotMatch(summary, /fake-secret-value/);
  assert.doesNotMatch(summary, /abcdefghijklmnopqrstuvwxyz/);
});
