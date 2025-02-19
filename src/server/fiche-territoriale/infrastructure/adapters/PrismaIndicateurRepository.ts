import { Maille } from '@prisma/client';
import { IndicateurRepository } from '@/server/fiche-territoriale/domain/ports/IndicateurRepository';
import { Indicateur } from '@/server/fiche-territoriale/domain/Indicateur';
import { prisma } from '@/server/db/prisma';

export class PrismaIndicateurRepository implements IndicateurRepository {
  async recupererMapIndicateursParListeChantierIdEtTerritoire({ listeChantierId, maille, codeInsee, jalon }: {
    listeChantierId: string[],
    maille: string,
    codeInsee: string,
    jalon: number,
  }): Promise<Map<string, Indicateur[]>> {

    const result = await prisma.indicateur_identite.findMany({
      where: {
        chantier_id: {
          in: listeChantierId,
        },
        OR: [
          {
            est_barometre: true,
            indicateur_territoire: {
              every: {
                maille: maille as Maille,
                code_insee: codeInsee,
              },
            },
          }, {
            est_barometre: false,
            indicateur_territoire: {
              every: {
                maille: maille as Maille,
                code_insee: codeInsee,
                OR: [
                  {
                    maille: 'DEPT',
                    ponderation_zone_reel: { gt: 0 },
                  }, {
                    maille: 'REG',
                    ponderation_zone_reel: { gt: 0 },
                  },
                ],
              },
            },
          },
        ],
      },
      include: {
        indicateur_territoire: {
          select: {
            taux_avancement_mandat: true,
            valeur_cible_mandat: true,
            indicateur_territoire_jalon: {
              where: {
                jalon,
              },
              select: {
                date_valeur_actuelle: true,
                valeur_actuelle: true,
              },
            },
          },
        },
      },
    });

    return result.reduce((acc, val) => {
      const indicateur = Indicateur.creerIndicateur({
        id: val.id,
        nom: val.nom,
        dateValeurActuelle: val.indicateur_territoire[0].indicateur_territoire_jalon[0]?.date_valeur_actuelle?.toISOString() || '',
        objectifTauxAvancement: val.indicateur_territoire[0].taux_avancement_mandat,
        valeurActuelle: val.indicateur_territoire[0].indicateur_territoire_jalon[0]?.valeur_actuelle,
        valeurCible: val.indicateur_territoire[0].valeur_cible_mandat,
        uniteMesure: val.unite_mesure,
      });
      acc.set(val.chantier_id, [...(acc.get(val.chantier_id) || []), indicateur]);
      return acc;
    }, new Map<string, Indicateur[]>());
  }

  async recupererMapIndicateursNationalParListeIndicateurId({ listeIndicateurId, jalon }: {
    listeIndicateurId: string[]
    jalon: number
  }): Promise<Map<string, Indicateur>> {
    const result = await prisma.indicateur_identite.findMany({
      where: {
        id: {
          in: listeIndicateurId,
        },
      },
      include: {
        indicateur_territoire: {
          where: {
            territoire_code: 'NAT-FR',
          },
          select: {
            taux_avancement_mandat: true,
            valeur_cible_mandat: true,
            indicateur_territoire_jalon: {
              where: {
                jalon,
              },
              select: {
                date_valeur_actuelle: true,
                valeur_actuelle: true,
              },
            },
          },
        },
      },
    });

    return result.reduce((acc, val) => {
      const indicateur = Indicateur.creerIndicateur({
        id: val.id,
        nom: val.nom,
        dateValeurActuelle: val.indicateur_territoire[0].indicateur_territoire_jalon[0]?.date_valeur_actuelle?.toISOString() || '',
        objectifTauxAvancement: val.indicateur_territoire[0].taux_avancement_mandat,
        valeurActuelle: val.indicateur_territoire[0].indicateur_territoire_jalon[0]?.valeur_actuelle,
        valeurCible: val.indicateur_territoire[0].valeur_cible_mandat,
        uniteMesure: val.unite_mesure,
      });
      acc.set(val.id, indicateur);
      return acc;
    }, new Map<string, Indicateur>()); 
  }
}
