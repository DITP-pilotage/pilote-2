import { chantier, Prisma, PrismaClient } from '@prisma/client';
import ChantierRepository from '@/server/domain/chantier/ChantierRepository.interface';
import { groupBy } from '@/client/utils/arrays';
import { parseChantier } from '@/server/infrastructure/accès_données/chantier/ChantierSQLParser';
import Chantier from '@/server/domain/chantier/Chantier.interface';
import { objectEntries } from '@/client/utils/objects/objects';
import { Maille } from '@/server/domain/maille/Maille.interface';
import { CODES_MAILLES } from '@/server/infrastructure/accès_données/maille/mailleSQLParser';
import { CodeInsee } from '@/server/domain/territoire/Territoire.interface';
import { Météo } from '@/server/domain/météo/Météo.interface';
import { ChantierPourExport } from '@/server/domain/chantier/ChantierPourExport';
import PérimètreMinistériel from '@/server/domain/périmètreMinistériel/PérimètreMinistériel.interface';
import Habilitation from '@/server/domain/utilisateur/habilitation/Habilitation';
import { Habilitations } from '@/server/domain/utilisateur/habilitation/Habilitation.interface';
import { AvancementsStatistiques } from '@/components/_commons/Avancements/Avancements.interface';

class ErreurChantierNonTrouvé extends Error {
  constructor(idChantier: string) {
    super(`Erreur: chantier '${idChantier}' non trouvé.`);
  }
}

class ErreurChantierPermission extends Error {
  constructor(idChantier: string) {
    super(`Erreur de Permission: l'utilisateur n'a pas le droit de lecture pour le chantier '${idChantier}'.`);
  }
}

export default class ChantierSQLRepository implements ChantierRepository {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async getById(id: string, habilitations: Habilitations): Promise<Chantier> {
    const h = new Habilitation(habilitations);
    const chantiersLecture = h.récupérerListeChantiersIdsAccessiblesEnLecture();
    const territoiresLecture = h.récupérerListeTerritoireCodesAccessiblesEnLecture();
    // Par defaut, la maille NAT est retournée pour afficher l'avancement du pays
    territoiresLecture.push('NAT-FR');

    const peutAccéderAuChantier = chantiersLecture.includes(id);
  
    if (!peutAccéderAuChantier) {
      throw new ErreurChantierPermission(id);
    }
    
    const chantiers: chantier[] = await this.prisma.chantier.findMany({
      where: { 
        id,
        territoire_code: { in: territoiresLecture },
      },
    });

    if (!chantiers || chantiers.length === 0) {
      throw new ErreurChantierNonTrouvé(id);
    }

    return parseChantier(chantiers);
  }

  async récupérerChantierIdsAssociésAuxPérimètresMinistèriels(périmètreIds: PérimètreMinistériel['id'][]): Promise<Chantier['id'][]> {
    const chantiers = await this.prisma.chantier.findMany({
      distinct: ['id'],
      where: {
        perimetre_ids: { hasSome: périmètreIds },
      },
    });

    return chantiers.map(c => c.id);
  }

  async getListe(habilitation: Habilitation): Promise<Chantier[]> {
    
    const chantiersLecture = habilitation.récupérerListeChantiersIdsAccessiblesEnLecture();
    let territoiresLecture = habilitation.récupérerListeTerritoireCodesAccessiblesEnLecture();
    // Par defaut, la maille NAT est retournée pour afficher l'avancement du pays
    territoiresLecture = [...territoiresLecture, 'NAT-FR'];

    const chantiers = await this.prisma.chantier.findMany({
      where: {
        NOT: { ministeres: { isEmpty: true } },
        id: { in: chantiersLecture },
        territoire_code: { in: territoiresLecture },
      },
    });
    const chantiersGroupésParId = groupBy<chantier>(chantiers, c => c.id);

    return objectEntries(chantiersGroupésParId).map(([_, c]) => parseChantier(c));
  }

  async récupérerMétéoParChantierIdEtTerritoire(chantierId: string, maille: Maille, codeInsee: CodeInsee): Promise<Météo | null> {
    const chantierRow: chantier | null = await this.prisma.chantier.findFirst({
      where: {
        id: chantierId,
        maille: CODES_MAILLES[maille],
        code_insee: codeInsee,
      },
    });

    if (!chantierRow) {
      throw new ErreurChantierNonTrouvé(chantierId);
    }

    // TODO: avoir une réflexion sur avoir un mapper et retourné un objet du domainz Chantier
    return chantierRow.meteo as Météo | null;
  }

  async modifierMétéo(chantierId: string, maille: Maille, codeInsee: CodeInsee, météo: Météo) {
    await this.prisma.chantier.update({
      data: {
        meteo: météo,
      },
      where: {
        id_code_insee_maille: {
          id: chantierId,
          maille: CODES_MAILLES[maille],
          code_insee: codeInsee,
        },
      },
    });
  }

