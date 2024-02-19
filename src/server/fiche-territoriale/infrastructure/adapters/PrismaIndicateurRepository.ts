import { PrismaClient } from '@prisma/client';
import { IndicateurRepository } from '@/server/fiche-territoriale/domain/ports/IndicateurRepository';
import { Indicateur } from '@/server/fiche-territoriale/domain/Indicateur';

export class PrismaIndicateurRepository implements IndicateurRepository {
  constructor(private prismaClient: PrismaClient) {}

  async recupererMapIndicateursParListeChantierIdEtTerritoire({ listeChantierId, maille, codeInsee }: {
    listeChantierId: string[],
    maille: string,
    codeInsee: string,
  }): Promise<Map<string, Indicateur[]>> {

    const result = await this.prismaClient.indicateur.findMany({
      where: {
        chantier_id: {
          in: listeChantierId,
        },
        maille,
        code_insee: codeInsee,
        OR: [
          {
            est_barometre: true,
            maille,
          },
          {
            maille: 'DEPT',
            ponderation_dept: { gt: 0 },
          }, {
            maille: 'REG',
            ponderation_reg: { gt: 0 },
          },
        ],
      },
    });

    return result.reduce((acc, val) => {
      const indicateur = Indicateur.creerIndicateur({
        dateValeurActuelle: val.date_valeur_actuelle?.toISOString() || '',
      });
      acc.set(val.chantier_id, [...(acc.get(val.chantier_id) || []), indicateur]);
      return acc;
    }, new Map<string, Indicateur[]>);
  }
}
