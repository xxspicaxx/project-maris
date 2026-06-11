import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../../shared/database/prisma.service";
import { RoleNotFoundException } from "../../domain/exceptions/user-not-found.exception";

@Injectable()
export class RoleService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(companyId?: string) {
    const roles = await this.prisma.role.findMany({
      include: {
        rolePermissions: {
          include: {
            permission: true,
          },
        },
      },
      orderBy: { name: "asc" },
    });

    return roles.map((role) => ({
      id: role.id,
      name: role.name,
      displayName: role.displayName,
      description: role.description,
      isSystem: role.isSystem,
      permissions: role.rolePermissions.map((rp) => ({
        resource: rp.permission.resource,
        action: rp.permission.action,
        scope: rp.permission.scope,
      })),
    }));
  }

  async findById(roleId: string) {
    const role = await this.prisma.role.findUnique({
      where: { id: roleId },
      include: {
        rolePermissions: {
          include: {
            permission: true,
          },
        },
      },
    });

    if (!role) {
      throw new RoleNotFoundException(roleId);
    }

    return {
      id: role.id,
      name: role.name,
      displayName: role.displayName,
      description: role.description,
      isSystem: role.isSystem,
      permissions: role.rolePermissions.map((rp) => ({
        resource: rp.permission.resource,
        action: rp.permission.action,
        scope: rp.permission.scope,
      })),
    };
  }

  async create(data: {
    name: string;
    displayName: string;
    description?: string;
    permissionIds?: string[];
  }) {
    const role = await this.prisma.role.create({
      data: {
        name: data.name,
        displayName: data.displayName,
        description: data.description,
        rolePermissions: data.permissionIds?.length
          ? {
              create: data.permissionIds.map((permissionId) => ({
                permissionId,
              })),
            }
          : undefined,
      },
    });

    return role;
  }

  async update(
    roleId: string,
    data: {
      displayName?: string;
      description?: string;
      permissionIds?: string[];
    },
  ) {
    const role = await this.prisma.role.findUnique({ where: { id: roleId } });
    if (!role) {
      throw new RoleNotFoundException(roleId);
    }

    if (role.isSystem) {
      // System roles can only update displayName and description
      return this.prisma.role.update({
        where: { id: roleId },
        data: {
          displayName: data.displayName,
          description: data.description,
        },
      });
    }

    // Update permissions if provided
    if (data.permissionIds) {
      await this.prisma.rolePermission.deleteMany({
        where: { roleId },
      });

      if (data.permissionIds.length > 0) {
        await this.prisma.rolePermission.createMany({
          data: data.permissionIds.map((permissionId) => ({
            roleId,
            permissionId,
          })),
        });
      }
    }

    return this.prisma.role.update({
      where: { id: roleId },
      data: {
        displayName: data.displayName,
        description: data.description,
      },
    });
  }

  async delete(roleId: string) {
    const role = await this.prisma.role.findUnique({ where: { id: roleId } });
    if (!role) {
      throw new RoleNotFoundException(roleId);
    }

    if (role.isSystem) {
      throw new Error("IAM_CANNOT_DELETE_SYSTEM_ROLE");
    }

    // Delete associated user roles and role permissions
    await this.prisma.userRole.deleteMany({ where: { roleId } });
    await this.prisma.rolePermission.deleteMany({ where: { roleId } });

    return this.prisma.role.delete({ where: { id: roleId } });
  }

  async findAllPermissions() {
    return this.prisma.permission.findMany({
      orderBy: [{ resource: "asc" }, { action: "asc" }],
    });
  }

  async createPermission(data: {
    resource: string;
    action: string;
    scope: "OWN" | "COMPANY" | "ALL";
    description?: string;
  }) {
    return this.prisma.permission.create({
      data: {
        resource: data.resource,
        action: data.action,
        scope: data.scope,
        description: data.description,
      },
    });
  }
}
