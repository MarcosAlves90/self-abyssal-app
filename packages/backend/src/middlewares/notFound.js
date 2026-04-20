function notFound(request, response) {
  response.status(404).json({
    message: "Resource not found."
  });
}

module.exports = { notFound };
