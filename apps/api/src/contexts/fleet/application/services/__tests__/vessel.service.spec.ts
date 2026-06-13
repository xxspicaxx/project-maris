import { Test, type TestingModule } from "@nestjs/testing";

import { createMockVessel } from "../../../../../../test/factories/vessel.factory";
import { PrismaService } from "../../../../../shared/database/prisma.service";
import {
  DuplicateImoNumberException,
  VesselNotFoundException,
} from "../../../domain/exceptions/vessel.exception";
import { VesselService } from "../vessel.service";

describe("VesselService", () => {
  let service: VesselService;
  let prisma: any;

  const mockPrismaService = {
    vessel: {
      findMany: jest.fn(),
      count: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    document: {
      create: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [VesselService, { provide: PrismaService, useValue: mockPrismaService }],
    }).compile();

    service = module.get<VesselService>(VesselService);
    prisma = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  describe("findAll", () => {
    it("should return a paginated list of vessels", async () => {
      const mockVessels = [createMockVessel(), createMockVessel()];
      prisma.vessel.findMany.mockResolvedValue(mockVessels);
      prisma.vessel.count.mockResolvedValue(2);

      const result = await service.findAll("company-123", { page: 1, limit: 10 });

      expect(prisma.vessel.findMany).toHaveBeenCalled();
      expect(prisma.vessel.count).toHaveBeenCalled();
      expect(result.data).toEqual(mockVessels);
      expect(result.meta).toEqual({
        total: 2,
        page: 1,
        limit: 10,
        totalPages: 1,
        hasNextPage: false,
        hasPrevPage: false,
      });
    });

    it("should apply search filters correctly", async () => {
      prisma.vessel.findMany.mockResolvedValue([]);
      prisma.vessel.count.mockResolvedValue(0);

      await service.findAll("company-123", { search: "nusantara" });

      expect(prisma.vessel.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: [
              { name: { contains: "nusantara", mode: "insensitive" } },
              { imoNumber: { contains: "nusantara" } },
              { callSign: { contains: "nusantara", mode: "insensitive" } },
            ],
          }),
        }),
      );
    });
  });

  describe("findById", () => {
    it("should return vessel details if found", async () => {
      const mockVessel = createMockVessel();
      prisma.vessel.findFirst.mockResolvedValue(mockVessel);

      const result = await service.findById(mockVessel.id, mockVessel.companyId);

      expect(prisma.vessel.findFirst).toHaveBeenCalledWith({
        where: { id: mockVessel.id, companyId: mockVessel.companyId, deletedAt: null },
        include: expect.any(Object),
      });
      expect(result).toEqual(mockVessel);
    });

    it("should throw VesselNotFoundException if vessel is not found", async () => {
      prisma.vessel.findFirst.mockResolvedValue(null);

      await expect(service.findById("non-existent-id", "company-id")).rejects.toThrow(
        VesselNotFoundException,
      );
    });
  });

  describe("create", () => {
    it("should create a vessel successfully if IMO is unique", async () => {
      const mockVessel = createMockVessel();
      prisma.vessel.findUnique.mockResolvedValue(null);
      prisma.vessel.create.mockResolvedValue(mockVessel);

      const result = await service.create(
        {
          imoNumber: mockVessel.imoNumber,
          name: mockVessel.name,
          flagState: mockVessel.flagState,
          vesselType: mockVessel.vesselType,
          grossTonnage: mockVessel.grossTonnage.toNumber(),
        },
        mockVessel.companyId,
        mockVessel.createdBy,
      );

      expect(prisma.vessel.findUnique).toHaveBeenCalledWith({
        where: { imoNumber: mockVessel.imoNumber },
      });
      expect(prisma.vessel.create).toHaveBeenCalled();
      expect(result).toEqual(mockVessel);
    });

    it("should throw DuplicateImoNumberException if IMO number already exists", async () => {
      const mockVessel = createMockVessel();
      prisma.vessel.findUnique.mockResolvedValue(mockVessel);

      await expect(
        service.create(
          {
            imoNumber: mockVessel.imoNumber,
            name: mockVessel.name,
            flagState: mockVessel.flagState,
            vesselType: mockVessel.vesselType,
            grossTonnage: mockVessel.grossTonnage.toNumber(),
          },
          mockVessel.companyId,
          mockVessel.createdBy,
        ),
      ).rejects.toThrow(DuplicateImoNumberException);

      expect(prisma.vessel.create).not.toHaveBeenCalled();
    });
  });

  describe("update", () => {
    it("should update vessel information successfully", async () => {
      const mockVessel = createMockVessel();
      prisma.vessel.findFirst.mockResolvedValue(mockVessel);
      prisma.vessel.update.mockResolvedValue({ ...mockVessel, name: "MV New Name" });

      const result = await service.update(
        mockVessel.id,
        mockVessel.companyId,
        mockVessel.createdBy,
        { name: "MV New Name" },
      );

      expect(prisma.vessel.update).toHaveBeenCalled();
      expect(result.name).toBe("MV New Name");
    });
  });

  describe("softDelete", () => {
    it("should soft delete the vessel by setting deletedAt", async () => {
      const mockVessel = createMockVessel();
      prisma.vessel.findFirst.mockResolvedValue(mockVessel);
      prisma.vessel.update.mockResolvedValue({ ...mockVessel, deletedAt: new Date() });

      await service.softDelete(mockVessel.id, mockVessel.companyId, mockVessel.createdBy);

      expect(prisma.vessel.update).toHaveBeenCalledWith({
        where: { id: mockVessel.id },
        data: expect.objectContaining({
          deletedAt: expect.any(Date),
        }),
      });
    });
  });
});
