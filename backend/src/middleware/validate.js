const { validationResult } = require('express-validator');

function validate(schemas) {
  return async (req, res, next) => {
    for (const schema of schemas) {
      await schema.run(req);
    }
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ error: 'Validation Error', errors: errors.array() });
    }
    next();
  };
}

module.exports = { validate };
