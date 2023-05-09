import { indicateur as IndicateurPrisma, Prisma, PrismaClient } from '@prisma/client';
import IndicateurRepository from '@/server/domain/indicateur/IndicateurRepository.interface';
import Indicateur, { TypeIndicateur } from '@/server/domain/indicateur/Indicateur.interface';
import { CODES_MAILLES } from '@/server/infrastructure/accès_données/maille/mailleSQLParser';
import { DétailsIndicateurs } from '@/server/domain/indicateur/DétailsIndicateur.interface';
import { Maille } from '@/server/domain/maille/Maille.interface';
import { CodeInsee } from '@/server/domain/territoire/Territoire.interface';
import { groupByAndTransform } from '@/client/utils/arrays';
import Chantier from '@/server/domain/chantier/Chantier.interface';
import { IndicateurPourExport } from '@/server/domain/indicateur/IndicateurPourExport';
import { Habilitations } from '@/server/domain/utilisateur/habilitation/Habilitation.interface';
import Habilitation from '@/server/domain/utilisateur/habilitation/Habilitation';

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
        dateValeurCible: indic.objectif_date_valeur_cible,
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

  async récupérerPourExports(habilitations: Habilitations): Promise<IndicateurPourExport[]> {
    const h = new Habilitation(habilitations);
    const chantiersLecture = h.récupérerListeChantiersIdsAccessiblesEnLecture();

    const rows = await this.prisma.$queryRaw<any[]>`
      with chantier_ids as (
              select distinct c.id
              from chantier c
              where c.id in (${Prisma.join(chantiersLecture)})
                and ministeres <> '{}'
          ),
          dernieres_syntheses as (
              select *
              from (
                      select s.*,
                      row_number() over (
                          partition by chantier_id, maille, code_insee order by date_commentaire desc
                      ) r
                      from synthese_des_resultats s
                      where date_commentaire is not null
                  ) sr
              where sr.r = 1
          )
      
      select i.maille,
             r.territoire_code code_region,
             d.territoire_code code_departement,
             c.ministeres as chantier_ministeres,
             c.nom as chantier_nom,
             c.est_barometre as chantier_est_barometre,
             c.taux_avancement as chantier_taux_avancement,
             s.meteo,
             i.nom,
             i.valeur_initiale,
             i.date_valeur_initiale,
             i.valeur_actuelle,
             i.date_valeur_actuelle,
             i.objectif_valeur_cible as valeur_cible,
             i.objectif_date_valeur_cible as date_valeur_cible,
             i.objectif_taux_avancement as taux_avancement
      
      from chantier_ids cids
               cross join territoire t
               left outer join indicateur i on i.chantier_id = cids.id and lower(i.maille) = cast(t.maille as text) and i.code_insee = t.code_insee
               left outer join chantier c on c.id = cids.id and c.territoire_code = t.code
               left outer join chantier r on (r.id = cids.id and r.maille = 'REG')
          and (r.territoire_code = t.code or r.territoire_code = t.code_parent)
               left outer join chantier d on d.id = cids.id and d.maille = 'DEPT' and d.territoire_code = t.code
               left outer join dernieres_syntheses s
                               on s.chantier_id = c.id and s.maille = c.maille and s.code_insee = c.code_insee
      where c.id is not null
      order by
          i.nom,
          CASE i.maille
            WHEN 'NAT' THEN 1
            WHEN 'REG' THEN 2
            WHEN 'DEPT' THEN 3
            ELSE 4 END,
          code_region,
          code_departement,
          c.ministeres
    `;

    return rows.map(it => new IndicateurPourExport(
      it.maille,
      it.code_region,
      it.code_departement,
      it.chantier_ministeres ? it.chantier_ministeres[0] : null,
      it.chantier_nom,
      it.chantier_est_barometre,
      it.chantier_taux_avancement,
      it.meteo,
      it.nom,
      it.valeur_initiale,
      it.date_valeur_initiale,
      it.valeur_actuelle,
      it.date_valeur_actuelle,
      it.valeur_cible,
      it.date_valeur_cible,
      it.taux_avancement,
    ));
  }
}
