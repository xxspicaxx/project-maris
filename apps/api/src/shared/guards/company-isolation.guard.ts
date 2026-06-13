import {
  type CanActivate,
  type ExecutionContext,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";

import { type RequestUser } from "../decorators/current-user.decorator";

@Injectable()
export class CompanyIsolationGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user: RequestUser = request.user;

    if (!user) {
      throw new ForbiddenException("Akses ditolak: pengguna tidak terautentikasi");
    }

    // Super admin bypasses company isolation checks
    if (user.isSuperAdmin) {
      return true;
    }

    // 1. Check companyId in route parameters
    const routeCompanyId = request.params?.companyId;
    if (routeCompanyId && routeCompanyId !== user.companyId) {
      throw new ForbiddenException(
        "Akses ditolak: Anda tidak dapat mengakses data perusahaan lain",
      );
    }

    // 2. Check companyId in request body (prevent spoofing when creating resources)
    const bodyCompanyId = request.body?.companyId;
    if (bodyCompanyId && bodyCompanyId !== user.companyId) {
      throw new ForbiddenException(
        "Akses ditolak: Anda tidak dapat membuat/mengubah data untuk perusahaan lain",
      );
    }

    // 3. Check companyId in query params
    const queryCompanyId = request.query?.companyId;
    if (queryCompanyId && queryCompanyId !== user.companyId) {
      throw new ForbiddenException(
        "Akses ditolak: Anda tidak dapat mengakses data perusahaan lain",
      );
    }

    return true;
  }
}
