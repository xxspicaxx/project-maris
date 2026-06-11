import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { PrismaService } from "../database/prisma.service";
import { PERMISSIONS_KEY } from "../decorators/permissions.decorator";

@Injectable()
export class RbacGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // If no permissions required, allow access (public endpoint)
    if (!requiredPermissions?.length) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException("Akses ditolak: pengguna tidak terautentikasi");
    }

    // Super admin bypasses all permission checks
    if (user.isSuperAdmin) {
      return true;
    }

    // Check if user has any of the required permissions
    const userPermissions = user.permissions || [];
    const hasPermission = requiredPermissions.some((permission) =>
      userPermissions.includes(permission),
    );

    if (!hasPermission) {
      // Check vessel-scoped permissions if vesselId is in params
      const vesselId = request.params?.vesselId;
      if (vesselId && user.vesselIds?.includes(vesselId)) {
        return true;
      }

      throw new ForbiddenException("Anda tidak memiliki izin untuk melakukan aksi ini");
    }

    return true;
  }
}
