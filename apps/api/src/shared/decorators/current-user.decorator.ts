import { createParamDecorator, ExecutionContext } from "@nestjs/common";

export interface RequestUser {
  userId: string;
  email: string;
  companyId: string;
  roles: string[];
  permissions: string[];
  vesselIds?: string[];
  isSuperAdmin: boolean;
}

export const CurrentUser = createParamDecorator(
  (data: keyof RequestUser | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user: RequestUser = request.user;
    if (!user) return undefined;
    return data ? user[data] : user;
  },
);
