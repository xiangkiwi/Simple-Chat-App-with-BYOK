const fs = require("node:fs");
const path = require("node:path");

function ensureParentDir(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function writeJson(filePath, value) {
  ensureParentDir(filePath);
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function readJson(filePath, defaultValue) {
  ensureParentDir(filePath);

  if (!fs.existsSync(filePath)) {
    writeJson(filePath, defaultValue);
    return defaultValue;
  }

  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (_error) {
    writeJson(filePath, defaultValue);
    return defaultValue;
  }
}

function readJsonIfExists(filePath, defaultValue) {
  if (!fs.existsSync(filePath)) {
    return defaultValue;
  }

  return readJson(filePath, defaultValue);
}

module.exports = {
  readJson,
  readJsonIfExists,
  writeJson,
};
