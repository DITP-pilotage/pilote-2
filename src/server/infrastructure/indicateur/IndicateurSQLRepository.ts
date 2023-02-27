import { indicateur, PrismaClient } from '@prisma/client';
import IndicateurRepository from '@/server/domain/indicateur/IndicateurRepository.interface';
import Indicateur, { TypeIndicateur } from '@/server/domain/indicateur/Indicateur.interface';
import { CODES_MAILLES } from '@/server/infrastructure/maille/mailleSQLParser';
import { FichesIndicateur } from '@/server/domain/indicateur/DetailsIndicateur.interface';
import { Maille } from '@/server/domain/maille/Maille.interface';


function dateToDateStringWithoutTime(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function dateOrNullToDateStringWithoutTime(date: Date | null): string | null {
  if (date == null) {
    return null;
  }
  return dateToDateStringWithoutTime(date);
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
              evolutionDateValeurActuelle: row.evolution_date_valeur_actuelle.map(date => dateToDateStringWithoutTime(date)),
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


    const fichesIndicateur: FichesIndicateur = {};

    for (const indic of indicateurs) {
      fichesIndicateur[indic.id] = {};
      fichesIndicateur[indic.id][indic.code_insee] = {
        codeInsee: indic.code_insee,
        valeurInitiale: indic.valeur_initiale,
        dateValeurInitiale: dateOrNullToDateStringWithoutTime(indic.date_valeur_initiale),
        valeurs: indic.evolution_valeur_actuelle,
        dateValeurs: indic.evolution_date_valeur_actuelle.map((date) => dateToDateStringWithoutTime(date)),
        valeurCible: indic.objectif_valeur_cible,
        avancement: {
          global: indic.objectif_taux_avancement,
          annuel: null,
        },
      };
    }

    return fichesIndicateur;
  }
}
