const DEFAULT_IMAGE_CONFIG = {
  apiUrl: "",
  apiKey: "",
  model: "",
};

function normalizeBaseUrl(url) {
  return String(url || "").trim().replace(/\/+$/, "");
}

function normalizeImageConfig(config = {}) {
  return {
    apiUrl: normalizeBaseUrl(config.apiUrl),
    apiKey: String(config.apiKey || "").trim(),
    model: String(config.model || "").trim(),
  };
}

function imageGenerateUrl(baseUrl) {
  const cleanUrl = normalizeBaseUrl(baseUrl);
  if (isChatCompletionsUrl(cleanUrl) || isResponsesUrl(cleanUrl)) {
    return cleanUrl;
  }
  return `${cleanUrl}/generate`;
}

function assertAbsoluteImageApiUrl(apiUrl) {
  if (!/^https?:\/\//i.test(String(apiUrl || "").trim())) {
    throw new Error("Please enter the full Image API URL, for example https://api.example.com/v1/chat/completions.");
  }
}

function firstString(...values) {
  return values.find((value) => typeof value === "string" && value.trim()) || "";
}

function looksLikeImageGenerationCall(payload) {
  return payload?.type === "image_generation_call";
}

function normalizeImageResult(value, options = {}) {
  const text = String(value || "").trim();
  if (!text) {
    return "";
  }
  if (/^data:image\//i.test(text) || /^https?:\/\//i.test(text)) {
    return text;
  }
  if (options.assumeBase64) {
    return `data:image/png;base64,${text}`;
  }
  return text;
}

function extractMarkdownImage(text) {
  const input = String(text || "");
  const match = input.match(/!\[[^\]]*]\(([^)]+)\)/);
  return match ? match[1].trim() : "";
}

