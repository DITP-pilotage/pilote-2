import { chantier_identite as PrismaChantierIdentite, chantier_territoire as PrismaChantierTerritoire, Prisma, type_statut } from '@prisma/client';
import ChantierRepository from '@/server/domain/chantier/ChantierRepository.interface';
import Chantier, { ChantierSynthétisé } from '@/server/domain/chantier/Chantier.interface';
import { Maille } from '@/server/domain/maille/Maille.interface';
import { CODES_MAILLES } from '@/server/infrastructure/accès_données/maille/mailleSQLParser';
import { Météo } from '@/server/domain/météo/Météo.interface';
import Habilitation from '@/server/domain/utilisateur/habilitation/Habilitation';
import { Habilitations } from '@/server/domain/utilisateur/habilitation/Habilitation.interface';
import { AvancementsStatistiques } from '@/components/_commons/Avancements/Avancements.interface';
import { ChantierPourExport } from '@/server/usecase/chantier/ExportCsvDesChantiersSansFiltreUseCase.interface';
import { territoireCodeVersMailleCodeInsee } from '@/server/utils/territoires';
import { ProfilCode, profilsTerritoriaux } from '@/server/domain/utilisateur/Utilisateur.interface';
import { OptionsExport } from '@/server/usecase/chantier/OptionsExport';
import { FiltreQueryParams, SortingParams } from '@/server/chantiers/app/contrats/FiltreQueryParams';
import { removeAccents } from '@/server/utils/remove-accents';
import { prisma } from '@/server/db/prisma';

class ErreurChantierNonTrouvé extends Error {
  constructor(idChantier: string) {
    super(`Erreur: chantier '${idChantier}' non trouvé.`);
  }
}

export class ErreurChantierPermission extends Error {
  constructor(idChantier: string) {
    super(`Erreur de Permission: l'utilisateur n'a pas le droit de lecture pour le chantier '${idChantier}'.`);
  }
}

const appliquerSortingChantier = (sorting: SortingParams): Prisma.Enumerable<Prisma.chantierOrderByWithRelationInput> => {
  const sortingDirection = sorting.desc ? 'desc' : 'asc';
  const orderBy: Prisma.SortOrderInput = {
    sort: sortingDirection,
    nulls: 'last',
  };

  switch (sorting.id) {
    case 'avancement': {
      return [{
        taux_avancement: orderBy,
      }, {
        id: 'asc',
      }];
    }
    case 'météo': {
      return [{
        meteo_int_index: orderBy,
      }, {
        id: 'asc',
      }];
    }
    case 'dateDeMàjDonnéesQuantitatives': {
      return [{
        taux_avancement_date: orderBy,
      }, {
        id: 'asc',
      }];
    }
    case 'dateDeMàjDonnéesQualitatives': {
      return [{
        derniere_maj_date_qualitative: orderBy,
      }, {
        id: 'asc',
      }];
    }
    case 'tendance': {
      return [{
        tendance_int_index: orderBy,
      }, {
        id: 'asc',
      }];
    }
    case 'écart': {
      return [{
        ecart: orderBy,
      }, {
        id: 'asc',
      }];
    }
    default: {
      return {};
    }
  }
};

export default class ChantierSQLRepository implements ChantierRepository {
  async récupérerChantiersSynthétisés(): Promise<ChantierSynthétisé[]> {
    const chantiers = await prisma.$queryRaw<any[]>`
      SELECT 
        id,
        nom, 
        est_territorialise,
        perimetre_ids,
        ate ,
        statut ,
        ARRAY_AGG(territoire_code) as territoires_applicables
      FROM chantier
      WHERE est_applicable
      GROUP BY id, nom, est_territorialise, perimetre_ids, ate, statut;   
    `;

    return chantiers.map(chantier => ({
      id: chantier.id,
      nom: chantier.nom,
      estTerritorialisé: Boolean(chantier.est_territorialise),
      périmètreIds: chantier.perimetre_ids,
      ate: chantier.ate,
      statut: chantier.statut,
      territoiresApplicables: chantier.territoires_applicables,
    }));
  }

