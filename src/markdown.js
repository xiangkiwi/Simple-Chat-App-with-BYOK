const MarkdownIt = require("markdown-it");

const markdown = new MarkdownIt({
  html: false,
  linkify: true,
  breaks: true,
});

const defaultLinkOpen =
  markdown.renderer.rules.link_open ||
  function renderLinkOpen(tokens, index, options, env, self) {
    return self.renderToken(tokens, index, options);
  };

markdown.renderer.rules.link_open = function linkOpen(tokens, index, options, env, self) {
  const token = tokens[index];
  token.attrSet("target", "_blank");
  token.attrSet("rel", "noreferrer");
  return defaultLinkOpen(tokens, index, options, env, self);
};

function renderMarkdown(value) {
  return markdown.render(String(value || ""));
}

module.exports = { renderMarkdown };
