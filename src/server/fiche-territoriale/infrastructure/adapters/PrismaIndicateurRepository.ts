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
            ponderation_zone_reel: { gt: 0 },
          }, {
            maille: 'REG',
            ponderation_zone_reel: { gt: 0 },
          },
        ],
      },
    });

    return result.reduce((acc, val) => {
      const indicateur = Indicateur.creerIndicateur({
        id: val.id,
        nom: val.nom,
        dateValeurActuelle: val.date_valeur_actuelle?.toISOString() || '',
        objectifTauxAvancement: val.objectif_taux_avancement,
        valeurActuelle: val.valeur_actuelle,
        valeurCible: val.objectif_valeur_cible,
        uniteMesure: val.unite_mesure,
      });
      acc.set(val.chantier_id, [...(acc.get(val.chantier_id) || []), indicateur]);
      return acc;
    }, new Map<string, Indicateur[]>());
  }

  async recupererMapIndicateursNationalParListeIndicateurId({ listeIndicateurId }: {
    listeIndicateurId: string[]
  }): Promise<Map<string, Indicateur>> {
    const result = await this.prismaClient.indicateur.findMany({
      where: {
        id: {
          in: listeIndicateurId,
        },
        maille: 'NAT',
        code_insee: 'FR',
      },
    });

    return result.reduce((acc, val) => {
      const indicateur = Indicateur.creerIndicateur({
        id: val.id,
        nom: val.nom,
        dateValeurActuelle: val.date_valeur_actuelle?.toISOString() || '',
        objectifTauxAvancement: val.objectif_taux_avancement,
        valeurActuelle: val.valeur_actuelle,
        valeurCible: val.objectif_valeur_cible,
        uniteMesure: val.unite_mesure,
      });
      acc.set(val.id, indicateur);
      return acc;
    }, new Map<string, Indicateur>()); 
  }
}
