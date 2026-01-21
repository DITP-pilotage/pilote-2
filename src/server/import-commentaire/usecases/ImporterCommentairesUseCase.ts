import { randomUUID } from "node:crypto";
import CommentaireRepository from "@/server/domain/chantier/commentaire/CommentaireRepository.interface";
import { Habilitations } from "@/server/domain/utilisateur/habilitation/Habilitation.interface";
import {
  CommentaireImporteContrat,
  ImportCommentaireContrat,
  ImportCommentaireErreur,
} from "@/server/import-commentaire/app/contrats/ImportCommentaireAPIContrat";
import {
  mapTypeCommentaireAPIVersDomaine,
  typesCommentaireAPINationaux,
  typesCommentaireAPIRegionauxDepartementaux,
} from "@/validation/importCommentaire";

export interface ImporterCommentairesInput {
  chantierId: string;
  commentaires: ImportCommentaireContrat[];
  auteurId: string;
  habilitations: Habilitations;
}

export interface ImporterCommentairesResult {
  success: boolean;
  commentaires?: CommentaireImporteContrat[];
  erreurs?: ImportCommentaireErreur[];
}

export class ImporterCommentairesUseCase {
  constructor(private readonly commentaireRepository: CommentaireRepository) {}

  async execute(
    input: ImporterCommentairesInput,
  ): Promise<ImporterCommentairesResult> {
    const { chantierId, commentaires, auteurId, habilitations } = input;

    const erreurs = this.validerCommentaires(
      commentaires,
      chantierId,
      habilitations,
    );

    if (erreurs.length > 0) {
      return {
        success: false,
        erreurs,
      };
    }

    const commentairesCrees: CommentaireImporteContrat[] = [];

    for (const commentaire of commentaires) {
      const id = randomUUID();
      const date = commentaire.date_commentaire
        ? new Date(commentaire.date_commentaire)
        : new Date();
      const typeDomaine = mapTypeCommentaireAPIVersDomaine(commentaire.type);

      await this.commentaireRepository.créer(
        chantierId,
        commentaire.territoire,
        id,
        commentaire.contenu,
        auteurId,
        typeDomaine,
        date,
      );

      commentairesCrees.push({
        id,
        territoire: commentaire.territoire,
        type: typeDomaine,
      });
    }

    return {
      success: true,
      commentaires: commentairesCrees,
    };
  }

  private validerCommentaires(
    commentaires: ImportCommentaireContrat[],
    chantierId: string,
    habilitations: Habilitations,
  ): ImportCommentaireErreur[] {
    const erreurs: ImportCommentaireErreur[] = [];

    commentaires.forEach((commentaire, index) => {
      const erreurHabilitation = this.validerHabilitation(
        commentaire,
        chantierId,
        habilitations,
      );
      if (erreurHabilitation) {
        erreurs.push({ index, ...erreurHabilitation });
        return;
      }

      const erreurTypeMaille = this.validerTypeMaille(commentaire);
      if (erreurTypeMaille) {
        erreurs.push({ index, ...erreurTypeMaille });
      }
    });

    return erreurs;
  }

  private validerHabilitation(
    commentaire: ImportCommentaireContrat,
    chantierId: string,
    habilitations: Habilitations,
  ): Omit<ImportCommentaireErreur, "index"> | null {
    if (!habilitations.saisieCommentaire.chantiers.includes(chantierId)) {
      return {
        territoire: commentaire.territoire,
        type: commentaire.type,
        message: `Vous n'êtes pas autorisé à saisir des commentaires pour le chantier ${chantierId}`,
      };
    }

    if (
      !habilitations.saisieCommentaire.territoires.includes(
        commentaire.territoire,
      )
    ) {
      return {
        territoire: commentaire.territoire,
        type: commentaire.type,
        message: `Vous n'êtes pas autorisé à saisir des commentaires pour le territoire ${commentaire.territoire}`,
      };
    }

    return null;
  }

  private validerTypeMaille(
    commentaire: ImportCommentaireContrat,
  ): Omit<ImportCommentaireErreur, "index"> | null {
    const maille = commentaire.territoire.split("-")[0];
    const isMailleNationale = maille === "NAT";
    const isMailleRegionaleOuDepartementale =
      maille === "REG" || maille === "DEPT";

    if (
      isMailleNationale &&
      !typesCommentaireAPINationaux.includes(commentaire.type)
    ) {
      return {
        territoire: commentaire.territoire,
        type: commentaire.type,
        message: `Le type '${commentaire.type}' n'est pas autorisé pour la maille nationale. Types autorisés : ${typesCommentaireAPINationaux.join(", ")}`,
      };
    }

    if (
      isMailleRegionaleOuDepartementale &&
      !typesCommentaireAPIRegionauxDepartementaux.includes(commentaire.type)
    ) {
      return {
        territoire: commentaire.territoire,
        type: commentaire.type,
        message: `Le type '${commentaire.type}' n'est pas autorisé pour la maille ${maille === "REG" ? "régionale" : "départementale"}. Types autorisés : ${typesCommentaireAPIRegionauxDepartementaux.join(", ")}`,
      };
    }

    return null;
  }
}
