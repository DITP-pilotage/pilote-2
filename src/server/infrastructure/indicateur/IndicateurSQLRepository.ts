import { indicateur, PrismaClient } from '@prisma/client';
import IndicateurRepository from '@/server/domain/indicateur/IndicateurRepository.interface';
import Indicateur, { TypeIndicateur } from '@/server/domain/indicateur/Indicateur.interface';
import { NOMS_MAILLES } from '@/server/infrastructure/maille/mailleSQLParser';
import { EvolutionIndicateur } from '@/server/domain/indicateur/EvolutionIndicateur';

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
      return ({
        id: row.id,
        nom: row.nom,
        type: row.type_id as TypeIndicateur,
        estIndicateurDuBaromètre: row.est_barometre,
        mailles: {
          nationale: {
            FR: {
              codeInsee: 'FR',
              valeurInitiale: row.valeur_initiale,
              valeurActuelle: row.valeur_actuelle,
              valeurCible: row.objectif_valeur_cible,
              dateValeurInitiale: row.date_valeur_initiale !== null ? toDateStringWithoutTime(row.date_valeur_initiale) : null,
              dateValeurActuelle: row.date_valeur_actuelle !== null ? toDateStringWithoutTime(row.date_valeur_actuelle) : null,
              tauxAvancementGlobal: row.objectif_taux_avancement,
              evolutionValeurActuelle: row.evolution_valeur_actuelle,
              evolutionDateValeurActuelle: row.evolution_date_valeur_actuelle.map(d => toDateStringWithoutTime(d)),
            },
          },
          régionale: {},
          départementale: {},
        },
      });
    });
  }

  async getByChantierId(chantierId: string): Promise<Indicateur[]> {
    const indicateurs: indicateur[] = await this.prisma.indicateur.findMany({
      where: { chantier_id: chantierId, maille: 'NAT' },
    });

    return this.mapToDomain(indicateurs);
  }

  async getEvolutionIndicateur(chantierId: string, indicateurId: string, maille: string, codesInsee: string[]): Promise<EvolutionIndicateur[]> {
    const indicateurs: indicateur[] = await this.prisma.indicateur.findMany({
      where: {
        chantier_id: chantierId,
        id: indicateurId,
        maille: 'DEPT',
        code_insee: { in: codesInsee },
      },
    });


    const result = [];

    for (const item of indicateurs) {
      result.push({
        codeInsee: item.code_insee,
        maille: NOMS_MAILLES[item.maille],
        valeurCible: item.objectif_valeur_cible,
        évolutionValeurActuelle: item.evolution_valeur_actuelle,
        // eslint-disable-next-line unicorn/no-array-callback-reference
        évolutionDateValeurActuelle: item.evolution_date_valeur_actuelle.map(toDateStringWithoutTime),
      });
    }

    return result;
  }
}
