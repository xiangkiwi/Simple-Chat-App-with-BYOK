const test = require("node:test");
const assert = require("node:assert/strict");

const {
  DEFAULT_IMAGES,
  normalizeImages,
  addImage,
  deleteImage,
  clearImages,
} = require("../src/images");

test("normalizeImages creates a clean empty history", () => {
  assert.deepEqual(normalizeImages(), DEFAULT_IMAGES);
});

test("normalizeImages keeps only items with imageUrl", () => {
  const images = normalizeImages({
    items: [
      { prompt: "Missing URL" },
      {
        id: "known",
        title: "Portrait",
        prompt: "Portrait",
        imageUrl: "https://cdn.example.com/portrait.png",
        sourceImage: { name: "ref.png", dataUrl: "data:image/png;base64,abc" },
      },
    ],
  });

  assert.equal(images.items.length, 1);
  assert.equal(images.items[0].id, "known");
  assert.equal(images.items[0].sourceImage.name, "ref.png");
});

test("normalizeImages repairs legacy bare base64 image history", () => {
  const images = normalizeImages({
    items: [
      {
        prompt: "Legacy generated image",
        imageUrl: "abc123def456ghi789jkl012",
      },
    ],
  });

  assert.equal(images.items[0].imageUrl, "data:image/png;base64,abc123def456ghi789jkl012");
});

test("addImage stores newest image first with metadata", () => {
  const images = addImage(DEFAULT_IMAGES, {
    prompt: "Make a soft portrait",
    image: { name: "photo.png", dataUrl: "data:image/png;base64,abc" },
    imageUrl: "https://cdn.example.com/image.png",
    size: "1024x1024",
    quality: "high",
  });

  assert.equal(images.items.length, 1);
  assert.equal(images.items[0].title, "Make a soft portrait");
  assert.equal(images.items[0].imageUrl, "https://cdn.example.com/image.png");
  assert.equal(images.items[0].size, "1024x1024");
  assert.equal(images.items[0].sourceImage.name, "photo.png");
});

test("deleteImage removes only the matching item", () => {
  const first = addImage(DEFAULT_IMAGES, {
    prompt: "First",
    imageUrl: "https://cdn.example.com/first.png",
  });
  const second = addImage(first, {
    prompt: "Second",
    imageUrl: "https://cdn.example.com/second.png",
  });

  const deleted = deleteImage(second, second.items[0].id);

  assert.equal(deleted.items.length, 1);
  assert.equal(deleted.items[0].prompt, "First");
});

test("clearImages removes every history item", () => {
  const images = addImage(DEFAULT_IMAGES, {
    prompt: "First",
    imageUrl: "https://cdn.example.com/first.png",
  });

  assert.deepEqual(clearImages(images), DEFAULT_IMAGES);
});
