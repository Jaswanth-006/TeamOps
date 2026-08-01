// Central error handler. Any error passed to next(err) lands here and becomes a
// clean JSON response, so controllers never repeat try/catch/500 boilerplate.
// Must be registered after all routes.
export const errorHandler = (err, req, res, next) => {
  console.error(err);
  const status = err.statusCode || 500;
  res.status(status).json({ message: err.message || "Internal server error" });
};
