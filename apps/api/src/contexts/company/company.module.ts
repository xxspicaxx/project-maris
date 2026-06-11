import { Module } from "@nestjs/common";
import { PrismaService } from "../../shared/database/prisma.service";
import { CompanyService } from "./application/services/company.service";
import { CompanyController } from "./presentation/controllers/company.controller";

@Module({
  controllers: [CompanyController],
  providers: [PrismaService, CompanyService],
  exports: [CompanyService],
})
export class CompanyModule {}
