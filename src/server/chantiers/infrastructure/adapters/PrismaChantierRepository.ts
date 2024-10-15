import { Prisma } from '@prisma/client';
import { ChantierRepository } from '@/server/chantiers/domain/ports/ChantierRepository';
import { DonneeChantier } from '@/server/chantiers/domain/DonneeChantier';
import { prisma } from '@/server/db/prisma';

export class PrismaChantierRepository implements ChantierRepository {
  async récupérerDonneesChantier(chantierId: string, territoireCodesLecture: string[]): Promise<DonneeChantier[]> {
    const rows = await prisma.$queryRaw<any[]>`
        with chantier_ids as (select distinct c.id
                              from chantier c
                              where c.id = ${chantierId}
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
      id: it.id,
      nom: it.nom,
      maille: it.maille,
      axe: it.axe,
      territoireCode: it.territoire_code,
      ministèreNom: it.ministeres_acronymes ? it.ministeres_acronymes[0] : null, // <-- en fait ce sont les porteurs
      tauxDAvancementAnnuel: it.taux_avancement_annuel,
      tauxDAvancementNational: it.taux_national,
      tauxDAvancementRégional: it.taux_regional,
      tauxDAvancementDépartemental: it.taux_departemental,
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
    } satisfies DonneeChantier));
  }
}
