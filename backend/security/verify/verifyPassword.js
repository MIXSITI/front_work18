const bcrypt = require('bcrypt');

async function verifyPassword(password, passwordHash) {
  return bcrypt.compare(password, passwordHash);
}

module.exports = verifyPassword;
