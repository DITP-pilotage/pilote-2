import {
  CommentaireAvecNomsAuteurs,
  CommentaireV2,
  TypeCommentaireChantier,
} from "@/server/domain/chantier/commentaire/Commentaire.interface";
import {
  libellesTypesCommentaire,
  consignesEcritureCommentaire,
} from "@/client/constants/libellesCommentaire";
import { pageChantier } from "@/components/PageChantier/PageChantierServerSideContext";
import { CommentaireSection } from "./CommentaireSection";
import HistoriqueCommentaire from "./Historique/Historique";
import { useCommentaireActions } from "./useCommentaireActions";

interface CommentaireSectionConnecteeProps {
  type: TypeCommentaireChantier;
  commentaire: CommentaireAvecNomsAuteurs | null;
  commentaireBrouillon: CommentaireV2 | null;
  modeEcriture?: boolean;
}

export const CommentaireSectionParType = ({
  type,
  commentaire,
  commentaireBrouillon,
  modeEcriture = false,
}: CommentaireSectionConnecteeProps) => {
  const { chantier, territoireCode } = pageChantier.useServerSidePropsContext();

  const actions = useCommentaireActions({
    chantierId: chantier.id,
    territoireCode,
    type,
    commentaire,
    brouillon: commentaireBrouillon,
  });

  return (
    <CommentaireSection
      actions={actions}
      brouillon={commentaireBrouillon}
      consigne={consignesEcritureCommentaire[type]}
      historiqueNode={<HistoriqueCommentaire type={type} />}
      libelle={libellesTypesCommentaire[type]}
      modeEcriture={modeEcriture}
      publication={commentaire}
    />
  );
};
