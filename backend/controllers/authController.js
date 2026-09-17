import prisma from "../configs/prisma.js";
import { hashPassword, comparePassword } from "../configs/password.js";
import { signToken } from "../configs/jwt.js";
import { asyncHandler } from "../middlewares/asyncHandler.js";
import { requireFields } from "../utils/validate.js";

// Shape the user object returned to clients so the password hash never leaves
// the server.
function publicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    image: user.image,
  };
}

const ROLE_LABEL = { FACULTY: "faculty", STUDENT: "student" };

// Register a new account.
export const register = asyncHandler(async (req, res) => {
  requireFields(req.body, ["name", "email", "password"]);
  const { name, email, password } = req.body;
  const role = req.body.role === "FACULTY" ? "FACULTY" : "STUDENT";

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return res.status(409).json({ message: "Email is already registered" });
  }

  const user = await prisma.user.create({
    data: { name, email, role, password: await hashPassword(password) },
  });

  const token = signToken({ userId: user.id });
  res.status(201).json({ user: publicUser(user), token });
});

// Return the currently authenticated user, identified by their token.
export const getMe = asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.userId } });
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }
  res.json({ user: publicUser(user) });
});

// Log in with email and password, returning a signed token.
export const login = asyncHandler(async (req, res) => {
  requireFields(req.body, ["email", "password"]);
  const { email, password, role } = req.body;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await comparePassword(password, user.password))) {
    return res.status(401).json({ message: "Invalid email or password" });
  }

  // Keep the two portals separate: a faculty account can only sign in through the
  // faculty login, and a student account only through the student login.
  if (role && role !== user.role) {
    return res.status(403).json({
      message: `This is a ${ROLE_LABEL[user.role]} account. Please use the ${ROLE_LABEL[user.role]} login.`,
    });
  }

  const token = signToken({ userId: user.id });
  res.json({ user: publicUser(user), token });
});
