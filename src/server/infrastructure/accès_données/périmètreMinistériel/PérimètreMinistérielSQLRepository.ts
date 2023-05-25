import { perimetre as PérimètreMinistérielPrisma, PrismaClient } from '@prisma/client';
import PérimètreMinistérielRepository from '@/server/domain/périmètreMinistériel/PérimètreMinistérielRepository.interface';
import PérimètreMinistériel from '@/server/domain/périmètreMinistériel/PérimètreMinistériel.interface';

class ErreurPérimètreNonTrouvé extends Error {
  constructor() {
    super('Erreur: périmètre ministériel non trouvé.');
  }
}

class ErreurPérimètreSansMinistère extends Error {
  constructor() {
    super('Erreur: périmètre ministériel incohérent');
  }
}

export default class PérimètreMinistérielSQLRepository implements PérimètreMinistérielRepository {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  private _mapperVersDomaine(périmètre: PérimètreMinistérielPrisma): PérimètreMinistériel {
    if (!périmètre.ministere_id || !périmètre.ministere) throw new ErreurPérimètreSansMinistère();
    return {
      id: périmètre.id,
      nom: périmètre.nom,
      ministèreId: périmètre.ministere_id,
      ministèreNom: périmètre.ministere,
    };
  }

  async récupérer(id: string): Promise<PérimètreMinistériel> {
    const périmètre = await this.prisma.perimetre.findUnique({
      where: { id: id },
    });

    if (!périmètre) throw new ErreurPérimètreNonTrouvé();

    return this._mapperVersDomaine(périmètre);
  }
}
