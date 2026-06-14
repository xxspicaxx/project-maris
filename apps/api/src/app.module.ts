import { type MiddlewareConsumer, Module, type NestModule } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from "@nestjs/core";
import { EventEmitterModule } from "@nestjs/event-emitter";
import { ScheduleModule } from "@nestjs/schedule";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";

import configs from "./config";
import { CompanyModule } from "./contexts/company/company.module";
import { DashboardModule } from "./contexts/dashboard/dashboard.module";
import { FleetModule } from "./contexts/fleet/fleet.module";
import { IamModule } from "./contexts/iam/iam.module";
import { HealthController } from "./health.controller";
import { PrismaService } from "./shared/database/prisma.service";
import { GlobalExceptionFilter } from "./shared/filters/global-exception.filter";
import { AuditInterceptor } from "./shared/interceptors/audit.interceptor";
import { RequestIdMiddleware } from "./shared/middleware/request-id.middleware";
import { RedisModule } from "./shared/redis/redis.module";
import { StorageModule } from "./shared/storage/storage.module";

@Module({
  imports: [
    // Global config
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ".env",
      load: configs,
    }),

    // Rate limiting
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),

    // Event emitter for domain events
    EventEmitterModule.forRoot({
      wildcard: false,
      delimiter: ".",
      maxListeners: 10,
      verboseMemoryLeak: true,
      ignoreErrors: false,
    }),

    // Scheduled tasks (certificate expiry, etc.)
    ScheduleModule.forRoot(),

    // Context modules
    IamModule,
    CompanyModule,
    FleetModule,
    DashboardModule,
    StorageModule,
    RedisModule,
  ],
  controllers: [HealthController],
  providers: [
    PrismaService,
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditInterceptor,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RequestIdMiddleware).forRoutes("*");
  }
}
