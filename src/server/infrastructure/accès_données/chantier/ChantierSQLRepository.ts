import { chantier as ChantierPrisma, Prisma, PrismaClient, type_statut } from '@prisma/client';
import ChantierRepository from '@/server/domain/chantier/ChantierRepository.interface';
import Chantier, { ChantierSynthétisé } from '@/server/domain/chantier/Chantier.interface';
import { Maille } from '@/server/domain/maille/Maille.interface';
import { CODES_MAILLES } from '@/server/infrastructure/accès_données/maille/mailleSQLParser';
import { CodeInsee } from '@/server/domain/territoire/Territoire.interface';
import { Météo } from '@/server/domain/météo/Météo.interface';
import PérimètreMinistériel from '@/server/domain/périmètreMinistériel/PérimètreMinistériel.interface';
import Habilitation from '@/server/domain/utilisateur/habilitation/Habilitation';
import { Habilitations, Scope } from '@/server/domain/utilisateur/habilitation/Habilitation.interface';
import { AvancementsStatistiques } from '@/components/_commons/Avancements/Avancements.interface';
import { ChantierPourExport } from '@/server/usecase/chantier/ExportCsvDesChantiersSansFiltreUseCase.interface';
import { territoireCodeVersMailleCodeInsee } from '@/server/utils/territoires';
import { ProfilCode, profilsTerritoriaux } from '@/server/domain/utilisateur/Utilisateur.interface';
import { OptionsExport } from '@/server/usecase/chantier/OptionsExport';
import { FiltreQueryParams } from '@/server/chantiers/app/contrats/FiltreQueryParams';

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

export default class ChantierSQLRepository implements ChantierRepository {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async récupérerChantiersSynthétisés(): Promise<ChantierSynthétisé[]> {
    const chantiers = await this.prisma.chantier.findMany({
      distinct: ['id'],
    });

    return chantiers.map(c => ({
      id: c.id,
      nom: c.nom,
      estTerritorialisé: Boolean(c.est_territorialise),
      périmètreIds: c.perimetre_ids,
      ate: c.ate,
      statut: c.statut,
    }));
  }

  async récupérerLesEntréesDUnChantier(id: string, habilitations: Habilitations, profil: ProfilCode): Promise<ChantierPrisma[]> {
    const h = new Habilitation(habilitations);
    const chantiersLecture = h.récupérerListeChantiersIdsAccessiblesEnLecture();

    let paramètresRequête : Prisma.chantierFindManyArgs = {
      where: {
        id,
      },
      include: {
        territoire: true,
      },
    };

    if (!profilsTerritoriaux.includes(profil)) {
      let territoiresLecture = h.récupérerListeTerritoireCodesAccessiblesEnLecture();
      // Par defaut, la maille NAT est retournée pour afficher l'avancement du pays
      territoiresLecture = [...territoiresLecture, 'NAT-FR'];
      paramètresRequête.where!.territoire_code = { in: territoiresLecture };
    }

    const peutAccéderAuChantier = chantiersLecture.includes(id);
  
    if (!peutAccéderAuChantier) {
      throw new ErreurChantierPermission(id);
    }
    
    const chantiers = await this.prisma.chantier.findMany(paramètresRequête);

    if (!chantiers || chantiers.length === 0) {
      throw new ErreurChantierNonTrouvé(id);
    }

    return chantiers;
  }

  async récupérerChantierIdsAssociésAuxPérimètresMinistèriels(périmètreIds: PérimètreMinistériel['id'][], scope: Scope, profilUtilisateur: string): Promise<Chantier['id'][]> {
    let chantiers = await this.prisma.chantier.findMany({
      distinct: ['id'],
      where: {
        perimetre_ids: { hasSome: périmètreIds },
      },
    });

    if (scope == 'saisieCommentaire' && ['SERVICES_DECONCENTRES_REGION', 'SERVICES_DECONCENTRES_DEPARTEMENT', 'RESPONSABLE_REGION', 'RESPONSABLE_DEPARTEMENT'].includes(profilUtilisateur)) {
      chantiers = chantiers.filter(c => c.ate !== 'hors_ate_centralise');
    }

    return chantiers.map(c => c.id);
  }

  async récupérerChantierIdsPourSaisieCommentaireServiceDeconcentré(chantierIds: Chantier['id'][]): Promise<Chantier['id'][]> {
    let chantiers = await this.prisma.chantier.findMany({
      distinct: ['id'],
      where: {
        AND: [
          { id: { in: chantierIds } },
          { NOT: { ate: 'hors_ate_centralise' } },
        ],
      },
    });
    
    return chantiers.map(c => c.id);
  }

