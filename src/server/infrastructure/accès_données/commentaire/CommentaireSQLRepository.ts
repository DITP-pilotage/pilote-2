import { commentaire as CommentairePrisma, PrismaClient } from '@prisma/client';
import CommentaireRepository from '@/server/domain/commentaire/CommentaireRepository.interface';
import {
  Commentaire,
  Commentaires,
  TypeCommentaire,
} from '@/server/domain/commentaire/Commentaire.interface';
import { Maille } from '@/server/domain/maille/Maille.interface';
import { CodeInsee } from '@/server/domain/territoire/Territoire.interface';
import { CODES_MAILLES } from '@/server/infrastructure/accès_données/maille/mailleSQLParser';
import Chantier from '@/server/domain/chantier/Chantier.interface';

export const NOMS_TYPES_COMMENTAIRES: Record<string, TypeCommentaire> = {
  commentaires_sur_les_donnees: 'commentairesSurLesDonnées',
  autres_resultats_obtenus: 'autresRésultatsObtenus',
  autres_resultats_obtenus_non_correles_aux_indicateurs: 'autresRésultatsObtenusNonCorrélésAuxIndicateurs',
  freins_a_lever: 'risquesEtFreinsÀLever',
  actions_a_venir: 'solutionsEtActionsÀVenir',
  actions_a_valoriser: 'exemplesConcretsDeRéussite',
};

export const CODES_TYPES_COMMENTAIRES: Record<TypeCommentaire, string> = {
  commentairesSurLesDonnées: 'commentaires_sur_les_donnees',
  autresRésultatsObtenus: 'autres_resultats_obtenus',
  autresRésultatsObtenusNonCorrélésAuxIndicateurs: 'autres_resultats_obtenus_non_correles_aux_indicateurs',
  risquesEtFreinsÀLever: 'freins_a_lever',
  solutionsEtActionsÀVenir: 'actions_a_venir',
  exemplesConcretsDeRéussite: 'actions_a_valoriser',
};

export default class CommentaireSQLRepository implements CommentaireRepository {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  private mapperVersDomaine(commentairePrisma: CommentairePrisma | undefined) {
    if (commentairePrisma === undefined) return null;
    return {
      id: commentairePrisma.id,
      contenu: commentairePrisma.contenu,
      date: commentairePrisma.date.toISOString(),
      auteur: commentairePrisma.auteur,
      type: NOMS_TYPES_COMMENTAIRES[commentairePrisma.type],
    };
  }

  async récupérerLePlusRécent(chantierId: string, maille: Maille, codeInsee: CodeInsee, type: TypeCommentaire): Promise<Commentaire> {
    const commentaireLePlusRécent = await this.prisma.commentaire.findFirst({
      where: {
        chantier_id: chantierId,
        maille: CODES_MAILLES[maille],
        code_insee: codeInsee,
        type: CODES_TYPES_COMMENTAIRES[type],
      },
      orderBy: { date: 'desc' },
    });

    return commentaireLePlusRécent ? this.mapperVersDomaine(commentaireLePlusRécent) : null;
  }

  async récupérerHistorique(chantierId: string, maille: Maille, codeInsee: CodeInsee, type: TypeCommentaire): Promise<Commentaire[]> {
    const commentaires: CommentairePrisma[] = await this.prisma.commentaire.findMany({
      where: {
        chantier_id: chantierId,
        maille: CODES_MAILLES[maille],
        code_insee: codeInsee,
        type: CODES_TYPES_COMMENTAIRES[type],
      },
      orderBy: { date: 'desc' },
    });

    return commentaires.map(commentaireDeLHistorique => this.mapperVersDomaine(commentaireDeLHistorique));
  }

  async créer(chantierId: string, maille: Maille, codeInsee: CodeInsee, id: string, contenu: string, auteur: string, type: TypeCommentaire, date: Date): Promise<Commentaire> {
    const commentaireCréé =  await this.prisma.commentaire.create({
      data: {
        id: id,
        chantier_id: chantierId,
        maille: CODES_MAILLES[maille],
        code_insee: codeInsee,
        contenu: contenu,
        type: CODES_TYPES_COMMENTAIRES[type],
        date: date,
        auteur: auteur,
      } });

    return this.mapperVersDomaine(commentaireCréé);
  }

  async récupérerLesPlusRécentesGroupéesParChantier(maille: Maille, codeInsee: CodeInsee): Promise<Record<Chantier['id'], Commentaires>> {
    const commentaires = await this.prisma.$queryRaw<CommentairePrisma[]>`
    SELECT t1.chantier_id, t1.contenu, t1.auteur, t1.type, id, date
    FROM commentaire t1
            INNER JOIN
        (
            SELECT type,chantier_id, MAX(date) as maxdate
            FROM commentaire
            GROUP BY type,chantier_id
        ) t2
      ON t1.type = t2.type
      AND t1.date = t2.maxdate
      AND t1.chantier_id = t2.chantier_id
      WHERE t1.code_insee = 'FR' 
      and t1.maille='NAT'
    `;
    
    const chantiersIds = commentaires.map(commentaire => commentaire.chantier_id);
    return Object.fromEntries(
      chantiersIds.map(chantierId => (
        [
          chantierId,
          {
            autresRésultatsObtenusNonCorrélésAuxIndicateurs: this.mapperVersDomaine(
              commentaires.find(
                commentaire => commentaire.chantier_id === chantierId && commentaire.type === CODES_TYPES_COMMENTAIRES['autresRésultatsObtenusNonCorrélésAuxIndicateurs'],
              ),
            ), 
            risquesEtFreinsÀLever: this.mapperVersDomaine(
              commentaires.find(
                commentaire => commentaire.chantier_id === chantierId && commentaire.type === CODES_TYPES_COMMENTAIRES['risquesEtFreinsÀLever'],
              ),
            ),
            solutionsEtActionsÀVenir: this.mapperVersDomaine(
              commentaires.find(
                commentaire => commentaire.chantier_id === chantierId && commentaire.type === CODES_TYPES_COMMENTAIRES['solutionsEtActionsÀVenir'],
              ),
            ),
            exemplesConcretsDeRéussite: this.mapperVersDomaine(
              commentaires.find(
                commentaire => commentaire.chantier_id === chantierId && commentaire.type === CODES_TYPES_COMMENTAIRES['exemplesConcretsDeRéussite'],
              ),
            ),
          },
        ]
      )),
    );
  }
}
