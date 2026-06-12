import { Test, type TestingModule } from "@nestjs/testing";
import { AuthService } from "../auth.service";
import { PrismaService } from "../../../../../shared/database/prisma.service";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { createMockUser, createMockRole } from "../../../../../../test/factories/user.factory";
import {
  InvalidCredentialsException,
  UserEmailExistsException,
  UserNotFoundException,
  AccountDisabledException,
} from "../../../domain/exceptions/user-not-found.exception";
import * as bcrypt from "bcrypt";

describe("AuthService", () => {
  let service: AuthService;
  let prisma: any;
  let jwtService: any;
  let configService: any;

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    userRole: {
      create: jest.fn(),
      deleteMany: jest.fn(),
    },
    refreshToken: {
      create: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    role: {
      findUnique: jest.fn(),
    },
  };

  const mockJwtService = {
    sign: jest.fn(),
    verify: jest.fn(),
    decode: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn().mockImplementation((key: string, defaultValue: string) => defaultValue),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prisma = module.get<PrismaService>(PrismaService);
    jwtService = module.get<JwtService>(JwtService);
    configService = module.get<ConfigService>(ConfigService);

    jest.clearAllMocks();
  });

  describe("register", () => {
    it("should register a new user successfully", async () => {
      const mockUser = createMockUser();
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue(mockUser);

      const result = await service.register({
        email: mockUser.email,
        password: "Password123!",
        firstName: mockUser.firstName,
        lastName: mockUser.lastName,
        companyId: mockUser.companyId,
      });

      expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { email: mockUser.email } });
      expect(prisma.user.create).toHaveBeenCalled();
      expect(result).toHaveProperty("id", mockUser.id);
      expect(result.email).toBe(mockUser.email);
    });

    it("should throw UserEmailExistsException if email is already taken", async () => {
      const mockUser = createMockUser();
      prisma.user.findUnique.mockResolvedValue(mockUser);

      await expect(
        service.register({
          email: mockUser.email,
          password: "Password123!",
          firstName: mockUser.firstName,
          lastName: mockUser.lastName,
          companyId: mockUser.companyId,
        }),
      ).rejects.toThrow(UserEmailExistsException);

      expect(prisma.user.create).not.toHaveBeenCalled();
    });

    it("should assign role if roleId is provided during registration", async () => {
      const mockUser = createMockUser();
      const roleId = "role-id-123";
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue(mockUser);
      prisma.userRole.create.mockResolvedValue({});

      await service.register({
        email: mockUser.email,
        password: "Password123!",
        firstName: mockUser.firstName,
        lastName: mockUser.lastName,
        companyId: mockUser.companyId,
        roleId,
      });

      expect(prisma.userRole.create).toHaveBeenCalledWith({
        data: {
          userId: mockUser.id,
          roleId,
          assignedBy: mockUser.id,
        },
      });
    });
  });

  describe("login", () => {
    it("should authenticate a user and return tokens", async () => {
      const password = "Password123!";
      const passwordHash = await bcrypt.hash(password, 12);
      const mockUser = createMockUser({ passwordHash });
      const userWithRoles = {
        ...mockUser,
        userRoles: [
          {
            role: {
              name: "FLEET_MANAGER",
              rolePermissions: [],
            },
          },
        ],
      };

      prisma.user.findUnique.mockResolvedValue(userWithRoles);
      prisma.user.update.mockResolvedValue(mockUser);
      jwtService.sign.mockReturnValueOnce("access-token").mockReturnValueOnce("refresh-token");
      prisma.refreshToken.create.mockResolvedValue({});

      const result = await service.login(mockUser.email, password);

      expect(result).toHaveProperty("accessToken", "access-token");
      expect(result).toHaveProperty("refreshToken", "refresh-token");
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        data: { lastLoginAt: expect.any(Date) },
      });
    });

    it("should throw InvalidCredentialsException if user not found", async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.login("test@email.com", "Password")).rejects.toThrow(
        InvalidCredentialsException,
      );
    });

    it("should throw AccountDisabledException if user is inactive", async () => {
      const mockUser = createMockUser({ isActive: false });
      prisma.user.findUnique.mockResolvedValue(mockUser);

      await expect(service.login(mockUser.email, "Password")).rejects.toThrow(
        AccountDisabledException,
      );
    });

    it("should throw InvalidCredentialsException if password is incorrect", async () => {
      const mockUser = createMockUser({
        passwordHash: await bcrypt.hash("correct-password", 12),
      });
      prisma.user.findUnique.mockResolvedValue(mockUser);

      await expect(service.login(mockUser.email, "wrong-password")).rejects.toThrow(
        InvalidCredentialsException,
      );
    });
  });

  describe("logout", () => {
    it("should revoke all user refresh tokens", async () => {
      const userId = "user-123";
      prisma.refreshToken.updateMany.mockResolvedValue({ count: 1 });

      await service.logout(userId);

      expect(prisma.refreshToken.updateMany).toHaveBeenCalledWith({
        where: { userId, revokedAt: null },
        data: { revokedAt: expect.any(Date) },
      });
    });
  });

  describe("getProfile", () => {
    it("should return profile if user exists", async () => {
      const mockUser = createMockUser();
      prisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.getProfile(mockUser.id);

      expect(result).toEqual(mockUser);
    });

    it("should throw UserNotFoundException if user doesn't exist", async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.getProfile("non-existent-id")).rejects.toThrow(UserNotFoundException);
    });
  });
});
