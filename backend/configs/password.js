import bcrypt from "bcryptjs";

// Centralised password hashing so the algorithm and cost factor live in one
// place. Registration, login, and seeding all go through these helpers.

const SALT_ROUNDS = 10;

export async function hashPassword(plainText) {
  return bcrypt.hash(plainText, SALT_ROUNDS);
}

export async function comparePassword(plainText, hash) {
  return bcrypt.compare(plainText, hash);
}
