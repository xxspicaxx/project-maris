import { Injectable } from "@nestjs/common";
import { type Prisma, type VesselCertType, type CertificateStatus } from "@prisma/client";

import { PrismaService } from "../../../../shared/database/prisma.service";
import {
  CertificateNotFoundException,
  VesselNotFoundException,
} from "../../domain/exceptions/vessel.exception";

@Injectable()
export class CertificateService {
  constructor(private readonly prisma: PrismaService) {}

  async findAllByVessel(vesselId: string, companyId: string) {
    return this.prisma.vesselCertificate.findMany({
      where: { vesselId, companyId },
      orderBy: { expiryDate: "asc" },
    });
  }

  async findById(certificateId: string, companyId: string) {
    const certificate = await this.prisma.vesselCertificate.findFirst({
      where: { id: certificateId, companyId },
      include: {
        vessel: {
          select: {
            id: true,
            name: true,
            imoNumber: true,
          },
        },
      },
    });

    if (!certificate) {
      throw new CertificateNotFoundException(certificateId);
    }

    return certificate;
  }

  async create(
    data: {
      vesselId: string;
      certificateType: string;
      certificateNumber?: string;
      issuingAuthority: string;
      issueDate: string;
      expiryDate: string;
      documentUrl?: string;
      notes?: string;
    },
    companyId: string,
    userId: string,
  ) {
    // Verify vessel exists
    const vessel = await this.prisma.vessel.findFirst({
      where: { id: data.vesselId, companyId, deletedAt: null },
    });

    if (!vessel) {
      throw new VesselNotFoundException(data.vesselId);
    }

    return this.prisma.vesselCertificate.create({
      data: {
        vesselId: data.vesselId,
        companyId,
        certificateType: data.certificateType as VesselCertType,
        certificateNumber: data.certificateNumber,
        issuingAuthority: data.issuingAuthority,
        issueDate: new Date(data.issueDate),
        expiryDate: new Date(data.expiryDate),
        documentUrl: data.documentUrl,
        notes: data.notes,
        createdBy: userId,
        updatedBy: userId,
      },
    });
  }

  async update(
    certificateId: string,
    companyId: string,
    userId: string,
    data: {
      certificateNumber?: string;
      issuingAuthority?: string;
      issueDate?: string;
      expiryDate?: string;
      documentUrl?: string;
      notes?: string;
      status?: string;
    },
  ) {
    const certificate = await this.prisma.vesselCertificate.findFirst({
      where: { id: certificateId, companyId },
    });

    if (!certificate) {
      throw new CertificateNotFoundException(certificateId);
    }

    const updateData: Prisma.VesselCertificateUpdateInput = { updatedBy: userId };

    if (data.certificateNumber !== undefined) {
      updateData.certificateNumber = data.certificateNumber;
    }
    if (data.issuingAuthority !== undefined) {
      updateData.issuingAuthority = data.issuingAuthority;
    }
    if (data.issueDate !== undefined) {
      updateData.issueDate = new Date(data.issueDate);
    }
    if (data.expiryDate !== undefined) {
      updateData.expiryDate = new Date(data.expiryDate);
    }
    if (data.documentUrl !== undefined) {
      updateData.documentUrl = data.documentUrl;
    }
    if (data.notes !== undefined) {
      updateData.notes = data.notes;
    }
    if (data.status !== undefined) {
      updateData.status = data.status as CertificateStatus;
    }

    return this.prisma.vesselCertificate.update({
      where: { id: certificateId },
      data: updateData,
    });
  }

  async delete(certificateId: string, companyId: string) {
    const certificate = await this.prisma.vesselCertificate.findFirst({
      where: { id: certificateId, companyId },
    });

    if (!certificate) {
      throw new CertificateNotFoundException(certificateId);
    }

    return this.prisma.vesselCertificate.delete({
      where: { id: certificateId },
    });
  }

  async getExpiringCertificates(companyId: string, daysThreshold = 90) {
    const now = new Date();
    const threshold = new Date(now.getTime() + daysThreshold * 24 * 60 * 60 * 1000);

    return this.prisma.vesselCertificate.findMany({
      where: {
        companyId,
        expiryDate: {
          gte: now,
          lte: threshold,
        },
        status: "VALID",
      },
      include: {
        vessel: {
          select: {
            id: true,
            name: true,
            imoNumber: true,
          },
        },
      },
      orderBy: { expiryDate: "asc" },
    });
  }

  async getExpiredCertificates(companyId: string) {
    const now = new Date();

    return this.prisma.vesselCertificate.findMany({
      where: {
        companyId,
        expiryDate: { lt: now },
        status: { not: "EXPIRED" },
      },
      include: {
        vessel: {
          select: {
            id: true,
            name: true,
            imoNumber: true,
          },
        },
      },
      orderBy: { expiryDate: "asc" },
    });
  }
}
