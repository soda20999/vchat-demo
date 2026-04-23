import { defineConfig } from "drizzle-kit";
import * as dotenv from "dotenv";

// 关键步骤：手动加载 .env.local 文件
dotenv.config({
  path: ".env.local",
});

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});