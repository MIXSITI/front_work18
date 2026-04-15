const fs = require('fs');
const path = require('path');

const TOKEN_FILE_PATH = path.join(__dirname, 'refreshTokens.json');
const refreshTokenStore = new Set();

function ensureTokenFile() {
  if (!fs.existsSync(TOKEN_FILE_PATH)) {
    fs.writeFileSync(TOKEN_FILE_PATH, '[]', 'utf8');
  }
}

function loadTokensFromFile() {
  ensureTokenFile();

  try {
    const content = fs.readFileSync(TOKEN_FILE_PATH, 'utf8');
    const parsed = JSON.parse(content || '[]');
    if (!Array.isArray(parsed)) {
      throw new Error('invalid format');
    }
    parsed.forEach((token) => {
      if (typeof token === 'string' && token.length > 0) {
        refreshTokenStore.add(token);
      }
    });
  } catch (error) {
    fs.writeFileSync(TOKEN_FILE_PATH, '[]', 'utf8');
    refreshTokenStore.clear();
  }
}

function saveTokensToFile() {
  const payload = Array.from(refreshTokenStore);
  fs.writeFileSync(TOKEN_FILE_PATH, JSON.stringify(payload, null, 2), 'utf8');
}

function addRefreshToken(token) {
  refreshTokenStore.add(token);
  saveTokensToFile();
}

function hasRefreshToken(token) {
  return refreshTokenStore.has(token);
}

function removeRefreshToken(token) {
  refreshTokenStore.delete(token);
  saveTokensToFile();
}

function clearRefreshTokens() {
  refreshTokenStore.clear();
  saveTokensToFile();
}

loadTokensFromFile();

module.exports = {
  addRefreshToken,
  hasRefreshToken,
  removeRefreshToken,
  clearRefreshTokens
};
