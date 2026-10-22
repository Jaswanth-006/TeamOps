import { execFileSync } from "node:child_process";
import "./configs/runtimeConfig.js";

execFileSync("npx", ["prisma", "migrate", "deploy"], {
  env: process.env,
  stdio: "inherit",
});

await import("./server.js");
