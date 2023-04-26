import { indicateur, PrismaClient } from '@prisma/client';
import IndicateurRepository from '@/server/domain/indicateur/IndicateurRepository.interface';
import Indicateur, { TypeIndicateur } from '@/server/domain/indicateur/Indicateur.interface';
import { CODES_MAILLES, NOMS_MAILLES } from '@/server/infrastructure/accès_données/maille/mailleSQLParser';
import { DétailsIndicateurs } from '@/server/domain/indicateur/DétailsIndicateur.interface';
import { Maille } from '@/server/domain/maille/Maille.interface';
import { CodeInsee } from '@/server/domain/territoire/Territoire.interface';

export default class IndicateurSQLRepository implements IndicateurRepository {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  private _mapToDomain(indicateurs: indicateur[]): Indicateur[] {
    return indicateurs.map(row => {
      return ({
        id: row.id,
        nom: row.nom,
        type: row.type_id as TypeIndicateur,
        estIndicateurDuBaromètre: row.est_barometre ?? false,
        description: row.description,
        source: row.source,
        modeDeCalcul: row.mode_de_calcul,
        chantierId: row.chantier_id,
        maille: NOMS_MAILLES[row.maille],
        codeInsee: row.code_insee,
      });
    });
  }

  private _mapDétailsToDomain(indicateurs: indicateur[]): DétailsIndicateurs {
    const détailsIndicateurs: DétailsIndicateurs = {};

    for (const indic of indicateurs) {
      if (!détailsIndicateurs[indic.id]) {
        détailsIndicateurs[indic.id] = {};
      }

      détailsIndicateurs[indic.id][indic.code_insee] = {
        codeInsee: indic.code_insee,
        valeurInitiale: indic.valeur_initiale,
        dateValeurInitiale: indic.date_valeur_initiale !== null ? indic.date_valeur_initiale.toISOString() : null,
        valeurs: indic.evolution_valeur_actuelle ?? [],
        dateValeurs: indic.evolution_date_valeur_actuelle.map((date) => date.toISOString()) ?? [],
        valeurCible: indic.objectif_valeur_cible,
        avancement: {
          global: indic.objectif_taux_avancement,
          annuel: null,
        },
      };
    }

    return détailsIndicateurs;
  }

  async récupérerTous(): Promise<Indicateur[]> {
    const indicateurs: indicateur[] = await this.prisma.indicateur.findMany();

    return this._mapToDomain(indicateurs);
  }

  async récupérerParChantierId(chantierId: string): Promise<Indicateur[]> {
    const indicateurs: indicateur[] = await this.prisma.indicateur.findMany({
      where: { chantier_id: chantierId, maille: 'NAT' },
    });
    
    return this._mapToDomain(indicateurs);
  }

  async récupérerDétails(indicateurId: string, maille: Maille): Promise<DétailsIndicateurs> {
    const indicateurs: indicateur[] = await this.prisma.indicateur.findMany({
      where: { 
        id: indicateurId,
        maille: CODES_MAILLES[maille],
      },
    });

    return this._mapDétailsToDomain(indicateurs);
  }

  async récupererDétailsParChantierIdEtTerritoire(chantierId: string, maille: Maille, codesInsee: CodeInsee[]): Promise<DétailsIndicateurs> {
    const indicateurs: indicateur[] = await this.prisma.indicateur.findMany({
      where: {
        chantier_id: chantierId,
        maille: CODES_MAILLES[maille],
        code_insee: { in: codesInsee },
      },
    });

    return this._mapDétailsToDomain(indicateurs);
  }
}
