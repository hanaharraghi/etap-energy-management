import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FournisseursService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.fournisseur.findMany({ orderBy: { nom: 'asc' } });
  }

  findOne(id: number) {
    return this.prisma.fournisseur.findUniqueOrThrow({ where: { id } });
  }
}
