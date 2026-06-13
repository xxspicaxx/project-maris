import { Module } from "@nestjs/common";

import { DashboardService } from "./application/services/dashboard.service";
import { DashboardController } from "./presentation/controllers/dashboard.controller";
import { PrismaService } from "../../shared/database/prisma.service";

@Module({
  controllers: [DashboardController],
  providers: [PrismaService, DashboardService],
  exports: [DashboardService],
})
export class DashboardModule {}
