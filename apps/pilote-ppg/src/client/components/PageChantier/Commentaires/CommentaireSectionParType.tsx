import {
  CommentaireAvecNomsAuteurs,
  CommentaireV2,
  TypeCommentaireChantier,
} from "@/server/domain/chantier/commentaire/Commentaire.interface";
import {
  libellesTypesCommentaire,
  consignesEcritureCommentaire,
  complementsConsigneGeneriqueCommentaire,
} from "@/client/constants/libellesCommentaire";
import { pageChantier } from "@/components/PageChantier/PageChantierServerSideContext";
import { PublicationSection } from "@/components/PageChantier/Publication/PublicationSection";
import { commentaireForm } from "@/components/PageChantier/Publication/commentaireForm";
import { HistoriqueCommentaire } from "@/components/PageChantier/Commentaires/Historique/HistoriqueCommentaire";
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
      complementConsigneGenerique={
        complementsConsigneGeneriqueCommentaire[type]
      }
      consigne={consignesEcritureCommentaire[type]}
      formConfig={commentaireForm({
        publication: commentaire,
        brouillon: commentaireBrouillon,
      })}
      historiqueNode={<HistoriqueCommentaire type={type} />}
      libelle={libellesTypesCommentaire[type]}
      modeEcriture={modeEcriture}
      type={type}
      publication={commentaire}
    />
  );
};
