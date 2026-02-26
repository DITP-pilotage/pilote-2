import {
  indicateur_territoire as PrismaIndicateurTerritoire,
  indicateur_identite as PrismaIndicateurIdentite,
  indicateur_territoire_jalon as PrismaIndicateurTerritoireJalon,
} from "@prisma/client";
import { IndicateurRepository } from "@/server/fiche-conducteur/domain/ports/IndicateurRepository";
import { Indicateur } from "@/server/fiche-conducteur/domain/Indicateur";
import { verifyValeurIsNotNullOrUndefined } from "@/server/utils/VerifyValeurIsNotNullOrUndefined";
import { PrismaPilote } from "@/server/db/PrismaPilote";

const convertirEnIndicateur = (
  prismaIndicateurTerritoire: PrismaIndicateurTerritoire & {
    indicateur_identite: PrismaIndicateurIdentite;
    indicateur_territoire_jalon: PrismaIndicateurTerritoireJalon[];
  },
): Indicateur => {
  const prismaIndicateurTerritoireJalon =
    prismaIndicateurTerritoire.indicateur_territoire_jalon.at(0);
  return Indicateur.creerIndicateur({
    nom: prismaIndicateurTerritoire.indicateur_identite.nom,
    type: prismaIndicateurTerritoire.indicateur_identite.type_id,
    valeurInitiale: prismaIndicateurTerritoire.valeur_initiale,
    dateValeurInitiale: prismaIndicateurTerritoire.date_valeur_initiale
      ? prismaIndicateurTerritoire.date_valeur_initiale.toISOString()
      : null,
    valeurAvancement: verifyValeurIsNotNullOrUndefined(
      prismaIndicateurTerritoireJalon?.valeur_actuelle,
    ),
    dateValeurAvancement: prismaIndicateurTerritoireJalon?.date_valeur_actuelle
      ? prismaIndicateurTerritoireJalon.date_valeur_actuelle.toISOString()
      : null,
    valeurCible: verifyValeurIsNotNullOrUndefined(
      prismaIndicateurTerritoireJalon?.valeur_cible,
    ),
    tauxAvancement: verifyValeurIsNotNullOrUndefined(
      prismaIndicateurTerritoireJalon?.taux_avancement,
    ),
  });
};

export class PrismaIndicateurRepository implements IndicateurRepository {
  constructor(private readonly dependencies: { prisma: PrismaPilote }) {}

  private get prisma() {
    return this.dependencies.prisma.getInstance();
  }

  async récupérerIndicImpactParChantierId(
    chantierId: string,
    jalon: number,
  ): Promise<Indicateur[]> {
    const result = await this.prisma.indicateur_territoire.findMany({
      where: {
        indicateur_identite: {
          statut: "PUBLIE",
          chantier_id: chantierId,
        },
        territoire_code: "NAT-FR",
        ponderation_zone_reel: {
          gt: 0,
        },
      },
      include: {
        indicateur_identite: true,
        indicateur_territoire_jalon: {
          where: {
            jalon,
          },
        },
      },
    });

    return result.map(convertirEnIndicateur);
  }
}
