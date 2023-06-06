import { indicateur_projet_structurant as IndicateurProjetStructurantPrisma, PrismaClient } from '@prisma/client';
import Indicateur, { TypeIndicateur } from '@/server/domain/indicateur/Indicateur.interface';
import IndicateurProjetStructurantRepository from '@/server/domain/indicateur/IndicateurProjetStructurantRepository.interface';

export default class IndicateurProjetStructurantSQLRepository implements IndicateurProjetStructurantRepository {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }
  
  private _mapperVersDomaine(indicateur: IndicateurProjetStructurantPrisma): Indicateur {
    return ({
      id: indicateur.id,
      nom: indicateur.nom,
      type: indicateur.type_id as TypeIndicateur,
      estIndicateurDuBaromètre: false,
      description: indicateur.description,
      source: indicateur.source,
      modeDeCalcul: indicateur.mode_de_calcul,
    });
  }
  
  async récupérerParProjetStructurant(projetStructurantId: string): Promise<Indicateur[]> {
    const indicateurs: IndicateurProjetStructurantPrisma[] = await this.prisma.indicateur_projet_structurant.findMany({
      where: {
        projet_structurant_code: projetStructurantId,
        NOT: {
          type_id: null,
        },
      },
    });
    
    return indicateurs.map(indicateur => this._mapperVersDomaine(indicateur));
  }
}
