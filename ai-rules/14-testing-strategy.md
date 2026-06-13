# 14 — Testing Strategy

> **AI Instruction:** Test bukan opsional. Setiap domain exception, business rule compliance, dan repository harus ada unit test-nya. AI harus selalu generate test file bersamaan dengan file implementasi — bukan setelah.

---

## 14.1 Testing Philosophy

```
Test Pyramid untuk Maritime ERP:

         /\
        /E2E\          ← 10% — Critical user journeys
       /------\
      /Integration\    ← 30% — API endpoints, DB queries
     /------------\
    /  Unit Tests  \   ← 60% — Domain logic, use cases, utils
   /________________\
```

**Prioritas testing (berurutan):**

1. Domain business rules & compliance rules
2. Application use case handlers
3. API endpoint integration tests
4. Critical E2E flows (login, voyage approval, sign-on)

---

## 14.2 Unit Testing — Domain Layer

### Aturan Unit Test

- Setiap domain exception harus punya test
- Setiap compliance rule harus punya test
- Coverage minimum: **80%** untuk domain & application layer
- Test file: `*.spec.ts` di sebelah file yang ditest

### Template Test Domain

```typescript
// contexts/fleet/domain/entities/__tests__/vessel.entity.spec.ts

describe("Vessel Entity", () => {
  describe("validateCertificateStatus()", () => {
    it("should return VALID when expiry is more than 90 days away", () => {
      const expiryDate = addDays(new Date(), 91);
      const status = calculateCertificateExpiryStatus(expiryDate);
      expect(status).toBe(CertificateStatus.VALID);
    });

    it("should return EXPIRING_SOON when expiry is between 30-90 days", () => {
      const expiryDate = addDays(new Date(), 60);
      const status = calculateCertificateExpiryStatus(expiryDate);
      expect(status).toBe(CertificateStatus.EXPIRING_SOON);
    });

    it("should return CRITICAL when expiry is less than 30 days", () => {
      const expiryDate = addDays(new Date(), 15);
      const status = calculateCertificateExpiryStatus(expiryDate);
      expect(status).toBe(CertificateStatus.CRITICAL);
    });

    it("should return EXPIRED when expiry date has passed", () => {
      const expiryDate = subDays(new Date(), 1);
      const status = calculateCertificateExpiryStatus(expiryDate);
      expect(status).toBe(CertificateStatus.EXPIRED);
    });
  });
});
```

### Test Compliance Business Rules

```typescript
// contexts/crew/domain/__tests__/stcw-compliance.spec.ts

describe("STCW Certificate Validation", () => {
  describe("validateCertificatesForSignOn()", () => {
    it("should block sign-on if Master CoC is expired", () => {
      const seafarer = createMockSeafarer({
        certificates: [
          createMockCertificate({
            type: SeafarerCertType.COC,
            expiryDate: subDays(new Date(), 1), // Yesterday — expired
          }),
        ],
      });

      const result = validateCertificatesForSignOn(seafarer, CrewRank.MASTER, new Date());

      expect(result.isCompliant).toBe(false);
      expect(result.violations).toHaveLength(1);
      expect(result.violations[0].issue).toBe("EXPIRED");
      expect(result.violations[0].certType).toBe(SeafarerCertType.COC);
    });

    it("should block sign-on if required certificate is missing", () => {
      const seafarer = createMockSeafarer({
        certificates: [], // No certificates at all
      });

      const result = validateCertificatesForSignOn(seafarer, CrewRank.MASTER, new Date());

      expect(result.isCompliant).toBe(false);
      expect(result.violations.some((v) => v.issue === "MISSING")).toBe(true);
    });

    it("should allow sign-on if all required certificates are valid", () => {
      const seafarer = createMockSeafarer({
        certificates: createValidMasterCertificates(),
      });

      const result = validateCertificatesForSignOn(seafarer, CrewRank.MASTER, new Date());

      expect(result.isCompliant).toBe(true);
      expect(result.violations).toHaveLength(0);
    });
  });
});
```

---

## 14.3 Unit Testing — Use Case Handlers

