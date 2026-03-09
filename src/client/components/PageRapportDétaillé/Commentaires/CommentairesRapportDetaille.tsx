import { Fragment, FunctionComponent } from "react";
import Bloc from "@/components/_commons/Bloc/Bloc";
import {
  Commentaire,
  TypeCommentaireChantier,
  typesCommentaireMailleNationale,
  typesCommentaireMailleRégionaleOuDépartementale,
} from "@/server/domain/chantier/commentaire/Commentaire.interface";
import { libellésTypesCommentaire } from "@/client/constants/libellésCommentaire";
import { formaterDate } from "@/client/utils/date/date";
import { nettoyerUneChaîneDeCaractèresPourAffichageHTML } from "@/client/utils/strings";
import { Badge } from "@/components/_commons/Badge";

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
      .filter((commentaire) => commentaire !== null)
      .map((commentaire) => [commentaire!.type, commentaire]),
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
                {libellésTypesCommentaire[type]}
              </p>
              {commentaire ? (
                <>
                  <p className="text-xs text-dsfr-mention-grey mb-1">
                    {`Mis à jour le ${formaterDate(commentaire.date, "DD/MM/YYYY")}`}
                    {!!commentaire.auteur && ` | Par ${commentaire.auteur}`}
                  </p>
                  <p
                    className="fr-text--sm fr-mb-0"
                    dangerouslySetInnerHTML={{
                      __html: nettoyerUneChaîneDeCaractèresPourAffichageHTML(
                        commentaire.contenu,
                      ),
                    }}
                  />
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