function extractBareUrl(text) {
  const input = String(text || "");
  const match = input.match(/https?:\/\/[^\s"'<>]+/i);
  return match ? match[0].trim() : "";
}

function extractUrlFromJsonString(text) {
  const input = String(text || "").trim();
  if (!input.startsWith("{") && !input.startsWith("[")) {
    return "";
  }

  try {
    return extractImageUrl(JSON.parse(input));
  } catch (_error) {
    return "";
  }
}

function extractImageUrl(payload) {
  if (!payload || typeof payload !== "object") {
    return "";
  }

  if (Array.isArray(payload)) {
    for (const item of payload) {
      const nested = extractImageUrl(item);
      if (nested) {
        return nested;
      }
    }
    return "";
  }

  const direct = firstString(
    typeof payload.image_url === "object" ? payload.image_url.url : payload.image_url,
    typeof payload.imageUrl === "object" ? payload.imageUrl.url : payload.imageUrl,
    payload.url,
    payload.output_url
  );
  if (direct) {
    return direct.trim();
  }

  if (firstString(payload.b64_json)) {
    return `data:image/png;base64,${payload.b64_json.trim()}`;
  }

  if (looksLikeImageGenerationCall(payload) && firstString(payload.result)) {
    return normalizeImageResult(payload.result, { assumeBase64: true });
  }

  if (typeof payload.text === "string") {
    const markdown = extractMarkdownImage(payload.text);
    if (markdown) {
      return markdown;
    }
    const bareUrl = extractBareUrl(payload.text);
    if (bareUrl) {
      return bareUrl;
    }
    const jsonUrl = extractUrlFromJsonString(payload.text);
    if (jsonUrl) {
      return jsonUrl;
    }
  }

  if (typeof payload.content === "string") {
    const markdown = extractMarkdownImage(payload.content);
    if (markdown) {
      return markdown;
    }
    const bareUrl = extractBareUrl(payload.content);
    if (bareUrl) {
      return bareUrl;
    }
    const jsonUrl = extractUrlFromJsonString(payload.content);
    if (jsonUrl) {
      return jsonUrl;
    }
  }

  if (Array.isArray(payload.content)) {
    const nested = extractImageUrl(payload.content);
    if (nested) {
      return nested;
    }
  }

  if (Array.isArray(payload.choices)) {
    for (const choice of payload.choices) {
      const nested = extractImageUrl(choice?.message || choice?.content || choice);
      if (nested) {
        return nested;
      }
    }
  }

  if (payload.output && typeof payload.output === "object" && !Array.isArray(payload.output)) {
    const nested = extractImageUrl(payload.output);
    if (nested) {
      return nested;
    }
  }

  for (const key of ["image", "result"]) {
    if (typeof payload[key] === "string") {
      const direct = firstString(payload[key]);
      if (direct) {
        return direct.trim();
      }
      const jsonUrl = extractUrlFromJsonString(payload[key]);
      if (jsonUrl) {
        return jsonUrl;
      }
      const bareUrl = extractBareUrl(payload[key]);
      if (bareUrl) {
        return bareUrl;
      }
    }
    if (payload[key] && typeof payload[key] === "object") {
      const nested = extractImageUrl(payload[key]);
      if (nested) {
        return nested;
      }
    }
  }

  for (const key of ["data", "output", "result", "results"]) {
    if (Array.isArray(payload[key])) {
      for (const item of payload[key]) {
        const nested = extractImageUrl(item);
        if (nested) {
          return nested;
        }
      }
    }
  }

  for (const value of Object.values(payload)) {
    if (typeof value === "string") {
      const jsonUrl = extractUrlFromJsonString(value);
      if (jsonUrl) {
        return jsonUrl;
      }
      const bareUrl = extractBareUrl(value);
      if (bareUrl) {
        return bareUrl;
      }
    }
    if (value && typeof value === "object") {
      const nested = extractImageUrl(value);
      if (nested) {
        return nested;
      }
    }
  }

  return "";
}

function sanitizeForSummary(value, key = "") {
  if (typeof value === "string") {
    if (/api[_-]?key|authorization|token|secret|password/i.test(key) || /^sk-[A-Za-z0-9_-]+/.test(value)) {
      return "[redacted]";
    }
    if (value.startsWith("data:image/")) {
      return "[data:image/png;base64 omitted]";
    }
    return value.length > 260 ? `${value.slice(0, 260)}... [truncated]` : value;
  }

  if (Array.isArray(value)) {
    return value.slice(0, 4).map((item) => sanitizeForSummary(item));
  }

  if (value && typeof value === "object") {
    const result = {};
    for (const [childKey, childValue] of Object.entries(value).slice(0, 16)) {
      result[childKey] = sanitizeForSummary(childValue, childKey);
    }
    return result;
  }

  return value;
}

function summarizeImageResponse(payload) {
  return JSON.stringify(sanitizeForSummary(payload), null, 2).slice(0, 1600);
}

function isChatCompletionsUrl(apiUrl) {
  return /\/chat\/completions$/i.test(normalizeBaseUrl(apiUrl));
}

function isResponsesUrl(apiUrl) {
  return /\/responses$/i.test(normalizeBaseUrl(apiUrl));
}

function buildChatCompletionsImageBody({ model, prompt, image, size, quality }) {
  const text = `${String(prompt || "").trim()}\n\nImage size: ${String(size || "1024x1024")}\nQuality: ${String(quality || "standard")}`;
  const message = {
    role: "user",
    content: text,
  };

  if (image?.dataUrl) {
    message.content = [
      { type: "text", text },
      {
        type: "image_url",
        image_url: { url: image.dataUrl },
      },
    ];
  }

  return {
    model: String(model || "").trim(),
    stream: false,
    messages: [message],
  };
}

function buildResponsesImageBody({ model, prompt, image, size, quality }) {
  const text = `${String(prompt || "").trim()}\n\nImage size: ${String(size || "1024x1024")}\nQuality: ${String(quality || "standard")}`;
  const message = {
    role: "user",
    content: text,
  };

  if (image?.dataUrl) {
    message.content = [
      { type: "input_text", text },
      { type: "input_image", image_url: image.dataUrl },
    ];
  }

  return {
    model: String(model || "").trim(),
    input: [message],
  };
}

function buildImageRequestBody({ apiUrl, model, prompt, image, size, quality }) {
  if (isResponsesUrl(apiUrl)) {
    return buildResponsesImageBody({ model, prompt, image, size, quality });
  }

  if (isChatCompletionsUrl(apiUrl)) {
    return buildChatCompletionsImageBody({ model, prompt, image, size, quality });
  }

  const body = {
    model: String(model || "").trim(),
    prompt: String(prompt || "").trim(),
    size: String(size || "1024x1024"),
    quality: String(quality || "standard"),
  };

  if (image?.dataUrl) {
    body.image = image.dataUrl;
  }

  return body;
}

module.exports = {
  DEFAULT_IMAGE_CONFIG,
  normalizeBaseUrl,
  normalizeImageConfig,
  imageGenerateUrl,
  assertAbsoluteImageApiUrl,
  isChatCompletionsUrl,
  isResponsesUrl,
  extractImageUrl,
  summarizeImageResponse,
  buildImageRequestBody,
};
