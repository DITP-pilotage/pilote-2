import { indicateur, PrismaClient } from '@prisma/client';
import IndicateurRepository from '@/server/domain/indicateur/IndicateurRepository.interface';
import Indicateur, { TypeIndicateur } from '@/server/domain/indicateur/Indicateur.interface';
import { CODES_MAILLES } from '@/server/infrastructure/maille/mailleSQLParser';
import { FichesIndicateur } from '@/server/domain/indicateur/DetailsIndicateur';
import { Maille } from '@/server/domain/chantier/Chantier.interface';


function dateOrNullToDateStringWithoutTime(d: Date | null): string | null {
  if (d == null) {
    return null;
  }
  return d.toISOString().slice(0, 10);
}

function dateToDateStringWithoutTime(d: Date): string {
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
              dateValeurInitiale: row.date_valeur_initiale !== null ? dateToDateStringWithoutTime(row.date_valeur_initiale) : null,
              dateValeurActuelle: row.date_valeur_actuelle !== null ? dateToDateStringWithoutTime(row.date_valeur_actuelle) : null,
              tauxAvancementGlobal: row.objectif_taux_avancement,
              evolutionValeurActuelle: row.evolution_valeur_actuelle,
              evolutionDateValeurActuelle: row.evolution_date_valeur_actuelle.map(d => dateToDateStringWithoutTime(d)),
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

  async getDetailsIndicateur(chantierId: string, maille: Maille, codesInsee: string[]): Promise<FichesIndicateur> {
    const indicateurs: indicateur[] = await this.prisma.indicateur.findMany({
      where: {
        chantier_id: chantierId,
        maille: CODES_MAILLES[maille],
        code_insee: { in: codesInsee },
      },
    });


    const result: FichesIndicateur = {};

    for (const item of indicateurs) {
      result[item.id] = {};
      result[item.id][item.code_insee] = {
        codeInsee: item.code_insee,
        valeurInitiale: item.valeur_initiale,
        dateValeurInitiale: dateOrNullToDateStringWithoutTime(item.date_valeur_initiale),
        valeurs: item.evolution_valeur_actuelle,
        // eslint-disable-next-line unicorn/no-array-callback-reference
        dateValeurs: item.evolution_date_valeur_actuelle.map(dateToDateStringWithoutTime),
        valeurCible: item.objectif_valeur_cible,
        avancement: {
          global: item.objectif_taux_avancement,
          annuel: null,
        },
      };
    }

    return result;
  }
}
