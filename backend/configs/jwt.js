import jwt from "jsonwebtoken";

// Token helpers. The secret signs every token, so anyone holding it can forge a
// token for any user — it must come from the environment and never be hardcoded.

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = "7d";

export function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}
