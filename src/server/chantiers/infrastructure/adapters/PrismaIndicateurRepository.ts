import { indicateur as PrismaIndicateur, PrismaClient, territoire as PrismaTerritoire } from '@prisma/client';
import { DonneeIndicateur } from '@/server/chantiers/domain/DonneeIndicateur';
import { IndicateurRepository } from '@/server/chantiers/domain/ports/IndicateurRepository';

const convertirEnDonneeIndicateur = (indicateur: PrismaIndicateur & {
  territoire: PrismaTerritoire
}): DonneeIndicateur => {
  return DonneeIndicateur.creerDonneeIndicateur({
    indicId: indicateur.id,
    zoneId: indicateur.territoire.zone_id,
    maille: indicateur.maille,
    codeInsee: indicateur.code_insee,
    territoireCode: indicateur.territoire_code,
    valeurInitiale: indicateur.valeur_initiale,
    dateValeurInitiale: indicateur.date_valeur_initiale,
    valeurActuelle: indicateur.valeur_actuelle,
    dateValeurActuelle: indicateur.date_valeur_actuelle,
    valeurCibleAnnuelle: indicateur.objectif_valeur_cible_intermediaire,
    dateValeurCibleAnnuelle: indicateur.objectif_date_valeur_cible_intermediaire,
    tauxAvancementAnnuel: indicateur.objectif_taux_avancement_intermediaire,
    valeurCibleGlobale: indicateur.objectif_valeur_cible,
    dateValeurCibleGlobale: indicateur.objectif_date_valeur_cible,
    tauxAvancementGlobale: indicateur.objectif_taux_avancement,
    estBarometre: indicateur.est_barometre || false,
  });
};

export class PrismaIndicateurRepository implements IndicateurRepository {
  constructor(private prismaClient: PrismaClient) {}

  async listerParIndicId({ indicId }: { indicId: string }): Promise<DonneeIndicateur[]> {
    const prismaListeDonneesIndicateurs = await this.prismaClient.indicateur.findMany({
      where: { id: indicId },
      include: {
        territoire: true,
      },
    });
    return prismaListeDonneesIndicateurs.map(convertirEnDonneeIndicateur);
  }

  async supprimerPropositionValeurActuelle({
    indicId,
    territoireCode,
    auteurModification,
  }: {
    indicId: string,
    territoireCode: string,
    auteurModification: string,
  }): Promise<void> {
    const [maille, codeInsee] = territoireCode.split('-');
    await this.prismaClient.indicateur.update({
      where: {
        id_code_insee_maille: {
          id: indicId,
          maille,
          code_insee: codeInsee,
        },
      },
      data: {
        motif_proposition: null,
        date_proposition: null,
        valeur_actuelle_proposition: null,
        objectif_taux_avancement_intermediaire_proposition: null,
        objectif_taux_avancement_proposition: null,
        source_donnee_methode_calcul_proposition: null,
        auteur_proposition: auteurModification,
      },
    });
  }

}
