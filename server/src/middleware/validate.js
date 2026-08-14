const ApiError = require('../utils/ApiError');

function validate(schema, property = 'body') {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false,
      stripUnknown: false,
    });

    if (error) {
      const details = error.details.map((d) => d.message);
      return next(ApiError.badRequest('Validation failed', 'VALIDATION_ERROR', details));
    }

    req[property] = value;
    return next();
  };
}

module.exports = validate;
