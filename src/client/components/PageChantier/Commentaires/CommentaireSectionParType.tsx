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
import { PublicationSection } from "@/components/PageChantier/Publication/PublicationSection";
import HistoriqueCommentaire from "@/components/PageChantier/Commentaires/Historique/HistoriqueCommentaire";
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
    <PublicationSection
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
