import { indicateur as IndicateurModel, PrismaClient } from '@prisma/client';
import { IndicateurRepository } from '@/server/fiche-conducteur/domain/ports/IndicateurRepository';
import { Indicateur } from '@/server/fiche-conducteur/domain/Indicateur';

const convertirEnIndicateur = (indicateurModel: IndicateurModel): Indicateur => {
  return Indicateur.creerIndicateur({
    nom: indicateurModel.nom,
    valeurInitiale: indicateurModel.valeur_initiale,
    dateValeurInitiale: indicateurModel.date_valeur_initiale ? indicateurModel.date_valeur_initiale.toISOString() : null,
    valeurActuelle: indicateurModel.valeur_actuelle,
    dateValeurActuelle: indicateurModel.date_valeur_actuelle ? indicateurModel.date_valeur_actuelle.toISOString() : null,
    objectifValeurCibleIntermediaire: indicateurModel.objectif_valeur_cible_intermediaire,
    objectifTauxAvancementIntermediaire: indicateurModel.objectif_taux_avancement_intermediaire,
    objectifValeurCible: indicateurModel.objectif_valeur_cible,
    objectifTauxAvancement: indicateurModel.objectif_taux_avancement,
  });
};

export class PrismaIndicateurRepository implements IndicateurRepository {
  constructor(private prismaClient: PrismaClient) {}

  async récupérerIndicImpactParChantierId(chantierId: string): Promise<Indicateur[]> {
    const result = await this.prismaClient.indicateur.findMany({
      where: {
        chantier_id: chantierId,
        territoire_code: 'NAT-FR',
        ponderation_nat: {
          gt: 0,
        },
        type_id: 'IMPACT',
      },
    });

    return result.map(convertirEnIndicateur);
  }
}
