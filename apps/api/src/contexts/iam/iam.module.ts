import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";

import { AuthService } from "./application/services/auth.service";
import { RoleService } from "./application/services/role.service";
import { UserService } from "./application/services/user.service";
import { AuthController } from "./presentation/controllers/auth.controller";
import { RoleController } from "./presentation/controllers/role.controller";
import { UserController } from "./presentation/controllers/user.controller";
import { PrismaService } from "../../shared/database/prisma.service";
import { JwtStrategy } from "../../shared/guards/jwt.strategy";

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: "jwt" }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>("JWT_ACCESS_SECRET", "maritime-fleet-erp-secret"),
        signOptions: {
          expiresIn: "15m",
        },
      }),
    }),
  ],
  controllers: [AuthController, RoleController, UserController],
  providers: [PrismaService, AuthService, RoleService, UserService, JwtStrategy],
  exports: [AuthService, RoleService, UserService],
})
export class IamModule {}
