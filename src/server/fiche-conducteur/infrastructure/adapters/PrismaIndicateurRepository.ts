import { indicateur_territoire as PrismaIndicateurTerritoire, indicateur_identite as PrismaIndicateurIdentite, indicateur_territoire_jalon as PrismaIndicateurTerritoireJalon, PrismaClient } from '@prisma/client';
import { IndicateurRepository } from '@/server/fiche-conducteur/domain/ports/IndicateurRepository';
import { Indicateur } from '@/server/fiche-conducteur/domain/Indicateur';
import { verifyValeurIsNotNullOrUndefined } from '@/server/utils/VerifyValeurIsNotNullOrUndefined';

const convertirEnIndicateur = (prismaIndicateurTerritoire: PrismaIndicateurTerritoire & { indicateur_identite: PrismaIndicateurIdentite, indicateur_territoire_jalon: PrismaIndicateurTerritoireJalon[] }): Indicateur => {
  const prismaIndicateurTerritoireJalon = prismaIndicateurTerritoire.indicateur_territoire_jalon.at(0);
  return Indicateur.creerIndicateur({
    nom: prismaIndicateurTerritoire.indicateur_identite.nom,
    type: prismaIndicateurTerritoire.indicateur_identite.type_id,
    valeurInitiale: prismaIndicateurTerritoire.valeur_initiale,
    dateValeurInitiale: prismaIndicateurTerritoire.date_valeur_initiale ? prismaIndicateurTerritoire.date_valeur_initiale.toISOString() : null,
    valeurActuelle: verifyValeurIsNotNullOrUndefined(prismaIndicateurTerritoireJalon?.valeur_actuelle),
    dateValeurActuelle: prismaIndicateurTerritoireJalon?.date_valeur_actuelle ? prismaIndicateurTerritoireJalon.date_valeur_actuelle.toISOString() : null,
    objectifValeurCibleIntermediaire: prismaIndicateurTerritoireJalon?.valeur_cible || null,
    objectifTauxAvancementIntermediaire: prismaIndicateurTerritoireJalon?.taux_avancement || null,
    objectifValeurCible: prismaIndicateurTerritoire.valeur_cible_mandat,
    objectifTauxAvancement: prismaIndicateurTerritoire.taux_avancement_mandat,
  });
};

export class PrismaIndicateurRepository implements IndicateurRepository {
  constructor(private prismaClient: PrismaClient) {}

  async récupérerIndicImpactParChantierId(chantierId: string, jalon: number): Promise<Indicateur[]> {
    const result = await this.prismaClient.indicateur_territoire.findMany({
      where: {
        indicateur_identite: {
          chantier_id: chantierId,
        },
        territoire_code: 'NAT-FR',
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
