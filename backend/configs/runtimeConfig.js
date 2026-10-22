import "dotenv/config";

if (process.env.DB_SECRET_NAME) {
  const { GetSecretValueCommand, SecretsManagerClient } = await import(
    "@aws-sdk/client-secrets-manager"
  );
  const region = process.env.AWS_REGION || process.env.REGION;
  if (!region) {
    throw new Error("AWS_REGION or REGION is required to load the database secret");
  }

  const secretsManager = new SecretsManagerClient({ region });
  const response = await secretsManager.send(
    new GetSecretValueCommand({ SecretId: process.env.DB_SECRET_NAME }),
  );
  if (!response.SecretString) {
    throw new Error("The database secret has no string value");
  }

  const secret = JSON.parse(response.SecretString);
  const requiredFields = ["username", "password", "host", "port", "dbname", "jwt_secret"];
  for (const field of requiredFields) {
    if (secret[field] === undefined || secret[field] === null || secret[field] === "") {
      throw new Error(`The database secret is missing ${field}`);
    }
  }

  process.env.DATABASE_URL =
    `postgresql://${encodeURIComponent(secret.username)}:${encodeURIComponent(secret.password)}` +
    `@${secret.host}:${secret.port}/${encodeURIComponent(secret.dbname)}?schema=public`;
  process.env.JWT_SECRET = secret.jwt_secret;
}

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set");
}
if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET is not set");
}
