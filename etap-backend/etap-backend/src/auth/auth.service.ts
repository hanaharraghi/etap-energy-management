import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { KeycloakUser } from './current-user.decorator';
import { RoleType } from '@prisma/client';

const ROLE_PRIORITY: RoleType[] = ['ADMIN', 'RESPONSABLE_REGIONAL', 'AGENT'];

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService) {}

  /**
   * Finds the local profile for a Keycloak identity, creating it on first
   * request. The role stored locally is the highest-priority realm role
   * present on the token at that moment (kept in sync on every login).
   */
  async upsertFromKeycloak(kcUser: KeycloakUser) {
    const role = ROLE_PRIORITY.find((r) => kcUser.roles.includes(r)) ?? 'AGENT';

    return this.prisma.utilisateur.upsert({
      where: { keycloakId: kcUser.keycloakId },
      update: {
        email: kcUser.email,
        nom: kcUser.lastName,
        prenom: kcUser.firstName,
        role,
      },
      create: {
        keycloakId: kcUser.keycloakId,
        email: kcUser.email || `${kcUser.keycloakId}@unknown.local`,
        nom: kcUser.lastName || 'Inconnu',
        prenom: kcUser.firstName || 'Utilisateur',
        role,
      },
    });
  }
}
