import { Maille } from "@prisma/client";
import { IndicateurRepository } from "@/server/fiche-territoriale/domain/ports/IndicateurRepository";
import { Indicateur } from "@/server/fiche-territoriale/domain/Indicateur";
import { prisma } from "@/server/db/prisma";
import { verifyValeurIsNotNullOrUndefined } from "@/server/utils/VerifyValeurIsNotNullOrUndefined";

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
        id: true,
        indicateur_territoire_jalon: {
          where: {
            jalon,
          },
          select: {
            date_valeur_actuelle: true,
            valeur_actuelle: true,
            taux_avancement: true,
            valeur_cible: true,
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
      const indicateurJalon = val.indicateur_territoire_jalon.at(0);
      const indicateur = Indicateur.creerIndicateur({
        id: val.id,
        nom: val.indicateur_identite.nom,
        dateValeurAvancement:
          indicateurJalon?.date_valeur_actuelle?.toISOString() || "",
        tauxAvancement: verifyValeurIsNotNullOrUndefined(
          indicateurJalon?.taux_avancement,
        ),
        valeurAvancement: verifyValeurIsNotNullOrUndefined(
          indicateurJalon?.valeur_actuelle,
        ),
        valeurCible: verifyValeurIsNotNullOrUndefined(
          indicateurJalon?.valeur_cible,
        ),
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
            indicateur_territoire_jalon: {
              where: {
                jalon,
              },
              select: {
                date_valeur_actuelle: true,
                valeur_actuelle: true,
                valeur_cible: true,
                taux_avancement: true,
              },
            },
          },
        },
      },
    });

    return result.reduce((acc, val) => {
      const indicateurJalon = val.indicateur_territoire
        .at(0)
        ?.indicateur_territoire_jalon.at(0);
      const indicateur = Indicateur.creerIndicateur({
        id: val.id,
        nom: val.nom,
        dateValeurAvancement:
          indicateurJalon?.date_valeur_actuelle?.toISOString() || "",
        tauxAvancement: verifyValeurIsNotNullOrUndefined(
          indicateurJalon?.taux_avancement,
        ),
        valeurAvancement: verifyValeurIsNotNullOrUndefined(
          indicateurJalon?.valeur_actuelle,
        ),
        valeurCible: verifyValeurIsNotNullOrUndefined(
          indicateurJalon?.valeur_cible,
        ),
        uniteMesure: val.unite_mesure,
      });
      acc.set(val.id, indicateur);
      return acc;
    }, new Map<string, Indicateur>());
  }
}
