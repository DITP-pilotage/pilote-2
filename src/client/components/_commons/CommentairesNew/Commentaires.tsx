import { Fragment, FunctionComponent } from "react";
import Bloc from "@/components/_commons/Bloc/Bloc";
import {
  CommentaireAvecNomsAuteurs,
  CommentaireV2,
  TypeCommentaireChantier,
  typesCommentaireMailleNationale,
  typesCommentaireMailleRégionaleOuDépartementale,
} from "@/server/domain/chantier/commentaire/Commentaire.interface";
import CommentaireSectionConnectee from "@/components/_commons/CommentairesNew/CommentaireSection/CommentaireSectionConnectee";

interface CommentairesProps {
  commentaires: Record<
    TypeCommentaireChantier,
    CommentaireAvecNomsAuteurs | null
  >;
  commentairesBrouillon: Record<TypeCommentaireChantier, CommentaireV2 | null>;
  nomTerritoire: string;
  typesCommentaire:
    | typeof typesCommentaireMailleNationale
    | typeof typesCommentaireMailleRégionaleOuDépartementale;
  modeÉcriture?: boolean;
  estChantierArchive?: boolean;
}

const Commentaires: FunctionComponent<CommentairesProps> = ({
  commentaires,
  commentairesBrouillon,
  nomTerritoire,
  typesCommentaire,
  modeÉcriture = false,
  estChantierArchive = false,
}) => {
  return (
    <Bloc
      backgroundClassNameTitre={
        estChantierArchive ? "bg-dsfr-grey-925" : "bg-dsfr-blue-france-925"
      }
      titre={nomTerritoire}
    >
      {typesCommentaire.map((type, i) => (
        <Fragment key={type}>
          {i !== 0 && <hr className="fr-hr fr-mx-n2w" />}
          <CommentaireSectionConnectee
            commentaire={commentaires[type]}
            commentaireBrouillon={commentairesBrouillon[type]}
            modeEcriture={modeÉcriture}
            type={type}
          />
        </Fragment>
      ))}
    </Bloc>
  );
};

export default Commentaires;
