import { indicateur, PrismaClient } from '@prisma/client';
import IndicateurRepository from '@/server/domain/indicateur/IndicateurRepository.interface';
import Indicateur, { TypeIndicateur } from '@/server/domain/indicateur/Indicateur.interface';

function toDateStringWithoutTime(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export default class IndicateurSQLRepository implements IndicateurRepository {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  mapToDomain(indicateurs: indicateur[]): Indicateur[] {
    return indicateurs.map(row => {
      const evolutionDateValeurActuelle = row.evolution_date_valeur_actuelle.map(d => toDateStringWithoutTime(d));
      return ({
        id: row.id,
        nom: row.nom,
        type: row.type_id as TypeIndicateur,
        estIndicateurDuBaromètre: row.est_barometre,
        valeurInitiale: row.valeur_initiale,
        valeurActuelle: row.valeur_actuelle,
        valeurCible: row.objectif_valeur_cible,
        tauxAvancementGlobal: row.objectif_taux_avancement,
        evolutionValeurActuelle: row.evolution_valeur_actuelle,
        evolutionDateValeurActuelle,
      });
    });
  }

  async getByChantierId(chantierId: string): Promise<Indicateur[]> {
    const indicateurs: indicateur[] = await this.prisma.indicateur.findMany({
      where: { chantier_id: chantierId, maille: 'NAT' },
    });

    return this.mapToDomain(indicateurs);
  }
}
