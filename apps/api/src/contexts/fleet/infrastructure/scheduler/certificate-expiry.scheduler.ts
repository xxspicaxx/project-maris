import { Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { type CertificateStatus } from "@prisma/client";

import { PrismaService } from "../../../../shared/database/prisma.service";

@Injectable()
export class CertificateExpiryScheduler {
  private readonly logger = new Logger(CertificateExpiryScheduler.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Daily check at 06:00 AM — updates certificate statuses
   * Business Rules:
   * - > 90 days remaining: VALID
   * - 30-90 days remaining: EXPIRING_SOON
   * - 0-29 days remaining: CRITICAL
   * - < 0 days: EXPIRED
   */
  @Cron(CronExpression.EVERY_DAY_AT_6AM, {
    name: "certificate-expiry-check",
    timeZone: "Asia/Jakarta",
  })
  async checkCertificateExpiry(): Promise<void> {
    this.logger.log("🔍 Running daily certificate expiry check...");
    const now = new Date();

    try {
      const allCertificates = await this.prisma.vesselCertificate.findMany({
        where: {
          status: { not: "EXPIRED" },
        },
        select: {
          id: true,
          expiryDate: true,
          status: true,
          vessel: {
            select: { name: true, companyId: true },
          },
        },
      });

      let updated = 0;

      for (const cert of allCertificates) {
        const daysUntilExpiry = Math.ceil(
          (cert.expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
        );

        let newStatus: string | null = null;

        if (daysUntilExpiry < 0 && cert.status !== "EXPIRED") {
          newStatus = "EXPIRED";
        } else if (daysUntilExpiry <= 30 && cert.status !== "CRITICAL") {
          newStatus = "CRITICAL";
        } else if (
          daysUntilExpiry <= 90 &&
          cert.status !== "EXPIRING_SOON" &&
          cert.status !== "CRITICAL"
        ) {
          newStatus = "EXPIRING_SOON";
        }

        // Reset back to VALID if it was flagged but now has > 90 days
        if (daysUntilExpiry > 90 && cert.status !== "VALID") {
          newStatus = "VALID";
        }

        if (newStatus && newStatus !== cert.status) {
          await this.prisma.vesselCertificate.update({
            where: { id: cert.id },
            data: { status: newStatus as CertificateStatus },
          });

          this.logger.log(
            `  📄 Cert ${cert.id.slice(0, 8)}... for ${cert.vessel.name}: ${cert.status} → ${newStatus} (${daysUntilExpiry}d remaining)`,
          );
          updated++;
        }
      }

      this.logger.log(`✅ Certificate expiry check complete. Updated ${updated} certificates.`);
    } catch (error) {
      this.logger.error("❌ Certificate expiry check failed:", error);
    }
  }
}
