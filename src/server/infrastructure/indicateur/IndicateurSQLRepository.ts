import { indicateur, PrismaClient } from '@prisma/client';
import IndicateurRepository from '@/server/domain/indicateur/IndicateurRepository.interface';
import Indicateur, { CartographieIndicateur, TypeIndicateur } from '@/server/domain/indicateur/Indicateur.interface';
import { CODES_MAILLES } from '@/server/infrastructure/maille/mailleSQLParser';
import { FichesIndicateurs } from '@/server/domain/indicateur/DétailsIndicateur.interface';
import { Maille, MailleInterne } from '@/server/domain/maille/Maille.interface';


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
              dateValeurInitiale: row.date_valeur_initiale !== null ? row.date_valeur_initiale.toISOString() : null,
              dateValeurActuelle: row.date_valeur_actuelle !== null ? row.date_valeur_actuelle.toISOString() : null,
              tauxAvancementGlobal: row.objectif_taux_avancement,
              evolutionValeurActuelle: row.evolution_valeur_actuelle,
              evolutionDateValeurActuelle: row.evolution_date_valeur_actuelle.map(date => date.toISOString()),
            },
          },
          régionale: {},
          départementale: {},
        },
        source: row.source,
        description: row.description,
        modeDeCalcul: row.mode_de_calcul,
      });
    });
  }

  async getByChantierId(chantierId: string): Promise<Indicateur[]> {
    const indicateurs: indicateur[] = await this.prisma.indicateur.findMany({
      where: { chantier_id: chantierId, maille: 'NAT' },
    });
    return this.mapToDomain(indicateurs);
  }

  async getCartographieDonnéesParMailleEtIndicateurId(indicateurId: string, mailleInterne: MailleInterne): Promise<CartographieIndicateur> {
    const indicateurs: indicateur[] = await this.prisma.indicateur.findMany({
      where: {
        id: indicateurId,
        maille: CODES_MAILLES[mailleInterne],
      },
    });

    return Object.fromEntries(
      indicateurs.map(
        (indic) =>
          [indic.code_insee, {
            avancementAnnuel: indic.objectif_taux_avancement,
            valeurActuelle: indic.valeur_actuelle,
          }],
      ),
    );
  }

  async getFichesIndicateurs(chantierId: string, maille: Maille, codesInsee: string[]): Promise<FichesIndicateurs> {
    const indicateurs: indicateur[] = await this.prisma.indicateur.findMany({
      where: {
        chantier_id: chantierId,
        maille: CODES_MAILLES[maille],
        code_insee: { in: codesInsee },
      },
    });

    const fichesIndicateurs: FichesIndicateurs = {};

    for (const indic of indicateurs) {
      if (!fichesIndicateurs[indic.id]) {
        fichesIndicateurs[indic.id] = {};
      }
      fichesIndicateurs[indic.id][indic.code_insee] = {
        codeInsee: indic.code_insee,
        valeurInitiale: indic.valeur_initiale,
        dateValeurInitiale: indic.date_valeur_initiale !== null ? indic.date_valeur_initiale.toISOString() : null,
        valeurs: indic.evolution_valeur_actuelle,
        dateValeurs: indic.evolution_date_valeur_actuelle.map((date) => date.toISOString()),
        valeurCible: indic.objectif_valeur_cible,
        avancement: {
          global: indic.objectif_taux_avancement,
          annuel: null,
        },
      };
    }

    return fichesIndicateurs;
  }
}
