import { PrismaClient } from "@prisma/client";
import { getDatabaseUrl } from "./databaseUrl.js";

// A single shared PrismaClient for the whole app. Each client manages its own
// pool of database connections, so creating one per request or per module would
// quickly exhaust the database connection limit. The global guard keeps a single
// instance across hot-reloads in development.
//
// The connection string is loaded from local environment variables or AWS
// Secrets Manager by the runtime configuration module.
const prisma =
  global.prisma ||
  new PrismaClient({
    datasources: { db: { url: getDatabaseUrl() } },
  });

if (process.env.NODE_ENV !== "production") {
  global.prisma = prisma;
}

export default prisma;