  async récupérerLesEntréesDUnChantier(id: string, habilitations: Habilitations, profil: ProfilCode): Promise<(PrismaChantierIdentite & {
    chantier_territoire: PrismaChantierTerritoire[]
  })[]> {
    const habilitation = new Habilitation(habilitations);
    const listeChantiersIdsAccessiblesEnLecture = habilitation.récupérerListeChantiersIdsAccessiblesEnLecture();

    let whereParam = {};

    if (!profilsTerritoriaux.includes(profil)) {
      let listeTerritoireAccessibleEnLecture = habilitation.récupérerListeTerritoireCodesAccessiblesEnLecture();
      // Par defaut, la maille NAT est retournée pour afficher l'avancement du pays
      listeTerritoireAccessibleEnLecture = [...listeTerritoireAccessibleEnLecture, 'NAT-FR'];
      whereParam = {
        territoire_code: {
          in: listeTerritoireAccessibleEnLecture,
        },
      };
    }

    const peutAccéderAuChantier = listeChantiersIdsAccessiblesEnLecture.includes(id);

    if (!peutAccéderAuChantier) {
      throw new ErreurChantierPermission(id);
    }

    const chantiers = await prisma.chantier_identite.findMany({
      where: {
        id,
      },
      include: {
        chantier_territoire: {
          where: whereParam,
        },
      },
    });

    if (!chantiers || chantiers.length === 0) {
      throw new ErreurChantierNonTrouvé(id);
    }

    return chantiers;
  }

  async récupérerChantierIdsEnLectureOrdonnésParNomAvecOptions(habilitation: Habilitation, optionsExport: OptionsExport): Promise<Chantier['id'][]> {
    const chantierIdsLecture = habilitation.récupérerListeChantiersIdsAccessiblesEnLecture();

    const listeChantierId = optionsExport.listeChantierId.length > 0 ? chantierIdsLecture.filter(value => optionsExport.listeChantierId.includes(value)) : chantierIdsLecture;
    const whereOptions: Prisma.chantierWhereInput = {};

    if (optionsExport.estBarometre && optionsExport.estTerritorialise) {
      whereOptions.OR = [
        {
          est_barometre: true,
        }, {
          est_territorialise: true,
        },
      ];
    } else if (optionsExport.estBarometre) {
      whereOptions.est_barometre = true;
    } else if (optionsExport.estTerritorialise) {
      whereOptions.est_territorialise = true;
    }

    if (optionsExport.listeStatuts && optionsExport.listeStatuts.length > 0) {
      whereOptions.statut = {
        in: optionsExport.listeStatuts as type_statut[],
      };
    }

    if (optionsExport.perimetreIds && optionsExport.perimetreIds.length > 0) {
      whereOptions.perimetre_ids = {
        hasSome: optionsExport.perimetreIds,
      };
    }

    const chantiers = await prisma.chantier.findMany({
      distinct: ['id'],
      where: {
        id: { in: listeChantierId },
        ...whereOptions,
      },
      orderBy: [{ nom: 'asc' }],
    });

    return chantiers.map(c => c.id);
  }

