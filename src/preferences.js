const DEFAULT_PREFERENCES = {
  language: "zh",
  theme: "light",
};

function normalizePreferences(preferences = {}) {
  const language = preferences.language === "en" ? "en" : "zh";
  const theme = preferences.theme === "dark" ? "dark" : "light";

  return { language, theme };
}

module.exports = {
  DEFAULT_PREFERENCES,
  normalizePreferences,
};
