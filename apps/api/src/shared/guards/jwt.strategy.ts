import { Injectable, UnauthorizedException } from "@nestjs/common";
import { type ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { type PrismaService } from "../database/prisma.service";

interface JwtPayload {
  sub: string;
  email: string;
  companyId: string;
  roles: string[];
  permissions: string[];
  isSuperAdmin: boolean;
  iat: number;
  exp: number;
}

interface RequestUser {
  userId: string;
  email: string;
  companyId: string;
  roles: string[];
  permissions: string[];
  isSuperAdmin: boolean;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, "jwt") {
  constructor(
    configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>("JWT_ACCESS_SECRET", "maritime-fleet-erp-secret"),
    });
  }

  async validate(payload: JwtPayload): Promise<RequestUser> {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        companyId: true,
        isActive: true,
      },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException("Akun tidak ditemukan atau telah dinonaktifkan");
    }

    return {
      userId: user.id,
      email: user.email,
      companyId: user.companyId,
      roles: payload.roles || [],
      permissions: payload.permissions || [],
      isSuperAdmin: payload.isSuperAdmin || false,
    };
  }
}
