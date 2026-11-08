// bcrypt учитывает только первые 72 байта пароля
function validatePassword(password) {
  return typeof password === 'string'
    && password.length >= 8
    && Buffer.byteLength(password) <= 72;
}

const validateUsername = (username) => username.length >= 3 && username.length <= 50;

module.exports = { validatePassword, validateUsername };
