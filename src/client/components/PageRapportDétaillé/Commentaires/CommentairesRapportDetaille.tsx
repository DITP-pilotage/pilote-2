import { Fragment, FunctionComponent } from "react";
import Bloc from "@/components/_commons/Bloc/Bloc";
import {
  Commentaire,
  TypeCommentaireChantier,
  typesCommentaireMailleNationale,
  typesCommentaireMailleRégionaleOuDépartementale,
} from "@/server/domain/chantier/commentaire/Commentaire.interface";
import { libellesTypesCommentaire } from "@/client/constants/libellesCommentaire";
import { isDefined } from "@/client/utils/predicates";
import { RenduContenuHtml } from "@/components/_commons/EditeurRiche/RenduContenuHtml";
import { Badge } from "@/components/_commons/Badge";
import { PiloteDateFormatter } from "@/utils/PiloteDateFormatter";

interface CommentairesRapportDetailleProps {
  commentaires: Commentaire[];
  nomTerritoire: string;
  typesCommentaire:
    | typeof typesCommentaireMailleNationale
    | typeof typesCommentaireMailleRégionaleOuDépartementale;
}

const CommentairesRapportDetaille: FunctionComponent<
  CommentairesRapportDetailleProps
> = ({ commentaires, nomTerritoire, typesCommentaire }) => {
  const commentaireParType = new Map<TypeCommentaireChantier, Commentaire>(
    commentaires
      .filter(isDefined)
      .map((commentaire) => [commentaire.type, commentaire]),
  );

  return (
    <Bloc
      titre={nomTerritoire}
      backgroundClassNameTitre="bg-dsfr-blue-france-925"
      contenuClassesSupplémentaires=""
    >
      {typesCommentaire.map((type, index) => {
        const commentaire = commentaireParType.get(type) ?? null;
        return (
          <Fragment key={type}>
            {index !== 0 && <hr className="fr-hr p-1" />}
            <div className="py-4 px-6">
              <p className="font-bold mb-1 text-xl">
                {libellesTypesCommentaire[type]}
              </p>
              {commentaire ? (
                <>
                  <p className="text-xs text-dsfr-mention-grey mb-1">
                    {`Mis à jour le ${PiloteDateFormatter.isoDateFranceMetropolitaine(commentaire.date)} | Par ${commentaire.auteur}`}
                  </p>
                  <div className="fr-text--sm fr-mb-0">
                    <RenduContenuHtml
                      className="[&_p]:text-sm [&_p]:mb-1"
                      html={commentaire.contenu}
                    />
                  </div>
                </>
              ) : (
                <Badge type="gris">Non renseigné</Badge>
              )}
            </div>
          </Fragment>
        );
      })}
    </Bloc>
  );
};

export default CommentairesRapportDetaille;
