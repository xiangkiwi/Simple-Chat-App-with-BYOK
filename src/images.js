const DEFAULT_IMAGES = {
  items: [],
};

function createId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

function titleFromPrompt(prompt) {
  const cleanPrompt = String(prompt || "").trim();
  return cleanPrompt ? cleanPrompt.slice(0, 48) : "Untitled image";
}

function normalizeImageUrl(url) {
  const value = String(url || "").trim();
  if (!value) {
    return "";
  }
  if (/^(https?:\/\/|data:image\/)/i.test(value)) {
    return value;
  }
  return `data:image/png;base64,${value}`;
}

function normalizeImageItem(item = {}) {
  return {
    id: String(item.id || createId()),
    title: String(item.title || titleFromPrompt(item.prompt)),
    prompt: String(item.prompt || ""),
    sourceImage: item.sourceImage?.dataUrl
      ? {
          name: String(item.sourceImage.name || "image"),
          type: String(item.sourceImage.type || ""),
          dataUrl: String(item.sourceImage.dataUrl),
        }
      : null,
    imageUrl: normalizeImageUrl(item.imageUrl),
    createdAt: String(item.createdAt || new Date().toISOString()),
    size: String(item.size || "1024x1024"),
    quality: String(item.quality || "standard"),
  };
}

function normalizeImages(images = DEFAULT_IMAGES) {
  const items = Array.isArray(images?.items) ? images.items : [];
  return {
    items: items.filter((item) => item?.imageUrl).map(normalizeImageItem),
  };
}

function addImage(images, image) {
  const nextItem = normalizeImageItem({
    id: createId(),
    title: titleFromPrompt(image.prompt),
    prompt: image.prompt,
    sourceImage: image.image?.dataUrl ? image.image : null,
    imageUrl: image.imageUrl,
    createdAt: new Date().toISOString(),
    size: image.size,
    quality: image.quality,
  });

  return {
    items: [nextItem, ...normalizeImages(images).items],
  };
}

function deleteImage(images, imageId) {
  return {
    items: normalizeImages(images).items.filter((item) => item.id !== imageId),
  };
}

function clearImages() {
  return DEFAULT_IMAGES;
}

module.exports = {
  DEFAULT_IMAGES,
  normalizeImages,
  addImage,
  deleteImage,
  clearImages,
  normalizeImageItem,
  normalizeImageUrl,
};
