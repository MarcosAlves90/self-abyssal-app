const { HttpError } = require("../shared/httpError");

function validateRequest(schema) {
  return function schemaValidator(request, response, next) {
    const result = schema.safeParse({
      body: request.body,
      params: request.params,
      query: request.query
    });

    if (!result.success) {
      return next(
        new HttpError(
          400,
          "Invalid request payload.",
          result.error.flatten()
        )
      );
    }

    request.validated = result.data;
    return next();
  };
}

module.exports = { validateRequest };
