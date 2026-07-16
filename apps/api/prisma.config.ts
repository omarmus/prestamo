import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "src/identity/infrastructure/persistence/prisma/schema.prisma",
  migrations: {
    path: "src/identity/infrastructure/persistence/prisma/migrations",
  },
  datasource: {
    url: "postgresql://postgres:postgres@localhost:5432/prestamos",
  },
});
