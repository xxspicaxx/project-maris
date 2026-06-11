import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../../shared/database/prisma.service";

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getFleetOverview(companyId: string) {
    const [total, byStatus, companies, totalCrew] = await Promise.all([
      this.prisma.vessel.count({ where: { companyId, deletedAt: null } }),
      this.prisma.vessel.groupBy({
        by: ["status"],
        where: { companyId, deletedAt: null },
        _count: { id: true },
      }),
      this.prisma.company.findUnique({
        where: { id: companyId },
        select: { name: true, code: true },
      }),
      this.prisma.crewAssignment.count({
        where: { companyId, signOffDate: null },
      }),
    ]);

    const statusMap: Record<string, number> = {};
    for (const item of byStatus) {
      statusMap[item.status] = item._count.id;
    }

    return {
      company: companies,
      totalVessels: total,
      activeVessels: statusMap["ACTIVE"] || 0,
      drydockVessels: statusMap["DRYDOCK"] || 0,
      laidUpVessels: statusMap["LAID_UP"] || 0,
      scrappedVessels: statusMap["SCRAPPED"] || 0,
      crewOnBoard: totalCrew,
    };
  }

  async getCertificateSummary(companyId: string) {
    const now = new Date();

    const certificates = await this.prisma.vesselCertificate.findMany({
      where: { companyId },
      select: {
        id: true,
        status: true,
        expiryDate: true,
      },
    });

    let valid = 0;
    let expiringSoon = 0;
    let critical = 0;
    let expired = 0;

    for (const cert of certificates) {
      const daysUntilExpiry = Math.ceil(
        (cert.expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
      );

      if (daysUntilExpiry < 0) {
        expired++;
      } else if (daysUntilExpiry <= 30) {
        critical++;
      } else if (daysUntilExpiry <= 90) {
        expiringSoon++;
      } else {
        valid++;
      }
    }

    return {
      total: certificates.length,
      valid,
      expiringSoon,
      critical,
      expired,
    };
  }

  async getAlertPanel(companyId: string) {
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const ninetyDaysFromNow = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

    // Critical certificates (expired or within 30 days)
    const criticalCertificates = await this.prisma.vesselCertificate.findMany({
      where: {
        companyId,
        OR: [{ expiryDate: { lt: now } }, { expiryDate: { gte: now, lte: thirtyDaysFromNow } }],
      },
      include: {
        vessel: {
          select: { id: true, name: true, imoNumber: true },
        },
      },
      orderBy: { expiryDate: "asc" },
      take: 20,
    });

    // Expiring soon certificates (30-90 days)
    const expiringCertificates = await this.prisma.vesselCertificate.findMany({
      where: {
        companyId,
        expiryDate: { gte: thirtyDaysFromNow, lte: ninetyDaysFromNow },
      },
      include: {
        vessel: {
          select: { id: true, name: true, imoNumber: true },
        },
      },
      orderBy: { expiryDate: "asc" },
      take: 20,
    });

    // Vessels in drydock
    const vesselsInDrydock = await this.prisma.vessel.findMany({
      where: { companyId, status: "DRYDOCK", deletedAt: null },
      select: { id: true, name: true, imoNumber: true, updatedAt: true },
      take: 10,
    });

    return {
      critical: criticalCertificates.map((c) => ({
        type: "certificate",
        severity: c.expiryDate < now ? "danger" : "critical",
        title: `Sertifikat ${c.certificateType} - ${c.vessel.name}`,
        description: `${c.certificateNumber ?? "No #"} expires ${c.expiryDate.toISOString().split("T")[0]}`,
        vesselId: c.vessel.id,
        vesselName: c.vessel.name,
        expiryDate: c.expiryDate,
        daysRemaining: Math.ceil((c.expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
      })),
      expiringSoon: expiringCertificates.map((c) => ({
        type: "certificate",
        severity: "warning",
        title: `Sertifikat ${c.certificateType} - ${c.vessel.name}`,
        description: `${c.certificateNumber ?? "No #"} expires ${c.expiryDate.toISOString().split("T")[0]}`,
        vesselId: c.vessel.id,
        vesselName: c.vessel.name,
        expiryDate: c.expiryDate,
        daysRemaining: Math.ceil((c.expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
      })),
      drydockVessels: vesselsInDrydock.map((v) => ({
        type: "vessel_status",
        severity: "warning",
        title: `${v.name} (${v.imoNumber})`,
        description: "Kapal sedang dalam drydock",
        vesselId: v.id,
        vesselName: v.name,
      })),
      totalAlerts:
        criticalCertificates.length + expiringCertificates.length + vesselsInDrydock.length,
    };
  }
}
