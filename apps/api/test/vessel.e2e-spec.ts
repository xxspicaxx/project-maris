import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication, CanActivate, ExecutionContext } from "@nestjs/common";
import * as request from "supertest";
import { AppModule } from "../src/app.module";
import { VesselService } from "../src/contexts/fleet/application/services/vessel.service";
import { JwtAuthGuard } from "../src/shared/guards/jwt-auth.guard";
import { createMockVessel } from "./factories/vessel.factory";

class MockJwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    req.user = {
      userId: "test-user-id",
      email: "test@maritime.com",
      companyId: "test-company-id",
      roles: ["FLEET_MANAGER"],
      permissions: ["vessel:create", "vessel:read", "vessel:update", "vessel:delete"],
      isSuperAdmin: false,
    };
    return true;
  }
}

describe("VesselController (E2E/Integration)", () => {
  let app: INestApplication;
  let mockVesselService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findById: jest.fn(),
    update: jest.fn(),
    softDelete: jest.fn(),
    updateStatus: jest.fn(),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideGuard(JwtAuthGuard)
      .useClass(MockJwtAuthGuard)
      .overrideProvider(VesselService)
      .useValue(mockVesselService)
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix("api/v1");
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe("GET /api/v1/vessels", () => {
    it("should return list of vessels successfully", async () => {
      const mockVessels = [createMockVessel(), createMockVessel()];
      mockVesselService.findAll.mockResolvedValue({
        data: mockVessels,
        meta: { total: 2, page: 1, limit: 10, totalPages: 1 },
      });

      const res = await request(app.getHttpServer())
        .get("/api/v1/vessels")
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(2);
      expect(mockVesselService.findAll).toHaveBeenCalled();
    });
  });

  describe("POST /api/v1/vessels", () => {
    it("should register a new vessel successfully", async () => {
      const mockVessel = createMockVessel();
      mockVesselService.create.mockResolvedValue(mockVessel);

      const payload = {
        imoNumber: "9123456",
        name: "MV E2E Vessel",
        flagState: "ID",
        vesselType: "BULK_CARRIER",
        grossTonnage: 12000,
      };

      const res = await request(app.getHttpServer())
        .post("/api/v1/vessels")
        .send(payload)
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.imoNumber).toBe(mockVessel.imoNumber);
      expect(mockVesselService.create).toHaveBeenCalled();
    });
  });

  describe("GET /api/v1/vessels/:vesselId", () => {
    it("should return detailed vessel details", async () => {
      const mockVessel = createMockVessel();
      mockVesselService.findById.mockResolvedValue(mockVessel);

      const res = await request(app.getHttpServer())
        .get(`/api/v1/vessels/${mockVessel.id}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(mockVessel.id);
      expect(mockVesselService.findById).toHaveBeenCalled();
    });
  });
});
