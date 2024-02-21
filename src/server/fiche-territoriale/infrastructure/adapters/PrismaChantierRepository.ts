import { chantier as ChantierModel, PrismaClient } from '@prisma/client';
import { ChantierRepository } from '@/server/fiche-territoriale/domain/ports/ChantierRepository';
import { Chantier } from '@/server/fiche-territoriale/domain/Chantier';
import { MeteoDisponible } from '@/server/fiche-territoriale/domain/MeteoDisponible';

export class PrismaChantierRepository implements ChantierRepository {
  constructor(private prismaClient: PrismaClient) {}

  async listerParTerritoireCodePourUnDepartement({ territoireCode }: { territoireCode: string }): Promise<Chantier[]> {
    const result = await this.prismaClient.chantier.findMany({
      where: {
        territoire_code: territoireCode,
        maille: 'DEPT',
        est_barometre: true,
        OR: [
          { a_taux_avancement_departemental: true },
          { a_meteo_departemental: true },
          { est_territorialise: true },
        ],
      },
    });

    return result.map(this.convertirEnChantier);
  }

  async listerParTerritoireCodePourUneRegion({ territoireCode }: { territoireCode: string }): Promise<Chantier[]> {
    const result = await this.prismaClient.chantier.findMany({
      where: {
        territoire_code: territoireCode,
        maille: 'REG',
        est_barometre: true,
        OR: [
          { a_taux_avancement_regional: true },
          { a_meteo_regional: true },
          { est_territorialise: true },
        ],
      },
    });

    return result.map(this.convertirEnChantier);
  }

  private convertirEnChantier(chantierModel: ChantierModel): Chantier {
    return Chantier.creerChantier({
      id: chantierModel.id,
      tauxAvancement: chantierModel.taux_avancement,
      tauxAvancementAnnuel: chantierModel.taux_avancement_annuel,
      meteo: chantierModel.meteo as MeteoDisponible | null,
      nom: chantierModel.nom,
      codeMinisterePorteur: chantierModel.ministeres.at(0),
    });
  }

}
