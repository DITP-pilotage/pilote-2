import { $Enums } from "@prisma/client";
import { PrismaPilote } from "@/server/db/PrismaPilote";
import { getServiceLibelle } from "@/client/constants/referentiel-services";
import { TypeCommentaireChantier } from "@/server/domain/chantier/commentaire/Commentaire.interface";
import {
  CODES_TYPES_COMMENTAIRES,
  NOMS_TYPES_COMMENTAIRES,
} from "@/server/infrastructure/accès_données/chantier/commentaire/CommentaireSQLRepository";

export type CommentaireHistoriqueItem = {
  chantierId: string;
  territoireCode: string;
  type: TypeCommentaireChantier;
  contenu: string;
  dateCreation: string;
  dateModification: string;
  auteurCreationNom: string;
  auteurCreationService: string | null;
  auteurCreationFonction: string | null;
  auteurModificationNom: string;
  auteurModificationService: string | null;
  auteurModificationFonction: string | null;
};

export class RecupererHistoriqueCommentaireQuery {
  constructor(private readonly deps: { prisma: PrismaPilote }) {}

  async run(
    chantierId: string,
    territoireCode: string,
    type: TypeCommentaireChantier,
  ): Promise<CommentaireHistoriqueItem[]> {
    const commentaires = await this.deps.prisma
      .getInstance()
      .commentaire.findMany({
        where: {
          chantier_id: chantierId,
          territoire_code: territoireCode,
          type: CODES_TYPES_COMMENTAIRES[type],
          statut: $Enums.statut_publication.PUBLIE,
        },
        include: { auteur_creation: true, auteur_modification: true },
        orderBy: { date_modification: "desc" },
      });

    return commentaires.map((commentaire) => ({
      chantierId: commentaire.chantier_id,
      territoireCode: commentaire.territoire_code,
      type: NOMS_TYPES_COMMENTAIRES[commentaire.type],
      contenu: commentaire.contenu,
      dateCreation: commentaire.date_creation.toISOString(),
      dateModification: commentaire.date_modification.toISOString(),
      auteurCreationNom: `${commentaire.auteur_creation.prenom} ${commentaire.auteur_creation.nom}`,
      auteurCreationService: getServiceLibelle(
        commentaire.auteur_creation.perimetre_ministeriel,
        commentaire.auteur_creation.service,
        commentaire.auteur_creation.service_autre,
      ),
      auteurCreationFonction: commentaire.auteur_creation.fonction,
      auteurModificationNom: `${commentaire.auteur_modification.prenom} ${commentaire.auteur_modification.nom}`,
      auteurModificationService: getServiceLibelle(
        commentaire.auteur_modification.perimetre_ministeriel,
        commentaire.auteur_modification.service,
        commentaire.auteur_modification.service_autre,
      ),
      auteurModificationFonction: commentaire.auteur_modification.fonction,
    }));
  }
}
