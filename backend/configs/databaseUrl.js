// Single source of the database connection string.
//
// This is the seam between local development and cloud deployment. Right now it
// reads DATABASE_URL from the environment. When the app runs on AWS, this is the
// only place that changes: instead of reading the environment, it will fetch the
// credentials from AWS Secrets Manager and assemble the URL here. Nothing else in
// the codebase reads the connection string directly, so that migration stays
// contained to this one file.
//
// Future (AWS) shape:
//   const secret = await getSecret(process.env.DB_SECRET_NAME);
//   return `postgresql://${secret.username}:${secret.password}` +
//          `@${secret.host}:${secret.port}/${secret.dbname}?schema=public`;

export function getDatabaseUrl() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set");
  }
  return url;
}
