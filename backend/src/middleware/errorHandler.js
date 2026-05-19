function errorHandler(err, req, res, next) {
  // In production, avoid logging full stack/query details to stdout where possible
  if (process.env.NODE_ENV === 'production') {
    console.error(`[ERROR] ${err.name || 'Error'}: ${err.message} (status=${err.status || err.statusCode || 500})`);
  } else {
    console.error(err);
  }

  // Prisma known request errors — map to safe, client-readable responses
  if (err.code === 'P2002') {
    return res.status(409).json({ error: 'Conflict', message: 'A record with that value already exists.' });
  }
  if (err.code === 'P2025') {
    return res.status(404).json({ error: 'Not Found', message: 'Record not found.' });
  }
  // P2003: foreign key constraint violation — the referenced record does not exist
  if (err.code === 'P2003') {
    return res.status(400).json({ error: 'Bad Request', message: 'Referenced record does not exist.' });
  }
  // P2023: malformed UUID or other invalid column data — treat as a client error (400)
  if (err.code === 'P2023') {
    return res.status(400).json({ error: 'Bad Request', message: 'Invalid ID format.' });
  }

  // Prisma client validation / initialization errors — never expose SQL/schema details
  if (err.name === 'PrismaClientValidationError' || err.name === 'PrismaClientInitializationError' || err.name === 'PrismaClientKnownRequestError') {
    return res.status(500).json({ error: 'Internal Server Error', message: 'A database error occurred.' });
  }

  const status = err.status || err.statusCode || 500;

  // For 5xx errors (unhandled exceptions), never expose raw messages to clients
  if (status >= 500) {
    return res.status(status).json({ error: 'Internal Server Error', message: 'An unexpected error occurred.' });
  }

  // For 4xx errors thrown by our own code with Object.assign({ status }), the message is intentionally safe
  const message = err.message || 'Error';
  const body = { error: 'Error', message };
  if (err.appCode) body.code = err.appCode;
  res.status(status).json(body);
}

module.exports = { errorHandler };
