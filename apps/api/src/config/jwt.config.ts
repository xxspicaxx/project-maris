import { registerAs } from "@nestjs/config";

export default registerAs("jwt", () => ({
  secret: process.env.JWT_SECRET || "super-secret-default",
  expiresIn: process.env.JWT_EXPIRES_IN || "15m",
  refreshSecret: process.env.JWT_REFRESH_SECRET || "refresh-super-secret-default",
  refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
}));
