import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';

export type AppRole = 'ADMIN' | 'AGENT' | 'RESPONSABLE_REGIONAL';

/**
 * Restricts a route to the given realm roles.
 * Usage: @Roles('ADMIN', 'RESPONSABLE_REGIONAL') above a controller method.
 */
export const Roles = (...roles: AppRole[]) => SetMetadata(ROLES_KEY, roles);
