import { type WinstonModuleOptions } from "nest-winston";
import * as winston from "winston";
import * as DailyRotateFile from "winston-daily-rotate-file";

export const winstonLoggerOptions: WinstonModuleOptions = {
  transports: [
    // 1. Console logging
    new winston.transports.Console({
      level: process.env.NODE_ENV === "production" ? "info" : "debug",
      format: winston.format.combine(
        winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
        winston.format.colorize(),
        winston.format.printf(({ timestamp, level, message, context, requestId }) => {
          const contextStr = context ? ` [${context}]` : "";
          const reqIdStr = requestId ? ` (${requestId})` : "";
          return `[MARIS] ${timestamp} ${level}:${contextStr}${reqIdStr} ${message}`;
        }),
      ),
    }),

    // 2. Rotating File for Errors
    new DailyRotateFile({
      filename: "logs/error-%DATE%.log",
      datePattern: "YYYY-MM-DD",
      zippedArchive: true,
      maxSize: "20m",
      maxFiles: "14d",
      level: "error",
      format: winston.format.combine(
        winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
        winston.format.json(),
      ),
    }),

    // 3. Rotating File for All Logs (Combined)
    new DailyRotateFile({
      filename: "logs/combined-%DATE%.log",
      datePattern: "YYYY-MM-DD",
      zippedArchive: true,
      maxSize: "20m",
      maxFiles: "14d",
      level: "info",
      format: winston.format.combine(
        winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
        winston.format.json(),
      ),
    }),
  ],
};
