import { verifyToken } from "../configs/jwt.js";

// Auth contract for controllers
// -----------------------------
// After protect runs, a request exposes the current user two equivalent ways:
//   const { userId } = await req.auth();   // matches the previous auth provider
//   const userId = req.userId;             // direct access
//
// Controllers use `await req.auth()`, so protect is a drop-in replacement for the
// external provider that was here before and controller logic needs no changes.

// Guards protected routes. Reads the bearer token, verifies it, and attaches the
// user id to the request via both interfaces described above.
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
