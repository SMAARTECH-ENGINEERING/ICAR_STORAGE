const { v4: uuidv4 } = require('uuid');

function generateId(prefix) {
  const unique = uuidv4().split('-')[0].toUpperCase();
  return prefix ? `${prefix}-${unique}` : unique;
}

module.exports = { generateId };
