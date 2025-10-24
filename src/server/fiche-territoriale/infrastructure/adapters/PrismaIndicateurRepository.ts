import { Maille } from "@prisma/client";
import { IndicateurRepository } from "@/server/fiche-territoriale/domain/ports/IndicateurRepository";
import { Indicateur } from "@/server/fiche-territoriale/domain/Indicateur";
import { prisma } from "@/server/db/prisma";

export class PrismaIndicateurRepository implements IndicateurRepository {
  async recupererMapIndicateursParListeChantierIdEtTerritoire({
    listeChantierId,
    maille,
    codeInsee,
    jalon,
  }: {
    listeChantierId: string[];
    maille: string;
    codeInsee: string;
    jalon: number;
  }): Promise<Map<string, Indicateur[]>> {
    const result = await prisma.indicateur_territoire.findMany({
      where: {
        maille: maille as Maille,
        code_insee: codeInsee,
        indicateur_identite: {
          chantier_id: {
            in: listeChantierId,
          },
        },
        OR: [
          {
            indicateur_identite: {
              est_barometre: true,
            },
            maille: maille as Maille,
          },
          {
            maille: "DEPT",
            ponderation_zone_reel: { gt: 0 },
          },
          {
            maille: "REG",
            ponderation_zone_reel: { gt: 0 },
          },
        ],
      },
      select: {
        taux_avancement_mandat: true,
        valeur_cible_mandat: true,
        id: true,
        indicateur_territoire_jalon: {
          where: {
            jalon,
          },
          select: {
            date_valeur_actuelle: true,
            valeur_actuelle: true,
          },
        },
        indicateur_identite: {
          select: {
            nom: true,
            unite_mesure: true,
            chantier_id: true,
          },
        },
      },
    });

    return result.reduce((acc, val) => {
      const indicateur = Indicateur.creerIndicateur({
        id: val.id,
        nom: val.indicateur_identite.nom,
        dateValeurAvancement:
          val.indicateur_territoire_jalon[0]?.date_valeur_actuelle?.toISOString() ||
          "",
        objectifTauxAvancement: val.taux_avancement_mandat,
        valeurAvancement: val.indicateur_territoire_jalon[0]?.valeur_actuelle,
        valeurCible: val.valeur_cible_mandat,
        uniteMesure: val.indicateur_identite.unite_mesure,
      });
      acc.set(val.indicateur_identite.chantier_id, [
        ...(acc.get(val.indicateur_identite.chantier_id) || []),
        indicateur,
      ]);
      return acc;
    }, new Map<string, Indicateur[]>());
  }

  async recupererMapIndicateursNationalParListeIndicateurId({
    listeIndicateurId,
    jalon,
  }: {
    listeIndicateurId: string[];
    jalon: number;
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
            territoire_code: "NAT-FR",
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
        dateValeurAvancement:
          val.indicateur_territoire[0].indicateur_territoire_jalon[0]?.date_valeur_actuelle?.toISOString() ||
          "",
        objectifTauxAvancement:
          val.indicateur_territoire[0].taux_avancement_mandat,
        valeurAvancement:
          val.indicateur_territoire[0].indicateur_territoire_jalon[0]
            ?.valeur_actuelle,
        valeurCible: val.indicateur_territoire[0].valeur_cible_mandat,
        uniteMesure: val.unite_mesure,
      });
      acc.set(val.id, indicateur);
      return acc;
    }, new Map<string, Indicateur>());
  }
}
