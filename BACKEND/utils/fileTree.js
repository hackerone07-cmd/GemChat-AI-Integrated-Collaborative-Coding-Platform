const encodeFileKey = (path = "") => Buffer.from(String(path), "utf8").toString("base64url");

const decodeFileKey = (key = "") => Buffer.from(String(key), "base64url").toString("utf8");

const normalizeFileEntry = (entry = {}) => ({
  content: entry?.content ?? "",
  lang: entry?.lang ?? "plaintext",
});

const encodeFileTree = (fileTree = {}) => {
  const encoded = {};
  for (const [path, entry] of Object.entries(fileTree || {})) {
    encoded[encodeFileKey(path)] = normalizeFileEntry(entry);
  }
  return encoded;
};

const decodeFileTree = (fileTree = {}) => {
  const decoded = {};
  for (const [key, entry] of Object.entries(fileTree || {})) {
    decoded[decodeFileKey(key)] = normalizeFileEntry(entry);
  }
  return decoded;
};

export {
  decodeFileKey,
  decodeFileTree,
  encodeFileKey,
  encodeFileTree,
  normalizeFileEntry,
};