  async récupérerChantierIdsEnLectureOrdonnésParNomAvecOptions(habilitation: Habilitation, optionsExport: OptionsExport): Promise<Chantier['id'][]> {
    const chantierIdsLecture = habilitation.récupérerListeChantiersIdsAccessiblesEnLecture();
    const whereOptions: Prisma.chantierWhereInput = {};


    if (optionsExport.estBarometre) {
      whereOptions.est_barometre = true;
    }

    if (optionsExport.estTerritorialise) {
      whereOptions.est_barometre = true;
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


    const chantiers = await this.prisma.chantier.findMany({
      distinct: ['id'],
      where: {
        id: { in: chantierIdsLecture },
        ...whereOptions,
      },
      orderBy: [{ nom: 'asc' }],
    });

    return chantiers.map(c => c.id);
  }

  async récupérerChantierIdsEnLectureOrdonnésParNom(habilitation: Habilitation): Promise<Chantier['id'][]> {
    const chantierIdsLecture = habilitation.récupérerListeChantiersIdsAccessiblesEnLecture();
    const chantiers = await this.prisma.chantier.findMany({
      distinct: ['id'],
      where: {
        id: { in: chantierIdsLecture },
      },
      orderBy: [{ nom: 'asc' }],
    });

    return chantiers.map(c => c.id);
  }

  async récupérerLesEntréesDeTousLesChantiersHabilités(habilitation: Habilitation, profil: ProfilCode): Promise<ChantierPrisma[]> {

    const chantiersLecture = habilitation.récupérerListeChantiersIdsAccessiblesEnLecture();

    let paramètresRequête : Prisma.chantierFindManyArgs = {
      where: {
        NOT: { ministeres: { isEmpty: true } },
        id: { in: chantiersLecture },
      },
    };

    if (!profilsTerritoriaux.includes(profil)) {
      let territoiresLecture = habilitation.récupérerListeTerritoireCodesAccessiblesEnLecture();
      // Par defaut, la maille NAT est retournée pour afficher l'avancement du pays
      territoiresLecture = [...territoiresLecture, 'NAT-FR'];
      paramètresRequête.where!.territoire_code = { in: territoiresLecture };
    }

    return this.prisma.chantier.findMany(paramètresRequête);
  }

  async récupérerLesEntréesDeTousLesChantiersHabilitésNewNat(chantiersLectureIds: string[], territoiresLectureIds: string[], profil: ProfilCode, filtres: FiltreQueryParams): Promise<ChantierPrisma[]> {
    const whereOptions: Prisma.chantierWhereInput = {};

    if (filtres.perimetres?.length > 0) {
      whereOptions.perimetre_ids = {
        hasSome: filtres.perimetres,
      };
    }

    if (filtres.axes?.length > 0) {
      whereOptions.axe = {
        in: filtres.axes,
      };
    }

    if (filtres.ppg?.length > 0) {
      whereOptions.ppg = {
        in: filtres.ppg,
      };
    }

    let paramètresRequête : Prisma.chantierFindManyArgs = {
      where: {
        NOT: { ministeres: { isEmpty: true } },
        id: { in: chantiersLectureIds },
        maille: 'NAT',
        ...whereOptions,
      },
    };

    if (!profilsTerritoriaux.includes(profil)) {
      // Par defaut, la maille NAT est retournée pour afficher l'avancement du pays
      paramètresRequête.where!.territoire_code = { in: [...territoiresLectureIds, 'NAT-FR'] };
    }

    return this.prisma.chantier.findMany(paramètresRequête);
  }

  async récupérerLesEntréesDeTousLesChantiersHabilitésNew(chantiersLectureIds: string[], territoiresLectureIds: string[], profil: ProfilCode, maille: 'DEPT' | 'REG', filtres: FiltreQueryParams): Promise<ChantierPrisma[]> {
    const whereOptions: Prisma.chantierWhereInput = {};

    if (filtres.perimetres?.length > 0) {
      whereOptions.perimetre_ids = {
        hasSome: filtres.perimetres,
      };
    }

    if (filtres.axes?.length > 0) {
      whereOptions.axe = {
        in: filtres.axes,
      };
    }

    if (filtres.ppg?.length > 0) {
      whereOptions.ppg = {
        in: filtres.ppg,
      };
    }

    let paramètresRequête : Prisma.chantierFindManyArgs = {
      where: {
        NOT: { ministeres: { isEmpty: true } },
        id: { in: chantiersLectureIds },
        maille,
        ...whereOptions,
      },
      select: {
        id: true,
        maille: true,
        code_insee: true,
        est_applicable: true,
        taux_avancement_annuel: true,
        taux_avancement: true,
        taux_avancement_precedent: true,
        meteo: true,
        territoire_code: true,
      },
    };

    if (!profilsTerritoriaux.includes(profil)) {
      // Par defaut, la maille NAT est retournée pour afficher l'avancement du pays
      paramètresRequête.where!.territoire_code = { in: [...territoiresLectureIds, 'NAT-FR'] };
    }

    return this.prisma.chantier.findMany(paramètresRequête);
  }

  async récupérerTous(): Promise<ChantierPrisma[]> {
    return this.prisma.chantier.findMany();
  }

  async récupérerMétéoParChantierIdEtTerritoire(chantierId: string, maille: Maille, codeInsee: CodeInsee): Promise<Météo | null> {
    const chantierRow: ChantierPrisma | null = await this.prisma.chantier.findFirst({
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

  async modifierMétéo(chantierId: string, territoireCode: string, météo: Météo) {
    const { maille, codeInsee } = territoireCodeVersMailleCodeInsee(territoireCode);

    await this.prisma.chantier.update({
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
    const rows = await this.prisma.$queryRaw<any[]>`
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
      ministèreNom: it.ministeres_acronymes ? it.ministeres_acronymes[0] : null, // <-- en fait ce sont les porteurs
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
    
    const rows = await this.prisma.$queryRaw<any[]>`
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
