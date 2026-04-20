const { HttpError } = require("../shared/httpError");

function errorHandler(error, request, response, next) {
  const handledError =
    error instanceof HttpError
      ? error
      : new HttpError(500, "Unexpected internal error.");

  if (!(error instanceof HttpError)) {
    console.error("[error]", {
      method: request.method,
      path: request.originalUrl,
      message: error.message
    });
  }

  response.status(handledError.statusCode).json({
    message: handledError.message,
    details: handledError.details
  });
}

module.exports = { errorHandler };
