import { Injectable } from "@nestjs/common";

import { PrismaService } from "../../../../shared/database/prisma.service";
import { UserNotFoundException } from "../../domain/exceptions/user-not-found.exception";

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(companyId: string) {
    return this.prisma.user.findMany({
      where: { companyId, deletedAt: null },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
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
      orderBy: { createdAt: "desc" },
    });
  }

  async findById(userId: string, companyId: string) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, companyId, deletedAt: null },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
        company: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        userRoles: {
          include: {
            role: {
              select: {
                id: true,
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

  async update(
    userId: string,
    companyId: string,
    data: {
      firstName?: string;
      lastName?: string;
      phone?: string;
      isActive?: boolean;
    },
  ) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, companyId, deletedAt: null },
    });

    if (!user) {
      throw new UserNotFoundException(userId);
    }

    return this.prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        isActive: true,
      },
    });
  }

  async assignRole(userId: string, roleId: string, assignedBy: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new UserNotFoundException(userId);
    }

    return this.prisma.userRole.create({
      data: {
        userId,
        roleId,
        createdBy: assignedBy,
        updatedBy: assignedBy,
      },
    });
  }

  async removeRole(userId: string, roleId: string) {
    await this.prisma.userRole.deleteMany({
      where: { userId, roleId },
    });
  }

  async softDelete(userId: string, companyId: string) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, companyId, deletedAt: null },
    });

    if (!user) {
      throw new UserNotFoundException(userId);
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: {
        deletedAt: new Date(),
        isActive: false,
      },
    });
  }
}
