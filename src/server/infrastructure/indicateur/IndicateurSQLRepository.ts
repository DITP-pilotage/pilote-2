import { chantier, indicateur, PrismaClient } from '@prisma/client';

export default class IndicateurSQLRepository {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  mapToDomain(indicateurs: indicateur[]) {
    return indicateurs.map(row => ({
      id: row.id,
      nom: row.nom,
      type: row.type_nom,
      estIndicateurDuBaromètre: row.est_barometre,
      valeurInitiale: row.valeur_initiale,
      valeurActuelle: row.valeur_actuelle,
      valeurCible: row.objectif_valeur_cible,
      tauxAvancementGlobal: row.objectif_taux_avancement,
    }));
  }

  async getByChantierId(chantierId: string) {
    const indicateurs: indicateur[] = await this.prisma.indicateur.findMany({
      where: { chantier_id: chantierId },
    });

    return this.mapToDomain(indicateurs);
  }
}
