import { Logger, ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import helmet from "helmet";
import { WinstonModule } from "nest-winston";
import { VesselStatus } from "@shared/enums";
import { AppModule } from "./app.module";
import { winstonLoggerOptions } from "./shared/logging/winston.config";

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: WinstonModule.createLogger(winstonLoggerOptions),
  });

  // Security headers
  app.use(helmet());

  // CORS — allow both frontend (3000) and API (4000) origins
  const corsOrigins = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(",")
    : ["http://localhost:3000", "http://localhost:4000"];

  app.enableCors({
    origin: corsOrigins,
    credentials: true,
  });

  // Global prefix
  app.setGlobalPrefix("api/v1", {
    exclude: ["health"],
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle("Maritime Fleet ERP API")
    .setDescription("Enterprise API for maritime fleet management")
    .setVersion("1.0")
    .addBearerAuth({ type: "http", scheme: "bearer", bearerFormat: "JWT" }, "access-token")
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("api/docs", app, document);

  const port = process.env.PORT || 4000;
  await app.listen(port);
  Logger.log(
    `🚀 API running on http://localhost:${port}/api/v1 (VesselStatus: ${VesselStatus.ACTIVE})`,
    "Bootstrap",
  );
  Logger.log(`📖 Swagger docs at http://localhost:${port}/api/docs`, "Bootstrap");
}

bootstrap();