  async récupérerLesEntréesDeTousLesChantiersHabilitésNew(chantiersLectureIds: string[], territoiresLectureIds: string[], profil: ProfilCode, maille: 'DEPT' | 'REG', filtres: FiltreQueryParams, sorting: SortingParams): Promise<PrismaChantierIdentite[]> {
    const whereOptions: Prisma.chantierWhereInput = {};

    if (filtres.perimetres?.length > 0) {
      whereOptions.perimetre_ids = {
        hasSome: filtres.perimetres,
      };
    }

    if (filtres.statut?.length > 0) {
      whereOptions.statut = {
        in: filtres.statut as type_statut[],
      };
    }

    if (filtres.axes?.length > 0) {
      whereOptions.axe = {
        in: filtres.axes,
      };
    }

    if (filtres.estTerritorialise && filtres.estBarometre) {
      whereOptions.OR = [{
        est_barometre: true,
      }, {
        est_territorialise: true,
      }];
    } else if (filtres.estTerritorialise) {
      whereOptions.est_territorialise = true;
    } else if (filtres.estBarometre) {
      whereOptions.est_barometre = true;
    }

    let chantierIds = chantiersLectureIds;

    if (filtres.valeurDeLaRecherche?.length > 0) {
      const testLower = removeAccents(filtres.valeurDeLaRecherche.toLowerCase());

      chantierIds = await prisma.$queryRawUnsafe<{ id: string }[]>('SELECT distinct(id) FROM chantier where (LOWER(unaccent(nom)) ILIKE $1 OR LOWER(unaccent(id)) ILIKE $1)', `%${testLower}%`)
        .then(chantiersMatched => chantiersMatched.map(chantierMatched => chantierMatched.id).filter(chantierId => chantiersLectureIds.includes(chantierId)));
    }

    let paramètresRequête : Prisma.chantierFindManyArgs = {
      where: {
        NOT: { ministeres: { isEmpty: true } },
        id: { in: chantierIds },
        ...whereOptions,
      },
      orderBy: sorting ? appliquerSortingChantier(sorting) : {},
    };

    if (!profilsTerritoriaux.includes(profil)) {
      // Par defaut, la maille NAT est retournée pour afficher l'avancement du pays
      paramètresRequête.where!.territoire_code = { in: [...territoiresLectureIds, 'NAT-FR'] };
    }

    return prisma.chantier.findMany(paramètresRequête);
  }

  async modifierMétéo(chantierId: string, territoireCode: string, météo: Météo) {
    const { maille, codeInsee } = territoireCodeVersMailleCodeInsee(territoireCode);

    await prisma.chantier.update({
      data: {
        meteo: météo,
      },
      where: {
        id_code_insee_maille: {
          id: chantierId,
          maille: maille,
          code_insee: codeInsee,
        },
      },
    });
  }

