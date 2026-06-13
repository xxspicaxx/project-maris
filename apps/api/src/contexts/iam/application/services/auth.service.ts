import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";

import { PrismaService } from "../../../../shared/database/prisma.service";
import {
  AccountDisabledException,
  InvalidCredentialsException,
  UserEmailExistsException,
  UserNotFoundException,
} from "../../domain/exceptions/user-not-found.exception";

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
    companyId: string;
    roleId?: string;
  }) {
    // Check if email already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new UserEmailExistsException(data.email);
    }

    // Hash password
    const passwordHash = await bcrypt.hash(data.password, 12);

    // Create user
    const user = await this.prisma.user.create({
      data: {
        email: data.email,
        passwordHash,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        companyId: data.companyId,
      },
    });

    // Assign default role if provided
    if (data.roleId) {
      await this.prisma.userRole.create({
        data: {
          userId: user.id,
          roleId: data.roleId,
          assignedBy: user.id,
        },
      });
    }

    const roles = data.roleId ? [data.roleId] : [];

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      companyId: user.companyId,
      isActive: user.isActive,
      roles,
    };
  }

  async login(email: string, password: string) {
    // Find user
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        userRoles: {
          include: {
            role: {
              include: {
                rolePermissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new InvalidCredentialsException();
    }

    if (!user.isActive) {
      throw new AccountDisabledException();
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new InvalidCredentialsException();
    }

    // Get roles and permissions
    const roles = user.userRoles.map((ur) => ur.role.name);
    const permissions = [
      ...new Set(
        user.userRoles.flatMap((ur) =>
          ur.role.rolePermissions.map((rp) => `${rp.permission.resource}:${rp.permission.action}`),
        ),
      ),
    ];

    // Update last login
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Generate tokens
    const payload = {
      sub: user.id,
      email: user.email,
      companyId: user.companyId,
      roles,
      permissions,
      isSuperAdmin: roles.includes("SUPER_ADMIN"),
    };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: "15m",
      secret: this.configService.get<string>("JWT_ACCESS_SECRET", "maritime-fleet-erp-secret"),
    });

    const refreshToken = this.jwtService.sign(
      { sub: user.id, type: "refresh" },
      {
        expiresIn: "7d",
        secret: this.configService.get<string>(
          "JWT_REFRESH_SECRET",
          "maritime-fleet-erp-refresh-secret",
        ),
      },
    );

    // Store refresh token hash in DB for revocation
    const refreshTokenHash = await bcrypt.hash(refreshToken, 10);
    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: refreshTokenHash,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    return {
      accessToken,
      refreshToken,
      tokenType: "Bearer",
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        companyId: user.companyId,
        roles,
        permissions,
      },
    };
  }

  async refresh(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>(
          "JWT_REFRESH_SECRET",
          "maritime-fleet-erp-refresh-secret",
        ),
      });

      if (payload.type !== "refresh") {
        throw new InvalidCredentialsException();
      }

      // Find user
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        include: {
          userRoles: {
            include: {
              role: {
                include: {
                  rolePermissions: {
                    include: {
                      permission: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      if (!user || !user.isActive) {
        throw new AccountDisabledException();
      }

      // Check if refresh token has been revoked
      const storedTokens = await this.prisma.refreshToken.findMany({
        where: {
          userId: user.id,
          revokedAt: null,
          expiresAt: { gt: new Date() },
        },
        orderBy: { createdAt: "desc" },
        take: 5,
      });

      const isValidToken = await Promise.any(
        storedTokens.map(async (stored) => bcrypt.compare(refreshToken, stored.token)),
      ).catch(() => false);

      if (!isValidToken) {
        // Revoke all tokens for this user (possible token theft)
        await this.prisma.refreshToken.updateMany({
          where: { userId: user.id, revokedAt: null },
          data: { revokedAt: new Date() },
        });
        throw new InvalidCredentialsException();
      }

      // Revoke the used refresh token
      const tokenRecord = storedTokens[0];
      if (tokenRecord) {
        await this.prisma.refreshToken.update({
          where: { id: tokenRecord.id },
          data: { revokedAt: new Date() },
        });
      }

      // Generate new tokens
      const roles = user.userRoles.map((ur) => ur.role.name);
      const permissions = [
        ...new Set(
          user.userRoles.flatMap((ur) =>
            ur.role.rolePermissions.map(
              (rp) => `${rp.permission.resource}:${rp.permission.action}`,
            ),
          ),
        ),
      ];

      const newPayload = {
        sub: user.id,
        email: user.email,
        companyId: user.companyId,
        roles,
        permissions,
        isSuperAdmin: roles.includes("SUPER_ADMIN"),
      };

      const newAccessToken = this.jwtService.sign(newPayload, {
        expiresIn: "15m",
        secret: this.configService.get<string>("JWT_ACCESS_SECRET", "maritime-fleet-erp-secret"),
      });

      const newRefreshToken = this.jwtService.sign(
        { sub: user.id, type: "refresh" },
        {
          expiresIn: "7d",
          secret: this.configService.get<string>(
            "JWT_REFRESH_SECRET",
            "maritime-fleet-erp-refresh-secret",
          ),
        },
      );

      // Store new refresh token
      const newRefreshTokenHash = await bcrypt.hash(newRefreshToken, 10);
      await this.prisma.refreshToken.create({
        data: {
          userId: user.id,
          token: newRefreshTokenHash,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      });

      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        tokenType: "Bearer",
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          companyId: user.companyId,
          roles,
          permissions,
        },
      };
    } catch (error) {
      if (
        error instanceof InvalidCredentialsException ||
        error instanceof AccountDisabledException
      ) {
        throw error;
      }
      throw new InvalidCredentialsException();
    }
  }

  async logout(userId: string) {
    // Revoke all active refresh tokens for this user
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        companyId: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
        company: {
          select: {
            id: true,
            name: true,
            code: true,
            type: true,
          },
        },
        userRoles: {
          include: {
            role: {
              select: {
                name: true,
                displayName: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new UserNotFoundException(userId);
    }

    return user;
  }

  async forgotPassword(email: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      this.logger.warn(`Password reset requested for non-existent email: ${email}`);
      return;
    }

    const secret =
      this.configService.get<string>("JWT_ACCESS_SECRET", "maritime-fleet-erp-secret") +
      user.passwordHash;

    const token = this.jwtService.sign(
      { sub: user.id, email: user.email, type: "password-reset" },
      { expiresIn: "15m", secret },
    );

    const resetLink = `http://localhost:3000/reset-password?token=${token}`;
    this.logger.log(`\n==================================================\n`);
    this.logger.log(`[PASSWORD RESET LINK FOR ${user.email}]:\n${resetLink}`);
    this.logger.log(`\n==================================================\n`);
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const decoded = this.jwtService.decode(token) as {
      sub: string;
      email: string;
      type: string;
    } | null;
    if (!decoded || decoded.type !== "password-reset") {
      throw new InvalidCredentialsException();
    }

    const user = await this.prisma.user.findUnique({
      where: { id: decoded.sub },
    });

    if (!user || !user.isActive) {
      throw new UserNotFoundException(decoded.sub);
    }

    const secret =
      this.configService.get<string>("JWT_ACCESS_SECRET", "maritime-fleet-erp-secret") +
      user.passwordHash;

    try {
      this.jwtService.verify(token, { secret });
    } catch {
      throw new InvalidCredentialsException();
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);

    await this.prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    });

    await this.prisma.refreshToken.updateMany({
      where: { userId: user.id, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    this.logger.log(`Password reset successfully for user: ${user.email}`);
  }
}
