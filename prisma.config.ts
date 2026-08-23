import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    // Prisma CLI (migrations, introspection) uses the direct connection.
    url: env("DIRECT_URL"),
  },
});
