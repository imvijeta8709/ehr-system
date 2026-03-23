const { validationResult } = require('express-validator');

/**
 * Middleware: run after express-validator chains.
 * Returns 400 with first error message if validation fails.
 */
module.exports = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const msg = errors.array()[0].msg;
    return res.status(400).json({ success: false, message: msg, errors: errors.array() });
  }
  next();
};