```typescript
// contexts/fleet/application/commands/register-vessel/__tests__/
// register-vessel.handler.spec.ts

describe("RegisterVesselHandler", () => {
  let handler: RegisterVesselHandler;
  let vesselRepository: jest.Mocked<IVesselRepository>;
  let eventEmitter: jest.Mocked<IEventEmitter>;

  beforeEach(() => {
    vesselRepository = {
      findByImo: jest.fn(),
      save: jest.fn(),
    } as any;

    eventEmitter = {
      emit: jest.fn(),
    } as any;

    handler = new RegisterVesselHandler(vesselRepository, eventEmitter);
  });

  it("should register a vessel successfully", async () => {
    vesselRepository.findByImo.mockResolvedValue(null); // No duplicate
    vesselRepository.save.mockResolvedValue(mockVessel);

    const command = new RegisterVesselCommand(createValidVesselDto(), "company-id-1", "user-id-1");

    const result = await handler.execute(command);

    expect(result.imoNumber).toBe(command.dto.imoNumber);
    expect(vesselRepository.save).toHaveBeenCalledTimes(1);
    expect(eventEmitter.emit).toHaveBeenCalledWith(expect.any(VesselRegisteredEvent));
  });

  it("should throw DuplicateImoNumberException when IMO already exists", async () => {
    vesselRepository.findByImo.mockResolvedValue(mockVessel); // Duplicate!

    const command = new RegisterVesselCommand(createValidVesselDto(), "company-id-1", "user-id-1");

    await expect(handler.execute(command)).rejects.toThrow(DuplicateImoNumberException);
    expect(vesselRepository.save).not.toHaveBeenCalled();
  });
});
```

---

## 14.4 Integration Testing — API Endpoints

```typescript
// test/integration/fleet/vessel.e2e-spec.ts

describe("Vessel API (/api/v1/vessels)", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let authToken: string;
  let companyId: string;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    applyAllMiddleware(app); // Pipes, filters, interceptors
    await app.init();

    prisma = moduleFixture.get(PrismaService);
    const { token, company } = await setupTestCompanyAndUser(prisma);
    authToken = token;
    companyId = company.id;
  });

  afterAll(async () => {
    await cleanupTestData(prisma);
    await app.close();
  });

  describe("POST /api/v1/vessels", () => {
    it("should create a vessel with valid data", async () => {
      const dto = {
        imoNumber: "9123456",
        name: "MV Test Vessel",
        flagState: "ID",
        vesselType: "BULK_CARRIER",
        grossTonnage: 12500,
      };

      const response = await request(app.getHttpServer())
        .post("/api/v1/vessels")
        .set("Authorization", `Bearer ${authToken}`)
        .send(dto)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.imoNumber).toBe(dto.imoNumber);
      expect(response.body.data.companyId).toBe(companyId);
    });

    it("should return 400 when IMO number format is invalid", async () => {
      const dto = {
        imoNumber: "123",
        name: "Test",
        flagState: "ID",
        vesselType: "BULK_CARRIER",
        grossTonnage: 100,
      };

      const response = await request(app.getHttpServer())
        .post("/api/v1/vessels")
        .set("Authorization", `Bearer ${authToken}`)
        .send(dto)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("should return 409 when IMO number already exists", async () => {
      // Create vessel first
      await createTestVessel(prisma, companyId, { imoNumber: "9999999" });

      const dto = {
        imoNumber: "9999999",
        name: "Duplicate",
        flagState: "ID",
        vesselType: "BULK_CARRIER",
        grossTonnage: 100,
      };

      const response = await request(app.getHttpServer())
        .post("/api/v1/vessels")
        .set("Authorization", `Bearer ${authToken}`)
        .send(dto)
        .expect(409);

      expect(response.body.error.code).toBe("FLEET_VESSEL_DUPLICATE_IMO");
    });

    it("should return 401 without auth token", async () => {
      await request(app.getHttpServer()).post("/api/v1/vessels").send({}).expect(401);
    });

    it("should return 403 when user lacks vessel:create permission", async () => {
      const viewerToken = await createUserWithRole(prisma, "PORT_AGENT");

      await request(app.getHttpServer())
        .post("/api/v1/vessels")
        .set("Authorization", `Bearer ${viewerToken}`)
        .send(validVesselDto)
        .expect(403);
    });
  });

  describe("GET /api/v1/vessels", () => {
    it("should only return vessels belonging to authenticated user's company", async () => {
      // Create vessels for two different companies
      const otherCompanyId = await createOtherCompany(prisma);
      await createTestVessel(prisma, companyId, { imoNumber: "1111111" });
      await createTestVessel(prisma, otherCompanyId, { imoNumber: "2222222" });

      const response = await request(app.getHttpServer())
        .get("/api/v1/vessels")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      // Should NOT see vessels from other company — multi-tenant isolation
      const imoNumbers = response.body.data.map((v: any) => v.imoNumber);
      expect(imoNumbers).toContain("1111111");
      expect(imoNumbers).not.toContain("2222222");
    });
  });
});
```

---

## 14.5 Test Factories & Helpers

