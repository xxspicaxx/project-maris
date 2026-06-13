import { Module } from "@nestjs/common";

import { CertificateService } from "./application/services/certificate.service";
import { VesselService } from "./application/services/vessel.service";
import { CertificateExpiryScheduler } from "./infrastructure/scheduler/certificate-expiry.scheduler";
import { VesselController } from "./presentation/controllers/vessel.controller";
import { PrismaService } from "../../shared/database/prisma.service";

@Module({
  controllers: [VesselController],
  providers: [PrismaService, VesselService, CertificateService, CertificateExpiryScheduler],
  exports: [VesselService, CertificateService],
})
export class FleetModule {}
