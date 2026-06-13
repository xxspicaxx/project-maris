import { Module } from "@nestjs/common";

import { CompanyService } from "./application/services/company.service";
import { CompanyController } from "./presentation/controllers/company.controller";
import { PrismaService } from "../../shared/database/prisma.service";

@Module({
  controllers: [CompanyController],
  providers: [PrismaService, CompanyService],
  exports: [CompanyService],
})
export class CompanyModule {}
