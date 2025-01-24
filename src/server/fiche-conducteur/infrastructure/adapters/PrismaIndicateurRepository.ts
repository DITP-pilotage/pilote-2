import { indicateur_territoire as PrismaIndicateurTerritoire, indicateur_identite as PrismaIndicateurIdentite, indicateur_territoire_jalon as PrismaIndicateurTerritoireJalon, PrismaClient } from '@prisma/client';
import { IndicateurRepository } from '@/server/fiche-conducteur/domain/ports/IndicateurRepository';
import { Indicateur } from '@/server/fiche-conducteur/domain/Indicateur';
import {
  getAnneeAffichageDateDeBascule,
} from '@/components/_commons/IndicateursChantier/Bloc/ValeurEtDate/getDateBasculeAffichageValeursAnneePrecedente';
import { configuration } from '@/config';

const convertirEnIndicateur = (prismaIndicateurTerritoire: PrismaIndicateurTerritoire & { indicateur_identite: PrismaIndicateurIdentite, indicateur_territoire_jalon: PrismaIndicateurTerritoireJalon[] }): Indicateur => {
  return Indicateur.creerIndicateur({
    nom: prismaIndicateurTerritoire.indicateur_identite.nom,
    type: prismaIndicateurTerritoire.indicateur_identite.type_id,
    valeurInitiale: prismaIndicateurTerritoire.valeur_initiale,
    dateValeurInitiale: prismaIndicateurTerritoire.date_valeur_initiale ? prismaIndicateurTerritoire.date_valeur_initiale.toISOString() : null,
    valeurActuelle: prismaIndicateurTerritoire.valeur_actuelle,
    dateValeurActuelle: prismaIndicateurTerritoire.date_valeur_actuelle ? prismaIndicateurTerritoire.date_valeur_actuelle.toISOString() : null,
    objectifValeurCibleIntermediaire: prismaIndicateurTerritoire.indicateur_territoire_jalon.at(0)?.valeur_cible || null,
    objectifTauxAvancementIntermediaire: prismaIndicateurTerritoire.indicateur_territoire_jalon.at(0)?.taux_avancement || null,
    objectifValeurCible: prismaIndicateurTerritoire.valeur_cible_mandat,
    objectifTauxAvancement: prismaIndicateurTerritoire.taux_avancement_mandat,
  });
};

export class PrismaIndicateurRepository implements IndicateurRepository {
  constructor(private prismaClient: PrismaClient) {}

  async récupérerIndicImpactParChantierId(chantierId: string): Promise<Indicateur[]> {
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
            jalon: getAnneeAffichageDateDeBascule(new Date(), configuration.dateBasculeAffichageValeursAnneePrecedente),
          },
        },
      },
    });

    return result.map(convertirEnIndicateur);
  }
}
