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

}
