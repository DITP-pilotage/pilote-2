import { Fragment, FunctionComponent } from "react";
import Bloc from "@/components/_commons/Bloc/Bloc";
import Chantier from "@/server/domain/chantier/Chantier.interface";
import {
  CommentaireAvecNomsAuteurs,
  CommentaireV2,
  TypeCommentaireChantier,
  typesCommentaireMailleNationale,
  typesCommentaireMailleRégionaleOuDépartementale,
} from "@/server/domain/chantier/commentaire/Commentaire.interface";
import { Maille } from "@/server/domain/maille/Maille.interface";
import CommentaireSection from "@/components/_commons/CommentairesNew/CommentaireSection/CommentaireSection";

interface CommentairesProps {
  commentaires: Record<
    TypeCommentaireChantier,
    CommentaireAvecNomsAuteurs | null
  >;
  commentairesBrouillon: Record<TypeCommentaireChantier, CommentaireV2 | null>;
  réformeId: Chantier["id"];
  maille: Maille;
  nomTerritoire: string;
  typesCommentaire:
    | typeof typesCommentaireMailleNationale
    | typeof typesCommentaireMailleRégionaleOuDépartementale;
  modeÉcriture?: boolean;
  estChantierArchive?: boolean;
  territoireCode: string;
}

const Commentaires: FunctionComponent<CommentairesProps> = ({
  commentaires,
  commentairesBrouillon,
  réformeId,
  maille,
  nomTerritoire,
  typesCommentaire,
  modeÉcriture = false,
  territoireCode,
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
          <CommentaireSection
            commentaire={commentaires[type]}
            commentaireBrouillon={commentairesBrouillon[type]}
            maille={maille}
            modeEcriture={modeÉcriture}
            réformeId={réformeId}
            territoireCode={territoireCode}
            type={type}
          />
        </Fragment>
      ))}
    </Bloc>
  );
};

export default Commentaires;
