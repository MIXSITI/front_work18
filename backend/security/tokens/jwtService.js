const jwt = require('jsonwebtoken');
const { nanoid } = require('nanoid');

function createJwtService({
  accessSecret,
  refreshSecret,
  accessExpiresIn,
  refreshExpiresIn
}) {
  function buildTokenPayload(user) {
    return {
      sub: user.id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      role: user.role
    };
  }

  return {
    generateAccessToken(user) {
      return jwt.sign(
        buildTokenPayload(user),
        accessSecret,
        { expiresIn: accessExpiresIn }
      );
    },
    generateRefreshToken(user) {
      return jwt.sign(
        buildTokenPayload(user),
        refreshSecret,
        {
          expiresIn: refreshExpiresIn,
          jwtid: nanoid(12)
        }
      );
    },
    verifyAccessToken(token) {
      return jwt.verify(token, accessSecret);
    },
    verifyRefreshToken(token) {
      return jwt.verify(token, refreshSecret);
    },
    extractBearerToken(headerValue = '') {
      const [scheme, token] = headerValue.split(' ');
      return scheme === 'Bearer' && token ? token : null;
    }
  };
}

module.exports = createJwtService;
