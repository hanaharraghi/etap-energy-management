import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UtilisateursService {
  constructor(private prisma: PrismaService) {}

  /** GET /utilisateurs — matches (Utilisateur & { avatar, dept, lastLogin })[] */
  async findAll() {
    const users = await this.prisma.utilisateur.findMany({
      orderBy: { nom: 'asc' },
    });
    return users.map((u: any) => ({
      ...u,
      avatar: `${u.prenom?.[0] ?? ''}${u.nom?.[0] ?? ''}`.toUpperCase(),
      dept: u.dept ?? '—',
      // Real "last login" requires reading Keycloak's session/event API —
      // not stored locally. Wire this up via Keycloak's Admin REST API
      // (GET /admin/realms/{realm}/users/{id}/sessions) if you need it
      // to be exact; for now this reflects our own dateCreation as a stand-in.
      lastLogin: '—',
    }));
  }
}
