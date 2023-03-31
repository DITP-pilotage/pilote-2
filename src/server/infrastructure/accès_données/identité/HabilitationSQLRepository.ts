import { PrismaClient } from '@prisma/client';
import HabilitationRepository from '@/server/domain/identité/HabilitationRepository';
import { Habilitation } from '@/server/domain/identité/Habilitation';

export default class HabilitationSQLRepository implements HabilitationRepository {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async récupèreHabilitationsPourUtilisateur(_utilisateurId: string): Promise<Habilitation> {
    return {
      'chantiers': {
        'CH-1023781': ['lecture', 'lecture', 'lecture', 'lecture', 'lecture'],
        'CH-1477419': ['lecture'],
        'CH-1497629': ['lecture'],
        'CH-1102134': ['lecture'],
        'CH-1188722': ['lecture'],
        'CH-1213658': ['lecture'],
        'CH-1215922': ['lecture', 'écriture'],
      },
    };
  }
}
