import { Module } from "@nestjs/common";
import { PrismaService } from "../../shared/database/prisma.service";
import { DashboardService } from "./application/services/dashboard.service";
import { DashboardController } from "./presentation/controllers/dashboard.controller";

@Module({
  controllers: [DashboardController],
  providers: [PrismaService, DashboardService],
  exports: [DashboardService],
})
export class DashboardModule {}
