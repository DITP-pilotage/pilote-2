import CommentaireRepository from "@/server/domain/chantier/commentaire/CommentaireRepository.interface";
import {
  Commentaire,
  CommentaireV2,
  TypeCommentaireChantier,
} from "@/server/domain/chantier/commentaire/Commentaire.interface";
import Chantier from "@/server/domain/chantier/Chantier.interface";
import { groupByAndTransform } from "@/client/utils/arrays";
import { territoireCodeVersMailleCodeInsee } from "@/server/utils/territoires";
import { PrismaPilote } from "@/server/db/PrismaPilote";

export const NOMS_TYPES_COMMENTAIRES: Record<string, TypeCommentaireChantier> =
  {
    commentaires_sur_les_donnees: "commentairesSurLesDonnées",
    autres_resultats_obtenus: "autresRésultatsObtenus",
    autres_resultats_obtenus_non_correles_aux_indicateurs:
      "autresRésultatsObtenusNonCorrélésAuxIndicateurs",
    freins_a_lever: "risquesEtFreinsÀLever",
    actions_a_venir: "solutionsEtActionsÀVenir",
    actions_a_valoriser: "exemplesConcretsDeRéussite",
  };

export const CODES_TYPES_COMMENTAIRES: Record<TypeCommentaireChantier, string> =
  {
    commentairesSurLesDonnées: "commentaires_sur_les_donnees",
    autresRésultatsObtenus: "autres_resultats_obtenus",
    autresRésultatsObtenusNonCorrélésAuxIndicateurs:
      "autres_resultats_obtenus_non_correles_aux_indicateurs",
    risquesEtFreinsÀLever: "freins_a_lever",
    solutionsEtActionsÀVenir: "actions_a_venir",
    exemplesConcretsDeRéussite: "actions_a_valoriser",
  };

type CommentaireRaw = {
  id: string;
  chantier_id: string;
  type: string;
  contenu: string;
  date_modification: Date;
  nom: string | null;
  prenom: string | null;
};

export default class CommentaireSQLRepository implements CommentaireRepository {
  private prismaClient: PrismaPilote;

  constructor({ prisma }: { prisma: PrismaPilote }) {
    this.prismaClient = prisma;
  }

  get prisma() {
    return this.prismaClient.getInstance();
  }

  async save({
    id,
    chantierId,
    territoireCode,
    type,
    contenu,
    statut,
    auteurCreationId,
    dateCreation,
    auteurModificationId,
    dateModification,
  }: CommentaireV2): Promise<void> {
    const { maille, codeInsee } =
      territoireCodeVersMailleCodeInsee(territoireCode);

    await this.prisma.commentaire.upsert({
      where: { id },
      create: {
        id,
        chantier_id: chantierId,
        maille,
        code_insee: codeInsee,
        territoire_code: territoireCode,
        type: CODES_TYPES_COMMENTAIRES[type],
        contenu,
        statut,
        auteur_creation_id: auteurCreationId,
        date_creation: new Date(dateCreation),
        auteur_modification_id: auteurModificationId,
        date_modification: new Date(dateModification),
      },
      update: {
        contenu,
        statut,
        auteur_modification_id: auteurModificationId,
        date_modification: new Date(dateModification),
      },
    });
  }

  async récupérerLesPlusRécentsGroupésParChantier(
    listeChantierIds: Chantier["id"][],
    territoireCode: string,
  ): Promise<Record<string, Commentaire[]>> {
    const { maille, codeInsee } =
      territoireCodeVersMailleCodeInsee(territoireCode);

    const commentairesAvecAuteur = await this.prisma.$queryRaw<
      CommentaireRaw[]
    >`
      SELECT c.chantier_id, c.contenu, c.type, c.id, c.date_modification, utilisateur.nom, utilisateur.prenom
      FROM commentaire c
      LEFT JOIN utilisateur ON utilisateur.id = c.auteur_modification_id
      INNER JOIN (
        SELECT type, chantier_id, maille, code_insee, MAX(date_modification) as maxdate
        FROM commentaire
        WHERE chantier_id = ANY (${listeChantierIds})
          AND maille = ${maille}
          AND code_insee = ${codeInsee}
          AND statut = 'PUBLIE'
        GROUP BY type, chantier_id, maille, code_insee
      ) c_recents
        ON c.type = c_recents.type
        AND c.date_modification = c_recents.maxdate
        AND c.chantier_id = c_recents.chantier_id
        AND c.maille = c_recents.maille
        AND c.code_insee = c_recents.code_insee
        AND c.statut = 'PUBLIE'
    `;

    return groupByAndTransform(
      commentairesAvecAuteur,
      (commentaireAvecAuteur) => commentaireAvecAuteur.chantier_id,
      (commentaireAvecAuteur: CommentaireRaw) => {
        return {
          id: commentaireAvecAuteur.id,
          contenu: commentaireAvecAuteur.contenu,
          date: commentaireAvecAuteur.date_modification.toISOString(),
          auteur:
            commentaireAvecAuteur.nom && commentaireAvecAuteur.prenom
              ? `${commentaireAvecAuteur.prenom} ${commentaireAvecAuteur.nom}`
              : "Auteur Inconnu",
          type: NOMS_TYPES_COMMENTAIRES[commentaireAvecAuteur.type],
        };
      },
    );
  }
}
