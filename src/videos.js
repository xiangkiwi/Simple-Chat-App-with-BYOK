const DEFAULT_VIDEOS = {
  items: [],
};

function createId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

function titleFromPrompt(prompt) {
  const cleanPrompt = String(prompt || "").trim();
  return cleanPrompt ? cleanPrompt.slice(0, 48) : "Untitled video";
}

function normalizeVideoItem(item = {}) {
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
    videoUrl: String(item.videoUrl || ""),
    createdAt: String(item.createdAt || new Date().toISOString()),
    aspectRatio: String(item.aspectRatio || "9:16"),
    duration: String(item.duration || "5"),
    quality: String(item.quality || "standard"),
  };
}

function normalizeVideos(videos = DEFAULT_VIDEOS) {
  const items = Array.isArray(videos?.items) ? videos.items : [];
  return {
    items: items.filter((item) => item?.videoUrl).map(normalizeVideoItem),
  };
}

function addVideo(videos, video) {
  const nextItem = normalizeVideoItem({
    id: createId(),
    title: titleFromPrompt(video.prompt),
    prompt: video.prompt,
    sourceImage: video.image?.dataUrl ? video.image : null,
    videoUrl: video.videoUrl,
    createdAt: new Date().toISOString(),
    aspectRatio: video.aspectRatio,
    duration: video.duration,
    quality: video.quality,
  });

  return {
    items: [nextItem, ...normalizeVideos(videos).items],
  };
}

function deleteVideo(videos, videoId) {
  return {
    items: normalizeVideos(videos).items.filter((item) => item.id !== videoId),
  };
}

function clearVideos() {
  return DEFAULT_VIDEOS;
}

module.exports = {
  DEFAULT_VIDEOS,
  normalizeVideos,
  addVideo,
  deleteVideo,
  clearVideos,
  normalizeVideoItem,
};
