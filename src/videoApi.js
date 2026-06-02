const DEFAULT_VIDEO_CONFIG = {
  apiUrl: "",
  apiKey: "",
  model: "",
};

function normalizeBaseUrl(url) {
  return String(url || "").trim().replace(/\/+$/, "");
}

function normalizeVideoConfig(config = {}) {
  return {
    apiUrl: normalizeBaseUrl(config.apiUrl),
    apiKey: String(config.apiKey || "").trim(),
    model: String(config.model || "").trim(),
  };
}

function videoGenerateUrl(baseUrl) {
  return `${normalizeBaseUrl(baseUrl)}/generate`;
}

function firstString(...values) {
  return values.find((value) => typeof value === "string" && value.trim()) || "";
}

function extractVideoUrl(payload) {
  if (!payload || typeof payload !== "object") {
    return "";
  }

  const direct = firstString(payload.video_url, payload.videoUrl, payload.url, payload.output_url);
  if (direct) {
    return direct.trim();
  }

  if (payload.output && typeof payload.output === "object" && !Array.isArray(payload.output)) {
    const nested = extractVideoUrl(payload.output);
    if (nested) {
      return nested;
    }
  }

  for (const key of ["data", "output", "result", "results"]) {
    if (Array.isArray(payload[key])) {
      for (const item of payload[key]) {
        const nested = extractVideoUrl(item);
        if (nested) {
          return nested;
        }
      }
    }
  }

  return "";
}

function buildVideoRequestBody({ model, prompt, image, aspectRatio, duration, quality }) {
  const body = {
    model: String(model || "").trim(),
    prompt: String(prompt || "").trim(),
    aspect_ratio: String(aspectRatio || "9:16"),
    duration: String(duration || "5"),
    quality: String(quality || "standard"),
  };

  if (image?.dataUrl) {
    body.image = image.dataUrl;
  }

  return body;
}

module.exports = {
  DEFAULT_VIDEO_CONFIG,
  normalizeBaseUrl,
  normalizeVideoConfig,
  videoGenerateUrl,
  extractVideoUrl,
  buildVideoRequestBody,
};
