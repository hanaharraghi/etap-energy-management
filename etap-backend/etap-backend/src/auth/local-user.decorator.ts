import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Utilisateur } from '@prisma/client';

/**
 * Injects the local Prisma Utilisateur row (auto-provisioned from the
 * Keycloak token by LocalUserInterceptor) into a controller method.
 * Usage: @LocalUser() user: Utilisateur
 */
export const LocalUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): Utilisateur => {
    const request = ctx.switchToHttp().getRequest();
    return request.localUser;
  },
);