  async récupérerPourExports(chantierIdsLecture: string[], territoireCodesLecture: string[]): Promise<ChantierPourExport[]> {
    const rows = await prisma.$queryRaw<any[]>`
        with chantier_ids as (select distinct c.id
                              from chantier c
                              where c.id in (${Prisma.join(chantierIdsLecture)})
                                and ministeres <> '{}'),
             derniers_commentaires as (select *
                                       from (select c.*,
                                                    row_number() over (partition by chantier_id, maille, code_insee, type order by date desc) r
                                             from commentaire c
                                            ) comm
                                       where comm.r = 1),
             dernieres_decisions_strat as (select *
                                           from (select ds.*,
                                                        row_number() over (partition by chantier_id, type order by date desc) r
                                                 from decision_strategique ds
                                                ) decis_s
                                           where decis_s.r = 1),
             derniers_objectifs as (select *
                                    from (select ob.*,
                                                 row_number() over (partition by chantier_id, type order by date desc) r
                                          from objectif ob
                                         ) obj
                                    where obj.r = 1),
             dernieres_syntheses as (select *
                                     from (select s.*,
                                                  row_number() over (partition by chantier_id, maille, code_insee order by date_commentaire desc) r
                                           from synthese_des_resultats s
                                           where date_commentaire is not null) sr
                                     where sr.r = 1)

        select c.*,
               t_r.nom             region_nom,
               t_d.nom             departement_nom,
               c_n.taux_avancement taux_national,
               c_r.taux_avancement taux_regional,
               c_d.taux_avancement taux_departemental,
               co_aavn.contenu     comm_actions_a_venir,
               co_aavl.contenu     comm_actions_a_valoriser,
               co_fal.contenu      comm_freins_a_lever,
               co_csld.contenu     comm_commentaires_sur_les_donnees,
               co_ar.contenu       comm_autres_resultats,
               co_arncai.contenu   comm_autres_resultats_non_correles_aux_indicateurs,
               ds_sdd.contenu      dec_strat_suivi_des_decisions,
               o_na.contenu        obj_notre_ambition,
               o_df.contenu        obj_deja_fait,
               o_af.contenu        obj_a_faire,
               s.commentaire       synthese_des_resultats,
               s.meteo             meteo

        from chantier_ids cids
                 inner join territoire t on t.code in (${Prisma.join(territoireCodesLecture)})
                 left outer join chantier c on c.id = cids.id and c.territoire_code = t.code
                 left outer join chantier c_n on c_n.id = cids.id and c_n.maille = 'NAT'
                 left outer join chantier c_r on (c_r.id = cids.id and c_r.maille = 'REG')
            and (c_r.territoire_code = t.code or c_r.territoire_code = t.code_parent)
                 left outer join chantier c_d on c_d.id = cids.id and c_d.maille = 'DEPT' and c_d.territoire_code = t.code
                 left outer join territoire t_r on t_r.code = c_r.territoire_code
                 left outer join territoire t_d on t_d.code = c_d.territoire_code
                 left outer join derniers_commentaires co_aavn
                                 on co_aavn.chantier_id = c.id and co_aavn.maille = c.maille and co_aavn.code_insee = c.code_insee
                                     and co_aavn.type = 'actions_a_venir'
                 left outer join derniers_commentaires co_aavl
                                 on co_aavl.chantier_id = c.id and co_aavl.maille = c.maille and co_aavl.code_insee = c.code_insee
                                     and co_aavl.type = 'actions_a_valoriser'
                 left outer join derniers_commentaires co_fal
                                 on co_fal.chantier_id = c.id and co_fal.maille = c.maille and co_fal.code_insee = c.code_insee
                                     and co_fal.type = 'freins_a_lever'
                 left outer join derniers_commentaires co_csld
                                 on co_csld.chantier_id = c.id and co_csld.maille = c.maille and co_csld.code_insee = c.code_insee
                                     and co_csld.type = 'commentaires_sur_les_donnees'
                 left outer join derniers_commentaires co_ar
                                 on co_ar.chantier_id = c.id and co_ar.maille = c.maille and co_ar.code_insee = c.code_insee
                                     and co_ar.type = 'autres_resultats_obtenus'
                 left outer join derniers_commentaires co_arncai
                                 on co_arncai.chantier_id = c.id and co_arncai.maille = c.maille and co_arncai.code_insee = c.code_insee
                                     and co_arncai.type = 'autres_resultats_obtenus_non_correles_aux_indicateurs'
                 left outer join dernieres_decisions_strat ds_sdd
                                 on ds_sdd.chantier_id = c.id
                                     and ds_sdd.type = 'suivi_des_decisions'
                                     and c.maille = 'NAT' -- ne pas afficher les décisions strat. pour les territoires non nationaux
                 left outer join derniers_objectifs o_na
                                 on o_na.chantier_id = c.id
                                     and o_na.type = 'notre_ambition'
                                     and c.maille = 'NAT' -- ne pas afficher les objectifs pour les territoires non nationaux
                 left outer join derniers_objectifs o_df
                                 on o_df.chantier_id = c.id
                                     and o_df.type = 'deja_fait'
                                     and c.maille = 'NAT' -- ne pas afficher les objectifs pour les territoires non nationaux
                 left outer join derniers_objectifs o_af
                                 on o_af.chantier_id = c.id
                                     and o_af.type = 'a_faire'
                                     and c.maille = 'NAT' -- ne pas afficher les objectifs pour les territoires non nationaux
                 left outer join dernieres_syntheses s
                                 on s.chantier_id = c.id and s.maille = c.maille and s.code_insee = c.code_insee
        where c.id is not null
        and c.est_applicable
        order by
            c.nom,
            CASE c.maille
                WHEN 'NAT' THEN 1
                WHEN 'REG' THEN 2
                WHEN 'DEPT' THEN 3
                ELSE 4 END,
            region_nom,
            t_d.code_insee, -- on ordonne en fonction du numéro du département et pas par ordre alphabétique (le Haut-Rhin vient juste après le Bas-Rhin)
            c.ministeres
    `;
    return rows.map(it => ({
      nom: it.nom,
      id: it.id,
      maille: it.maille,
      régionNom: it.region_nom,
      départementNom: it.departement_nom,
      codeInsee: it.code_insee,
      ministèreNom: it.ministeres_acronymes ? it.ministeres_acronymes[0] : null, // <-- en fait ce sont les porteurs
      axe: it.axe,
      tauxDAvancementAnnuel: it.taux_avancement_annuel,
      tauxDAvancementNational: it.taux_national,
      tauxDAvancementRégional: it.taux_regional,
      tauxDAvancementDépartemental: it.taux_departemental,
      périmètreIds: it.perimetre_ids,
      météo: it.meteo,
      directeursProjet: it.directeurs_projet,
      directeursProjetMails: it.directeurs_projet_mails,
      responsablesLocaux: it.responsables_locaux,
      responsablesLocauxMails: it.responsables_locaux_mails,
      statut: it.statut,
      estBaromètre: it.est_barometre,
      estTerritorialisé: it.est_territorialise,
      commActionsÀVenir: it.comm_actions_a_venir,
      commActionsÀValoriser: it.comm_actions_a_valoriser,
      commFreinsÀLever: it.comm_freins_a_lever,
      commCommentairesSurLesDonnées: it.comm_commentaires_sur_les_donnees,
      commAutresRésultats: it.comm_autres_resultats,
      commAutresRésultatsNonCorrélésAuxIndicateurs: it.comm_autres_resultats_non_correles_aux_indicateurs,
      decStratSuiviDesDécisions: it.dec_strat_suivi_des_decisions,
      objNotreAmbition: it.obj_notre_ambition,
      objDéjàFait: it.obj_deja_fait,
      objÀFaire: it.obj_a_faire,
      synthèseDesRésultats: it.synthese_des_resultats,
    }));
  }

