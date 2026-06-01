const REASONING_LABELS = {
  "快速": "low",
  "均衡": "medium",
  "深度": "high",
};

function normalizeBaseUrl(url) {
  return String(url || "").trim().replace(/\/+$/, "");
}

function responsesUrl(baseUrl) {
  return `${normalizeBaseUrl(baseUrl)}/responses`;
}

function reasoningEffortForLabel(label) {
  return REASONING_LABELS[label] || "medium";
}

function contentForMessage(message) {
  const images = Array.isArray(message.images) ? message.images.filter((image) => image?.dataUrl) : [];
  if (!images.length) {
    return message.content;
  }

  const content = [];
  if (message.content) {
    content.push({ type: "input_text", text: message.content });
  }
  for (const image of images) {
    content.push({ type: "input_image", image_url: image.dataUrl });
  }
  return content;
}

function buildResponsesBody({ model, messages, reasoningLabel, useWebSearch = false }) {
  const body = {
    model: String(model || "").trim(),
    input: messages.map((message) => ({
      role: message.role,
      content: contentForMessage(message),
    })),
    reasoning: {
      effort: reasoningEffortForLabel(reasoningLabel),
    },
  };

  if (useWebSearch) {
    body.tools = [{ type: "web_search" }];
  }

  return body;
}

function extractResponseText(payload) {
  if (typeof payload?.output_text === "string") {
    return payload.output_text;
  }

  const parts = [];
  for (const item of payload?.output || []) {
    for (const content of item.content || []) {
      if (typeof content.text === "string") {
        parts.push(content.text);
      }
    }
  }

  return parts.join("\n").trim();
}

module.exports = {
  normalizeBaseUrl,
  responsesUrl,
  reasoningEffortForLabel,
  buildResponsesBody,
  extractResponseText,
  contentForMessage,
};
