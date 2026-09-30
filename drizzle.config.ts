import { defineConfig } from "drizzle-kit";

try {
  process.loadEnvFile(".env.local");
} catch {
  // .env.local이 없으면 이미 설정된 환경 변수를 쓴다.
}

export default defineConfig({
  dialect: "postgresql",
  schema: "./db/schema.ts",
  out: "./db/migrations",
  dbCredentials: { url: process.env.DATABASE_URL! },
});