```typescript
// test/factories/vessel.factory.ts
export function createMockVessel(overrides?: Partial<Vessel>): Vessel {
  return {
    id: uuid(),
    companyId: "company-test-id",
    imoNumber:
      "9" +
      Math.floor(Math.random() * 1000000)
        .toString()
        .padStart(6, "0"),
    name: "MV Test Vessel",
    flagState: "ID",
    vesselType: VesselType.BULK_CARRIER,
    status: VesselStatus.ACTIVE,
    grossTonnage: new Decimal(12500),
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: "user-test-id",
    updatedBy: "user-test-id",
    deletedAt: null,
    ...overrides,
  };
}

export function createValidMasterCertificates(): SeafarerCertificate[] {
  const futureDate = addDays(new Date(), 365);
  return [
    createMockCertificate({ type: SeafarerCertType.COC, expiryDate: futureDate }),
    createMockCertificate({ type: SeafarerCertType.STCW_BST, expiryDate: futureDate }),
    createMockCertificate({ type: SeafarerCertType.STCW_SCRFA, expiryDate: futureDate }),
    createMockCertificate({ type: SeafarerCertType.STCW_AFF, expiryDate: futureDate }),
    createMockCertificate({ type: SeafarerCertType.MEDICAL_CERTIFICATE, expiryDate: futureDate }),
    createMockCertificate({ type: SeafarerCertType.SEAMAN_BOOK, expiryDate: futureDate }),
  ];
}
```

---

## 14.6 E2E Testing — Critical Flows

```typescript
// test/e2e/voyage-departure.spec.ts

describe("Voyage Departure Flow (E2E)", () => {
  it("should block departure when SMC is expired", async () => {
    // Setup: vessel with expired SMC
    await createVesselWithExpiredSmc();

    // Try to approve voyage departure
    const response = await request(app.getHttpServer())
      .post(`/api/v1/voyages/${voyageId}/approve-departure`)
      .set("Authorization", `Bearer ${fleetManagerToken}`)
      .expect(422);

    expect(response.body.error.code).toBe("VOYAGE_SMC_EXPIRED");
  });

  it("should complete full voyage lifecycle", async () => {
    // 1. Create voyage
    const voyage = await createVoyage();
    // 2. Sign on crew
    await signOnCrew(voyage.vesselId);
    // 3. Approve departure
    await approveDeparture(voyage.id);
    // 4. Submit noon reports
    await submitNoonReport(voyage.id);
    // 5. Complete voyage
    const completed = await completeVoyage(voyage.id);

    expect(completed.status).toBe("COMPLETED");
  });
});
```

---

## 14.7 Test Configuration

```typescript
// jest.config.ts
export default {
  projects: [
    {
      displayName: "unit",
      testMatch: ["**/__tests__/**/*.spec.ts", "**/*.spec.ts"],
      testPathIgnorePatterns: ["test/integration", "test/e2e"],
      coverageThreshold: {
        global: { lines: 80, branches: 75, functions: 80 },
      },
    },
    {
      displayName: "integration",
      testMatch: ["test/integration/**/*.spec.ts"],
      globalSetup: "./test/setup/integration.setup.ts",
      globalTeardown: "./test/setup/integration.teardown.ts",
    },
    {
      displayName: "e2e",
      testMatch: ["test/e2e/**/*.spec.ts"],
      globalSetup: "./test/setup/e2e.setup.ts",
    },
  ],
};
```

---

## 14.8 Testing Commands

```bash
# Run unit tests
pnpm test:unit

# Run integration tests (membutuhkan DB test)
pnpm test:integration

# Run E2E tests
pnpm test:e2e

# Coverage report
pnpm test:coverage

# Watch mode (development)
pnpm test:watch

# CI pipeline
pnpm test:ci   # unit + integration + coverage check
```

---

## 14.9 What AI MUST Generate Together

Setiap kali AI membuat file implementasi, WAJIB sekaligus buat test file-nya:

| File Implementasi             | File Test yang Harus Dibuat                    |
| ----------------------------- | ---------------------------------------------- |
| `vessel.entity.ts`            | `vessel.entity.spec.ts`                        |
| `register-vessel.handler.ts`  | `register-vessel.handler.spec.ts`              |
| `stcw-compliance.service.ts`  | `stcw-compliance.service.spec.ts`              |
| `vessel.controller.ts`        | `vessel.controller.integration.spec.ts`        |
| `prisma-vessel.repository.ts` | `prisma-vessel.repository.integration.spec.ts` |

**AI tidak boleh mengatakan "test bisa ditambahkan nanti".**

---

_Coverage threshold di-enforce oleh CI pipeline. PR tidak akan di-merge jika coverage turun di bawah threshold._
