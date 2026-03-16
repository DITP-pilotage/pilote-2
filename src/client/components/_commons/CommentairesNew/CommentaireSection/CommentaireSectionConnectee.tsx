import { FunctionComponent } from "react";
import {
  CommentaireAvecNomsAuteurs,
  CommentaireV2,
  TypeCommentaireChantier,
} from "@/server/domain/chantier/commentaire/Commentaire.interface";
import { useRefreshRouter } from "@/client/hooks/useRefreshRouter";
import {
  libellesTypesCommentaire,
  consignesEcritureCommentaire,
} from "@/client/constants/libellesCommentaire";
import { pageChantier } from "@/components/PageChantier/PageChantierServerSideContext";
import { useNouveauCommentaire } from "./BoutonNouveauCommentaire/useNouveauCommentaire";
import { useEditerBrouillonCommentaire } from "./BoutonNouveauCommentaire/useEditerBrouillonCommentaire";
import { useModifierCommentaire } from "./Formulaire/useModifierCommentaire";
import {
  BrouillonPublication,
  PublicationActions,
} from "./Publication.interface";
import CommentaireSection from "./CommentaireSection";
import HistoriqueCommentaire from "./Historique/Historique";

interface CommentaireSectionConnecteeProps {
  type: TypeCommentaireChantier;
  commentaire: CommentaireAvecNomsAuteurs | null;
  commentaireBrouillon: CommentaireV2 | null;
  modeEcriture?: boolean;
}

const CommentaireSectionConnectee: FunctionComponent<
  CommentaireSectionConnecteeProps
> = ({ type, commentaire, commentaireBrouillon, modeEcriture = false }) => {
  const { chantier, territoireCode } = pageChantier.useServerSidePropsContext();
  const refreshRouter = useRefreshRouter();

  const { publier, enregistrerEnBrouillon } = useNouveauCommentaire({
    chantierId: chantier.id,
    territoireCode,
    type,
    onSuccess: () => refreshRouter(),
  });

  const {
    publier: publierBrouillon,
    enregistrerEnBrouillon: modifierBrouillon,
  } = useEditerBrouillonCommentaire({
    brouillonId: commentaireBrouillon?.id ?? "",
    onSuccess: () => refreshRouter(),
  });

  const modifier = useModifierCommentaire({
    commentaireId: commentaire?.id ?? "",
    onSuccess: () => {},
  });

  const actions: PublicationActions = {
    publier,
    enregistrerEnBrouillon,
    publierBrouillon,
    modifierBrouillon,
    modifier,
  };

  const brouillon: BrouillonPublication | null = commentaireBrouillon
    ? {
        id: commentaireBrouillon.id,
        contenu: commentaireBrouillon.contenu,
        dateModification: commentaireBrouillon.dateModification,
      }
    : null;

  return (
    <CommentaireSection
      actions={actions}
      brouillon={brouillon}
      consigne={consignesEcritureCommentaire[type]}
      historiqueNode={<HistoriqueCommentaire type={type} />}
      libelle={libellesTypesCommentaire[type]}
      modeEcriture={modeEcriture}
      publication={commentaire}
    />
  );
};

export default CommentaireSectionConnectee;
