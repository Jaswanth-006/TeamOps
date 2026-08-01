// Throw a 400 error if any required field is missing from the request body.
// Pairs with the central error handler, which turns the thrown error into a
// clean JSON 400 response.
export function requireFields(body, fields) {
  const missing = fields.filter((field) => {
    const value = body?.[field];
    return value === undefined || value === null || value === "";
  });

  if (missing.length > 0) {
    const error = new Error(`Missing required fields: ${missing.join(", ")}`);
    error.statusCode = 400;
    throw error;
  }
}
