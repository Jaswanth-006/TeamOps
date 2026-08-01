import { verifyToken } from "../configs/jwt.js";

// Guards protected routes. Reads the bearer token, verifies it, and attaches the
// user id to the request. It also exposes req.auth() returning { userId } so
// controllers can read the current user through a single, stable interface.
export const protect = (req, res, next) => {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;

    if (!token) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { userId } = verifyToken(token);
    req.userId = userId;
    req.auth = () => ({ userId });

    return next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};
