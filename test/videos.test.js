const test = require("node:test");
const assert = require("node:assert/strict");

const {
  DEFAULT_VIDEOS,
  normalizeVideos,
  addVideo,
  deleteVideo,
  clearVideos,
} = require("../src/videos");

test("normalizeVideos creates a clean empty history", () => {
  assert.deepEqual(normalizeVideos(), DEFAULT_VIDEOS);
});

test("addVideo stores newest video first with metadata", () => {
  const videos = addVideo(DEFAULT_VIDEOS, {
    prompt: "Make a portrait travel video",
    image: { name: "photo.png", dataUrl: "data:image/png;base64,abc" },
    videoUrl: "https://cdn.example.com/video.mp4",
    aspectRatio: "9:16",
    duration: "10",
    quality: "high",
  });

  assert.equal(videos.items.length, 1);
  assert.equal(videos.items[0].title, "Make a portrait travel video");
  assert.equal(videos.items[0].videoUrl, "https://cdn.example.com/video.mp4");
  assert.equal(videos.items[0].aspectRatio, "9:16");
  assert.equal(videos.items[0].sourceImage.name, "photo.png");
});

test("deleteVideo removes only the matching item", () => {
  const first = addVideo(DEFAULT_VIDEOS, {
    prompt: "First",
    videoUrl: "https://cdn.example.com/first.mp4",
  });
  const second = addVideo(first, {
    prompt: "Second",
    videoUrl: "https://cdn.example.com/second.mp4",
  });

  const deleted = deleteVideo(second, second.items[0].id);

  assert.equal(deleted.items.length, 1);
  assert.equal(deleted.items[0].prompt, "First");
});

test("clearVideos removes every history item", () => {
  const videos = addVideo(DEFAULT_VIDEOS, {
    prompt: "First",
    videoUrl: "https://cdn.example.com/first.mp4",
  });

  assert.deepEqual(clearVideos(videos), DEFAULT_VIDEOS);
});
