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
import Utilisateur from '@/server/domain/utilisateur/Utilisateur.interface';
import RécupérerListeChantierIdsAccessiblesEnLectureUseCase from '@/server/usecase/utilisateur/RécupérerListeChantierIdsAccessiblesEnLectureUseCase/RécupérerListeChantierIdsAccessiblesEnLectureUseCase';
import RécupérerListeTerritoireCodesAccessiblesEnLectureUseCase from '@/server/usecase/utilisateur/RécupérerListeTerritoireCodesAccessiblesEnLectureUseCase/RécupérerListeTerritoireCodesAccessiblesEnLectureUseCase';

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

  async getById(id: string, habilitation: Utilisateur['scopes']): Promise<Chantier> {
    const chantiersLecture = new RécupérerListeChantierIdsAccessiblesEnLectureUseCase(habilitation).run();
    
    const peutAccéderAuChantier = chantiersLecture.includes(id);
  
    if (!peutAccéderAuChantier) {
      throw new ErreurChantierPermission(id);
    }

    const territoiresLecture = new RécupérerListeTerritoireCodesAccessiblesEnLectureUseCase(habilitation).run();
    // Par defaut, la maille NAT est retournée pour afficher l'avancement du pays
    territoiresLecture.push('NAT-FR');
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

  async getListe(habilitation: Utilisateur['scopes']): Promise<Chantier[]> {
    const chantiersLecture = new RécupérerListeChantierIdsAccessiblesEnLectureUseCase(habilitation).run();
    const territoiresLecture = new RécupérerListeTerritoireCodesAccessiblesEnLectureUseCase(habilitation).run();
    // Par defaut, la maille NAT est retournée pour afficher l'avancement du pays
    territoiresLecture.push('NAT-FR');
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

  async getChantiersPourExports(habilitation: Utilisateur['scopes']): Promise<ChantierPourExport[]> {
    const chantiers_lecture = new RécupérerListeChantierIdsAccessiblesEnLectureUseCase(habilitation).run();
    

    const rows = await this.prisma.$queryRaw<any[]>`
        with chantier_ids as (select distinct c.id
                              from chantier c
                              where c.id in (${Prisma.join(chantiers_lecture)})
                                and ministeres <> '{}'),
             derniers_commentaires as (select *
                                       from (select c.*,
                                                    row_number() over (partition by chantier_id, maille, code_insee, type order by date desc) r
                                             from commentaire c) o
                                       where o.r = 1),
             dernieres_syntheses as (select *
                                     from (select s.*,
                                                  row_number() over (partition by chantier_id, maille, code_insee order by date_commentaire desc) r
                                           from synthese_des_resultats s
                                           where date_commentaire is not null) sr
                                     where sr.r = 1)

        select c.*,
               r.territoire_code code_regional,
               d.territoire_code code_departemental,
               n.taux_avancement taux_national,
               r.taux_avancement taux_regional,
               d.taux_avancement taux_departemental,
               o.contenu         objectif,
               a.contenu         action_a_venir,
               f.contenu         frein_a_lever,
               s.commentaire     synthese_des_resultats
        from chantier_ids cids
                 cross join territoire t
                 left outer join chantier c on c.id = cids.id and c.territoire_code = t.code
                 left outer join chantier n on n.id = cids.id and n.maille = 'NAT'
                 left outer join chantier r on (r.id = cids.id and r.maille = 'REG')
            and (r.territoire_code = t.code or r.territoire_code = t.code_parent)
                 left outer join chantier d on d.id = cids.id and d.maille = 'DEPT' and d.territoire_code = t.code
                 left outer join derniers_commentaires o
                                 on o.chantier_id = c.id and o.maille = c.maille and o.code_insee = c.code_insee
                                     and o.type = 'objectifs'
                 left outer join derniers_commentaires a
                                 on a.chantier_id = c.id and a.maille = c.maille and a.code_insee = c.code_insee
                                     and a.type = 'actions_a_venir'
                 left outer join derniers_commentaires f
                                 on f.chantier_id = c.id and f.maille = c.maille and f.code_insee = c.code_insee
                                     and f.type = 'freins_a_lever'
                 left outer join dernieres_syntheses s
                                 on s.chantier_id = c.id and s.maille = c.maille and s.code_insee = c.code_insee
        where c.id is not null
        order by nom, maille, code_regional, code_departemental
    `;
    return rows.map(it => new ChantierPourExport(
      it.id,
      it.nom,
      it.maille,
      it.code_insee,
      it.code_regional,
      it.code_departemental,
      it.ministeres ? it.ministeres[0] : null, // <-- en fait ce sont les porteurs
      it.taux_national,
      it.taux_regional,
      it.taux_departemental,
      it.meteo,
      it.est_barometre,
      it.est_territorialise,
      it.objectif,
      it.action_a_venir,
      it.frein_a_lever,
      it.synthese_des_resultats,
    ));
  }
}
