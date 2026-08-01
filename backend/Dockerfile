# Backend container image. Mirrors how the API will run on the app tier: a Node
# process connecting to Postgres over the network.
FROM node:22-slim

# OpenSSL is required by Prisma's query engine.
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install dependencies first so this layer is cached when only source changes.
COPY package*.json ./
RUN npm install

# Copy the rest of the app and generate the Prisma client.
COPY . .
RUN npx prisma generate

EXPOSE 5000

# Apply any pending migrations, then start the server. This is how the app tier
# will bring a fresh database up to schema on deploy.
CMD ["sh", "-c", "npx prisma migrate deploy && node server.js"]
