import prisma from "../configs/prisma.js";
import { hashPassword, comparePassword } from "../configs/password.js";
import { signToken } from "../configs/jwt.js";
import { asyncHandler } from "../middlewares/asyncHandler.js";

// Shape the user object returned to clients so the password hash never leaves
// the server.
function publicUser(user) {
  return { id: user.id, name: user.name, email: user.email, image: user.image };
}

// Register a new account.
export const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res
      .status(400)
      .json({ message: "name, email, and password are required" });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return res.status(409).json({ message: "Email is already registered" });
  }

  const user = await prisma.user.create({
    data: { name, email, password: await hashPassword(password) },
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
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "email and password are required" });
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await comparePassword(password, user.password))) {
    return res.status(401).json({ message: "Invalid email or password" });
  }

  const token = signToken({ userId: user.id });
  res.json({ user: publicUser(user), token });
});
