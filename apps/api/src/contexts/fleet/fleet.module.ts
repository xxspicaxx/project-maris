import { Module } from "@nestjs/common";
import { PrismaService } from "../../shared/database/prisma.service";
import { CertificateService } from "./application/services/certificate.service";
import { VesselService } from "./application/services/vessel.service";
import { CertificateExpiryScheduler } from "./infrastructure/scheduler/certificate-expiry.scheduler";
import { VesselController } from "./presentation/controllers/vessel.controller";

@Module({
  controllers: [VesselController],
  providers: [PrismaService, VesselService, CertificateService, CertificateExpiryScheduler],
  exports: [VesselService, CertificateService],
})
export class FleetModule {}
