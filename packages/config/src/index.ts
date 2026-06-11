/**
 * @maris/config — Configuration module
 */

export const config = {
  app: {
    name: "Maritime Fleet ERP",
    version: "0.1.0",
    env: process.env.NODE_ENV ?? "development",
    port: parseInt(process.env.PORT ?? "4000", 10),
    url: process.env.APP_URL ?? "http://localhost:4000",
  },
  database: {
    url: process.env.DATABASE_URL ?? "postgresql://user:password@localhost:5432/maritime_erp",
  },
  jwt: {
    secret: process.env.JWT_SECRET ?? "dev-jwt-secret-minimum-32-characters-long",
    accessExpires: process.env.JWT_ACCESS_EXPIRES ?? "15m",
    refreshExpires: process.env.JWT_REFRESH_EXPIRES ?? "7d",
  },
  redis: {
    url: process.env.REDIS_URL ?? "redis://localhost:6379",
  },
  minio: {
    endpoint: process.env.MINIO_ENDPOINT ?? "localhost",
    port: parseInt(process.env.MINIO_PORT ?? "9000", 10),
    accessKey: process.env.MINIO_ACCESS_KEY ?? "minioadmin",
    secretKey: process.env.MINIO_SECRET_KEY ?? "minioadmin123",
    bucket: process.env.MINIO_BUCKET ?? "maritime-docs",
  },
  smtp: {
    host: process.env.SMTP_HOST ?? "localhost",
    port: parseInt(process.env.SMTP_PORT ?? "1025", 10),
    user: process.env.SMTP_USER ?? "",
    pass: process.env.SMTP_PASS ?? "",
  },
} as const;

export type AppConfig = typeof config;
