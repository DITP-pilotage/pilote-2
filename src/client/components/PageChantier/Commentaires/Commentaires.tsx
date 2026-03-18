import { Fragment } from "react";
import Bloc from "@/components/_commons/Bloc/Bloc";
import {
  typesCommentaireMailleNationale,
  typesCommentaireMailleRégionaleOuDépartementale,
} from "@/server/domain/chantier/commentaire/Commentaire.interface";
import { CommentaireSectionParType } from "@/components/PageChantier/Commentaires/CommentaireSectionParType";
import {
  pageChantier,
  useTerritoireSelectionne,
} from "@/components/PageChantier/PageChantierServerSideContext";

interface CommentairesProps {
  typesCommentaire:
    | typeof typesCommentaireMailleNationale
    | typeof typesCommentaireMailleRégionaleOuDépartementale;
  modeÉcriture?: boolean;
  estChantierArchive?: boolean;
}

export const Commentaires = ({
  typesCommentaire,
  modeÉcriture = false,
  estChantierArchive = false,
}: CommentairesProps) => {
  const { commentaires, commentairesBrouillon } =
    pageChantier.useServerSidePropsContext();
  const territoireSélectionné = useTerritoireSelectionne();
  return (
    <Bloc
      backgroundClassNameTitre={
        estChantierArchive ? "bg-dsfr-grey-925" : "bg-dsfr-blue-france-925"
      }
      titre={territoireSélectionné.nomAffiché}
    >
      {typesCommentaire.map((type, i) => (
        <Fragment key={type}>
          {i !== 0 && <hr className="fr-hr fr-mx-n2w" />}
          <CommentaireSectionParType
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