  async getChantiersPourExports(habilitations: Habilitations): Promise<ChantierPourExport[]> {
    const h = new Habilitation(habilitations);
    const chantiersLecture = h.récupérerListeChantiersIdsAccessiblesEnLecture();

    const rows = await this.prisma.$queryRaw<any[]>`
        with chantier_ids as (select distinct c.id
                              from chantier c
                              where c.id in (${Prisma.join(chantiersLecture)})
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
               r.territoire_code code_region,
               d.territoire_code code_departement,
               n.taux_avancement taux_national,
               r.taux_avancement taux_regional,
               d.taux_avancement taux_departemental,
               c_aavn.contenu    comm_actions_a_venir,
               c_aavl.contenu    comm_actions_a_valoriser,
               c_fal.contenu     comm_freins_a_lever,
               c_csld.contenu    comm_commentaires_sur_les_donnees,
               c_ar.contenu      comm_autres_resultats,
               c_arncai.contenu  comm_autres_resultats_non_correles_aux_indicateurs,
               ds_sdd.contenu    dec_strat_suivi_des_decisions,
               o_na.contenu      obj_notre_ambition,
               o_df.contenu      obj_deja_fait,
               o_af.contenu      obj_a_faire,
               s.commentaire     synthese_des_resultats

        from chantier_ids cids
                 cross join territoire t
                 left outer join chantier c on c.id = cids.id and c.territoire_code = t.code
                 left outer join chantier n on n.id = cids.id and n.maille = 'NAT'
                 left outer join chantier r on (r.id = cids.id and r.maille = 'REG')
            and (r.territoire_code = t.code or r.territoire_code = t.code_parent)
                 left outer join chantier d on d.id = cids.id and d.maille = 'DEPT' and d.territoire_code = t.code
                 left outer join derniers_commentaires c_aavn
                                 on c_aavn.chantier_id = c.id and c_aavn.maille = c.maille and c_aavn.code_insee = c.code_insee
                                     and c_aavn.type = 'actions_a_venir'
                 left outer join derniers_commentaires c_aavl
                                 on c_aavl.chantier_id = c.id and c_aavl.maille = c.maille and c_aavl.code_insee = c.code_insee
                                     and c_aavl.type = 'actions_a_valoriser'
                 left outer join derniers_commentaires c_fal
                                 on c_fal.chantier_id = c.id and c_fal.maille = c.maille and c_fal.code_insee = c.code_insee
                                     and c_fal.type = 'freins_a_lever'
                 left outer join derniers_commentaires c_csld
                                 on c_csld.chantier_id = c.id and c_csld.maille = c.maille and c_csld.code_insee = c.code_insee
                                     and c_csld.type = 'commentaires_sur_les_donnees'
                 left outer join derniers_commentaires c_ar
                                 on c_ar.chantier_id = c.id and c_ar.maille = c.maille and c_ar.code_insee = c.code_insee
                                     and c_ar.type = 'autres_resultats_obtenus'
                 left outer join derniers_commentaires c_arncai
                                 on c_arncai.chantier_id = c.id and c_arncai.maille = c.maille and c_arncai.code_insee = c.code_insee
                                     and c_arncai.type = 'autres_resultats_obtenus_non_correles_aux_indicateurs'
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
        order by nom, maille, code_region, code_departement
    `;
    return rows.map(it => new ChantierPourExport(
      it.id,
      it.nom,
      it.maille,
      it.code_insee,
      it.code_region,
      it.code_departement,
      it.ministeres ? it.ministeres[0] : null, // <-- en fait ce sont les porteurs
      it.taux_national,
      it.taux_regional,
      it.taux_departemental,
      it.meteo,
      it.est_barometre,
      it.est_territorialise,
      it.comm_actions_a_venir,
      it.comm_actions_a_valoriser,
      it.comm_freins_a_lever,
      it.comm_commentaires_sur_les_donnees,
      it.comm_autres_resultats,
      it.comm_autres_resultats_non_correles_aux_indicateurs,
      it.dec_strat_suivi_des_decisions,
      it.obj_notre_ambition,
      it.obj_deja_fait,
      it.obj_a_faire,
      it.synthese_des_resultats,
    ));
  }

  async getChantierStatistiques(habilitations: Habilitations, listeChantier: Chantier['id'][], maille: Maille): Promise<AvancementsStatistiques> {
    const habilitation = new Habilitation(habilitations);
    const chaniterAutorisés = habilitation.récupérerListeChantiersIdsAccessiblesEnLecture();
    const chantiersLecture = listeChantier.filter((x) => chaniterAutorisés.includes(x));


    const rows = await this.prisma.$queryRaw<any[]>`
    WITH chantier_average AS (
      SELECT 
        territoire_code, 
        AVG(taux_avancement) AS stat
      FROM chantier 
      WHERE 
        chantier.id IN (${Prisma.join(chantiersLecture)}) 
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
    const avancementsStatistiques : AvancementsStatistiques = {
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
    return avancementsStatistiques;
  }
}
