import { indicateur, PrismaClient } from '@prisma/client';
import IndicateurRepository from '@/server/domain/indicateur/IndicateurRepository.interface';
import Indicateur, { TypesAvancement } from '@/server/domain/indicateur/Indicateur.interface';

export default class IndicateurSQLRepository implements IndicateurRepository {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  mapToDomain(indicateurs: indicateur[]): Indicateur[] {
    return indicateurs.map(row => ({
      id: row.id,
      nom: row.nom,
      type: row.type_nom as TypesAvancement || 'CONTEXTE', // TODO: que fait-on des nulls, qui sont la majorité ?
      estIndicateurDuBaromètre: row.est_barometre,
      valeurInitiale: row.valeur_initiale,
      valeurActuelle: row.valeur_actuelle,
      valeurCible: row.objectif_valeur_cible,
      tauxAvancementGlobal: row.objectif_taux_avancement,
    }));
  }

  async getByChantierId(chantierId: string): Promise<Indicateur[]> {
    const indicateurs: indicateur[] = await this.prisma.indicateur.findMany({
      where: { chantier_id: chantierId, maille: 'NAT' },
    });

    return this.mapToDomain(indicateurs);
  }
}
