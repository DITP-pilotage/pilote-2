import { indicateur as IndicateurPrisma, PrismaClient } from '@prisma/client';
import IndicateurRepository from '@/server/domain/indicateur/IndicateurRepository.interface';
import Indicateur, { TypeIndicateur } from '@/server/domain/indicateur/Indicateur.interface';
import { CODES_MAILLES } from '@/server/infrastructure/accès_données/maille/mailleSQLParser';
import { DétailsIndicateurs } from '@/server/domain/indicateur/DétailsIndicateur.interface';
import { Maille } from '@/server/domain/maille/Maille.interface';
import { CodeInsee } from '@/server/domain/territoire/Territoire.interface';
import { groupByAndTransform } from '@/client/utils/arrays';
import Chantier from '@/server/domain/chantier/Chantier.interface';

export default class IndicateurSQLRepository implements IndicateurRepository {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  private _mapToDomain(indicateur: IndicateurPrisma): Indicateur {
    return ({
      id: indicateur.id,
      nom: indicateur.nom,
      type: indicateur.type_id as TypeIndicateur,
      estIndicateurDuBaromètre: indicateur.est_barometre ?? false,
      description: indicateur.description,
      source: indicateur.source,
      modeDeCalcul: indicateur.mode_de_calcul,
    });
  }

  private _mapDétailsToDomain(indicateurs: IndicateurPrisma[]): DétailsIndicateurs {
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

  async récupérerGroupésParChantier(chantiersIds: Chantier['id'][], maille: Maille, codeInsee: CodeInsee): Promise<Record<string, Indicateur[]>> {
    const indicateurs: IndicateurPrisma[] = await this.prisma.indicateur.findMany({
      where: {
        chantier_id: { in: chantiersIds },
        maille: CODES_MAILLES[maille],
        code_insee: codeInsee,
      },
    });

    return groupByAndTransform(
      indicateurs,
      (indicateur) => indicateur.chantier_id,
      this._mapToDomain,
    );
  }

  async récupérerDétailsGroupésParChantierEtParIndicateur(chantiersIds: Chantier['id'][], maille: Maille, codeInsee: CodeInsee): Promise<Record<Chantier['id'], DétailsIndicateurs>> {
    const indicateurs: IndicateurPrisma[] = await this.prisma.indicateur.findMany({
      where: {
        chantier_id: { in: chantiersIds },
        maille: CODES_MAILLES[maille],
        code_insee: codeInsee,
      },
    });  

    return Object.fromEntries(
      indicateurs.map(indicateur => (
        [
          indicateur.chantier_id,
          this._mapDétailsToDomain(indicateurs.filter(ind => ind.chantier_id === indicateur.chantier_id)),
        ]
      )),
    );
  }

  async récupérerParChantierId(chantierId: string): Promise<Indicateur[]> {
    const indicateurs: IndicateurPrisma[] = await this.prisma.indicateur.findMany({
      where: { chantier_id: chantierId, maille: 'NAT' },
    });
    
    return indicateurs.map((indicateur) => this._mapToDomain(indicateur));
  }

  async récupérerDétails(indicateurId: string, maille: Maille): Promise<DétailsIndicateurs> {
    const indicateurs: IndicateurPrisma[] = await this.prisma.indicateur.findMany({
      where: { 
        id: indicateurId,
        maille: CODES_MAILLES[maille],
      },
    });

    return this._mapDétailsToDomain(indicateurs);
  }

  async récupererDétailsParChantierIdEtTerritoire(chantierId: string, maille: Maille, codesInsee: CodeInsee[]): Promise<DétailsIndicateurs> {
    const indicateurs: IndicateurPrisma[] = await this.prisma.indicateur.findMany({
      where: {
        chantier_id: chantierId,
        maille: CODES_MAILLES[maille],
        code_insee: { in: codesInsee },
      },
    });
    return this._mapDétailsToDomain(indicateurs);
  }

}
