
import dotenv from "dotenv";
import path from "path";
import fs from "fs";

const envPath = path.resolve(process.cwd(), ".env.test.local");

if (!fs.existsSync(envPath)) {
  throw new Error("Missing backend/.env.test.local");
}

dotenv.config({
  path: envPath,
  override: true,
});

if (!process.env.DATABASE_URI) {
  throw new Error("DATABASE_URI is missing from .env.test.local");
}
