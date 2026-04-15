const fs = require('fs');
const path = require('path');

const HASH_FILE_PATH = path.join(__dirname, 'passwordHashes.json');
const hashStore = new Map();

function ensureHashFile() {
  if (!fs.existsSync(HASH_FILE_PATH)) {
    fs.writeFileSync(HASH_FILE_PATH, '{}', 'utf8');
  }
}

function loadHashesFromFile() {
  ensureHashFile();

  try {
    const content = fs.readFileSync(HASH_FILE_PATH, 'utf8');
    const parsed = JSON.parse(content || '{}');
    Object.entries(parsed).forEach(([userId, passwordHash]) => {
      if (typeof passwordHash === 'string') {
        hashStore.set(userId, passwordHash);
      }
    });
  } catch (error) {
    fs.writeFileSync(HASH_FILE_PATH, '{}', 'utf8');
    hashStore.clear();
  }
}

function saveHashesToFile() {
  const payload = Object.fromEntries(hashStore.entries());
  fs.writeFileSync(HASH_FILE_PATH, JSON.stringify(payload, null, 2), 'utf8');
}

function setPasswordHash(userId, passwordHash) {
  hashStore.set(userId, passwordHash);
  saveHashesToFile();
}

function getPasswordHash(userId) {
  return hashStore.get(userId) || null;
}

function removePasswordHash(userId) {
  hashStore.delete(userId);
  saveHashesToFile();
}

function clearPasswordHashes() {
  hashStore.clear();
  saveHashesToFile();
}

loadHashesFromFile();

module.exports = {
  setPasswordHash,
  getPasswordHash,
  removePasswordHash,
  clearPasswordHashes
};
