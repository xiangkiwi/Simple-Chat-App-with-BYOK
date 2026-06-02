const test = require("node:test");
const assert = require("node:assert/strict");

const {
  normalizeVideoConfig,
  videoGenerateUrl,
  extractVideoUrl,
  buildVideoRequestBody,
} = require("../src/videoApi");

test("normalizeVideoConfig trims video settings", () => {
  assert.deepEqual(
    normalizeVideoConfig({
      apiUrl: " https://video.example.com/v1/ ",
      apiKey: " key ",
      model: " video-model ",
    }),
    {
      apiUrl: "https://video.example.com/v1",
      apiKey: "key",
      model: "video-model",
    }
  );
});

test("videoGenerateUrl appends generate endpoint", () => {
  assert.equal(videoGenerateUrl("https://video.example.com/v1/"), "https://video.example.com/v1/generate");
});

test("extractVideoUrl supports common direct response fields", () => {
  assert.equal(extractVideoUrl({ video_url: "https://cdn.example.com/a.mp4" }), "https://cdn.example.com/a.mp4");
  assert.equal(extractVideoUrl({ videoUrl: "https://cdn.example.com/b.mp4" }), "https://cdn.example.com/b.mp4");
  assert.equal(extractVideoUrl({ url: "https://cdn.example.com/c.mp4" }), "https://cdn.example.com/c.mp4");
  assert.equal(extractVideoUrl({ output_url: "https://cdn.example.com/d.mp4" }), "https://cdn.example.com/d.mp4");
});

test("extractVideoUrl supports nested output response fields", () => {
  assert.equal(
    extractVideoUrl({ output: { video_url: "https://cdn.example.com/nested.mp4" } }),
    "https://cdn.example.com/nested.mp4"
  );
  assert.equal(
    extractVideoUrl({ data: [{ url: "https://cdn.example.com/list.mp4" }] }),
    "https://cdn.example.com/list.mp4"
  );
});

test("buildVideoRequestBody keeps text image and generation options", () => {
  assert.deepEqual(
    buildVideoRequestBody({
      model: "video-model",
      prompt: "A calm beach sunrise",
      image: { dataUrl: "data:image/png;base64,abc", type: "image/png" },
      aspectRatio: "9:16",
      duration: "10",
      quality: "high",
    }),
    {
      model: "video-model",
      prompt: "A calm beach sunrise",
      image: "data:image/png;base64,abc",
      aspect_ratio: "9:16",
      duration: "10",
      quality: "high",
    }
  );
});
