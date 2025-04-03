import { PrismaClient, perimetre as PérimètreMinistérielPrisma } from '@prisma/client';
import { PerimetreMinisterielRepository } from '@/server/domain/périmètreMinistériel/PerimetreMinisterielRepository.interface';
import { PerimetreMinisteriel } from '@/server/domain/périmètreMinistériel/PerimetreMinisteriel.interface';
import { PrismaPilote } from '@/server/db/PrismaPilote';

class ErreurPérimètreSansMinistère extends Error {
  constructor() {
    super('Erreur: périmètre ministériel incohérent');
  }
}

type Dependencies = {
  prisma: PrismaPilote;
};

export class PrismaPerimetreMinisterielRepository implements PerimetreMinisterielRepository {
  private prisma: PrismaClient;

  constructor({ prisma }: Dependencies) {
    this.prisma = prisma.getInstance();
  }

  private _mapperVersDomaine(périmètre: PérimètreMinistérielPrisma): PerimetreMinisteriel {
    if (!périmètre.ministere_id || !périmètre.ministere) throw new ErreurPérimètreSansMinistère();
    return {
      id: périmètre.id,
      nom: périmètre.nom,
      ministèreId: périmètre.ministere_id,
      ministèreNom: périmètre.ministere,
    };
  }

  async récupérerTous(): Promise<PerimetreMinisteriel[]> {
    const périmètres = await this.prisma.perimetre.findMany();

    return périmètres.map(périmètre => this._mapperVersDomaine(périmètre));
  }
}