  async getChantierStatistiques(habilitations: Habilitations, listeChantier: Chantier['id'][], maille: Maille): Promise<AvancementsStatistiques> {
    const habilitation = new Habilitation(habilitations);
    const chantiersAutorisés = habilitation.récupérerListeChantiersIdsAccessiblesEnLecture();
    const chantiersLecture = listeChantier.filter((x) => chantiersAutorisés.includes(x));

    const rows = await prisma.$queryRaw<any[]>`
      WITH chantier_average AS (
        SELECT 
          territoire_code, 
          AVG(taux_avancement) AS stat
        FROM chantier 
        WHERE 
        chantier.id IN (${chantiersLecture.length > 0 ? Prisma.join(chantiersLecture) : undefined}) 
          AND maille = ${CODES_MAILLES[maille]}
        GROUP BY territoire_code
      )
      SELECT 
        AVG(stat) AS stat_avg,
        MIN(stat) AS stat_min, 
        PERCENTILE_CONT(0.5) WITHIN GROUP(ORDER BY stat) AS stat_median,
        MAX(stat) AS stat_max,
        NULL AS stat_avg_annuel
      FROM chantier_average
  `;

    const values = rows[0];
    return {
      global: {
        moyenne: values.stat_avg,
        médiane: values.stat_median,
        maximum: values.stat_max,
        minimum: values.stat_min,
      },
      annuel: {
        moyenne: values.stat_avg_annuel,
      },
    };
  }
}
