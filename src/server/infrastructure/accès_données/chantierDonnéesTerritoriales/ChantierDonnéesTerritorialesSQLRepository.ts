import { PrismaClient } from '@prisma/client';
import { Maille } from '@/server/domain/maille/Maille.interface';
import { CodeInsee } from '@/server/domain/territoire/Territoire.interface';
import {
  DonnéesTerritoriales,
} from '@/server/domain/chantierDonnéesTerritoriales/chantierDonnéesTerritoriales.interface';
import ChantierDonnéesTerritorialesRepository from './ChantierDonnéesTerritorialesRepository.interface';

export default class ChantierDonnéesTerritorialesSQLRepository implements ChantierDonnéesTerritorialesRepository {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async récupérerTousLesAvancementsDUnChantier(): Promise<Record<Maille, Record<CodeInsee, DonnéesTerritoriales>>> {
    return {
      nationale: {},
      régionale: {},
      départementale: {},
    };
  }
}
