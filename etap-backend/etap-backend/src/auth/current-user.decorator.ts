import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface KeycloakUser {
  keycloakId: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: string[];
}

/**
 * Injects the decoded Keycloak user (attached by KeycloakAuthGuard) into a
 * controller method parameter. Usage: @CurrentUser() user: KeycloakUser
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): KeycloakUser => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
