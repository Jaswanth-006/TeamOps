import { PrismaClient } from "@prisma/client";

// A single shared PrismaClient for the whole app. Each client manages its own
// pool of database connections, so creating one per request or per module would
// quickly exhaust the database connection limit. The global guard keeps a single
// instance across hot-reloads in development.
const prisma = global.prisma || new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  global.prisma = prisma;
}

export default prisma;
