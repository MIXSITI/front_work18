const credentialStore = new Map();

function setCredential(email, userId) {
  credentialStore.set(email, userId);
}

function getUserIdByEmail(email) {
  return credentialStore.get(email) || null;
}

function removeCredential(email) {
  credentialStore.delete(email);
}

function updateCredential(oldEmail, nextEmail, userId) {
  if (oldEmail !== nextEmail) {
    credentialStore.delete(oldEmail);
  }
  credentialStore.set(nextEmail, userId);
}

function clearCredentials() {
  credentialStore.clear();
}

module.exports = {
  setCredential,
  getUserIdByEmail,
  removeCredential,
  updateCredential,
  clearCredentials
};
