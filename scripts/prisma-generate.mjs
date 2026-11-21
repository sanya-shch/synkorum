// Runs `prisma generate` without requiring a real DATABASE_URL.
//
// Generating the client never connects to a database, but prisma.config.ts reads
// env("DATABASE_URL") and Prisma refuses to load the config when it is unset. That would make
// `npm ci` (which runs this as `postinstall`) fail anywhere the variable is not yet defined at
// install time: CI jobs, Dependabot, Docker builds, a fresh clone. A real value is always used
// when present, so `prisma migrate` and the app itself are unaffected.
import { spawnSync } from "node:child_process";

const env = { ...process.env };
env.DATABASE_URL ||= "postgresql://placeholder:placeholder@localhost:5432/placeholder";

const result = spawnSync("npx", ["prisma", "generate"], {
  stdio: "inherit",
  env,
  shell: process.platform === "win32",
});

process.exit(result.status ?? 1);
