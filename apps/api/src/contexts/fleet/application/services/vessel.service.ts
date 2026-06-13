import { Injectable } from "@nestjs/common";
import { type Prisma, type FuelType, type VesselStatus, type VesselType } from "@prisma/client";

import { PrismaService } from "../../../../shared/database/prisma.service";
import { ApiResponseHelper } from "../../../../shared/utils/api-response.helper";
import {
  DuplicateImoNumberException,
  VesselNotFoundException,
} from "../../domain/exceptions/vessel.exception";

@Injectable()
export class VesselService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(
    companyId: string,
    query: {
      page?: number;
      limit?: number;
      status?: string;
      flagState?: string;
      search?: string;
      sortBy?: string;
      sortOrder?: "asc" | "desc";
    },
  ) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: Prisma.VesselWhereInput = {
      companyId,
      deletedAt: null,
    };

    if (query.status) {
      where.status = query.status as VesselStatus;
    }

    if (query.flagState) {
      where.flagState = query.flagState;
    }

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: "insensitive" } },
        { imoNumber: { contains: query.search } },
        { callSign: { contains: query.search, mode: "insensitive" } },
      ];
    }

    const sortField = query.sortBy || "createdAt";
    const sortOrder = query.sortOrder || "desc";

    const [vessels, total] = await Promise.all([
      this.prisma.vessel.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortField]: sortOrder },
        include: {
          _count: {
            select: {
              certificates: true,
              crewAssignments: true,
            },
          },
        },
      }),
      this.prisma.vessel.count({ where }),
    ]);

    return {
      data: vessels,
      meta: ApiResponseHelper.paginationMeta(total, page, limit),
    };
  }

  async findById(vesselId: string, companyId: string) {
    const vessel = await this.prisma.vessel.findFirst({
      where: { id: vesselId, companyId, deletedAt: null },
      include: {
        certificates: {
          orderBy: { expiryDate: "asc" },
        },
        documents: {
          where: { deletedAt: null },
          take: 10,
          orderBy: { createdAt: "desc" },
        },
        _count: {
          select: {
            crewAssignments: true,
            voyages: true,
            maintenanceJobs: true,
          },
        },
      },
    });

    if (!vessel) {
      throw new VesselNotFoundException(vesselId);
    }

    return vessel;
  }

  async create(
    data: {
      imoNumber: string;
      mmsiNumber?: string;
      name: string;
      formerNames?: string[];
      callSign?: string;
      flagState: string;
      portOfRegistry?: string;
      vesselType: string;
      status?: string;
      grossTonnage: number;
      netTonnage?: number;
      deadweightTonnage?: number;
      lengthOverall?: number;
      breadth?: number;
      depth?: number;
      yearBuilt?: number;
      shipyard?: string;
      shipyardCountry?: string;
      classNumber?: string;
      classSociety?: string;
      mainEngineType?: string;
      mainEnginePower?: number;
      fuelType?: string;
    },
    companyId: string,
    userId: string,
  ) {
    // Check if IMO already exists
    const existing = await this.prisma.vessel.findUnique({
      where: { imoNumber: data.imoNumber },
    });

    if (existing) {
      throw new DuplicateImoNumberException(data.imoNumber);
    }

    return this.prisma.vessel.create({
      data: {
        imoNumber: data.imoNumber,
        mmsiNumber: data.mmsiNumber,
        name: data.name,
        formerNames: data.formerNames,
        callSign: data.callSign,
        flagState: data.flagState,
        portOfRegistry: data.portOfRegistry,
        vesselType: data.vesselType as VesselType,
        status: data.status ? (data.status as VesselStatus) : undefined,
        grossTonnage: data.grossTonnage,
        netTonnage: data.netTonnage,
        deadweightTonnage: data.deadweightTonnage,
        lengthOverall: data.lengthOverall,
        breadth: data.breadth,
        depth: data.depth,
        yearBuilt: data.yearBuilt,
        shipyard: data.shipyard,
        shipyardCountry: data.shipyardCountry,
        classNumber: data.classNumber,
        classSociety: data.classSociety,
        mainEngineType: data.mainEngineType,
        mainEnginePower: data.mainEnginePower,
        fuelType: data.fuelType ? (data.fuelType as FuelType) : undefined,
        companyId,
        createdBy: userId,
        updatedBy: userId,
      },
    });
  }

  async update(
    vesselId: string,
    companyId: string,
    userId: string,
    data: {
      name?: string;
      callSign?: string;
      flagState?: string;
      portOfRegistry?: string;
      status?: string;
      classSociety?: string;
    },
  ) {
    const vessel = await this.prisma.vessel.findFirst({
      where: { id: vesselId, companyId, deletedAt: null },
    });

    if (!vessel) {
      throw new VesselNotFoundException(vesselId);
    }

    return this.prisma.vessel.update({
      where: { id: vesselId },
      data: {
        name: data.name,
        callSign: data.callSign,
        flagState: data.flagState,
        portOfRegistry: data.portOfRegistry,
        status: data.status ? (data.status as VesselStatus) : undefined,
        classSociety: data.classSociety,
        updatedBy: userId,
      },
    });
  }

  async updateStatus(vesselId: string, companyId: string, userId: string, status: string) {
    const vessel = await this.prisma.vessel.findFirst({
      where: { id: vesselId, companyId, deletedAt: null },
    });

    if (!vessel) {
      throw new VesselNotFoundException(vesselId);
    }

    return this.prisma.vessel.update({
      where: { id: vesselId },
      data: {
        status: status as VesselStatus,
        updatedBy: userId,
      },
    });
  }

  async softDelete(vesselId: string, companyId: string, userId: string) {
    const vessel = await this.prisma.vessel.findFirst({
      where: { id: vesselId, companyId, deletedAt: null },
    });

    if (!vessel) {
      throw new VesselNotFoundException(vesselId);
    }

    return this.prisma.vessel.update({
      where: { id: vesselId },
      data: {
        deletedAt: new Date(),
        updatedBy: userId,
      },
    });
  }

  async addDocument(
    vesselId: string,
    companyId: string,
    userId: string,
    data: {
      title: string;
      description?: string;
      documentType: string;
      fileName: string;
      fileUrl: string;
      fileSize: number;
      mimeType: string;
    },
  ) {
    const vessel = await this.prisma.vessel.findFirst({
      where: { id: vesselId, companyId, deletedAt: null },
    });

    if (!vessel) {
      throw new VesselNotFoundException(vesselId);
    }

    return this.prisma.document.create({
      data: {
        companyId,
        vesselId,
        documentType: data.documentType,
        title: data.title,
        description: data.description,
        fileName: data.fileName,
        fileUrl: data.fileUrl,
        fileSize: data.fileSize,
        mimeType: data.mimeType,
        status: "PUBLISHED",
        createdBy: userId,
        updatedBy: userId,
      },
    });
  }
}
