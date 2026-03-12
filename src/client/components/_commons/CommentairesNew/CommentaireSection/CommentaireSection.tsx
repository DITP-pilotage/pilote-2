import { FunctionComponent, useState } from "react";
import { useRefreshRouter } from "@/client/hooks/useRefreshRouter";
import {
  CommentaireAvecNomsAuteurs,
  CommentaireV2,
  TypeCommentaireChantier,
} from "@/server/domain/chantier/commentaire/Commentaire.interface";
import BandeauInformation from "@/components/_commons/BandeauInformation/BandeauInformation";
import { libellesTypesCommentaire } from "@/client/constants/libellesCommentaire";
import AlerteCommentaire, {
  CommentaireAction,
} from "@/components/_commons/CommentairesNew/CommentaireSection/AlerteCommentaire";
import AffichageCommentaire from "@/components/_commons/CommentairesNew/CommentaireSection/Affichage/Affichage";
import HistoriqueCommentaire from "@/components/_commons/CommentairesNew/CommentaireSection/Historique/Historique";
import CommentaireFormulaire from "@/components/_commons/CommentairesNew/CommentaireSection/Formulaire/CommentaireFormulaire";
import BoutonNouveauCommentaire from "@/components/_commons/CommentairesNew/CommentaireSection/BoutonNouveauCommentaire/BoutonNouveauCommentaire";
import BoutonEditerBrouillonCommentaire from "@/components/_commons/CommentairesNew/CommentaireSection/BoutonNouveauCommentaire/BoutonEditerBrouillonCommentaire";
import { PiloteDateFormatter } from "@/server/rapports-hebdomadaires/infrastructure/adapters/PiloteDateFormatter";

interface CommentaireSectionProps {
  type: TypeCommentaireChantier;
  commentaire: CommentaireAvecNomsAuteurs | null;
  commentaireBrouillon: CommentaireV2 | null;
  modeEcriture?: boolean;
}

const CommentaireSection: FunctionComponent<CommentaireSectionProps> = ({
  type,
  commentaire,
  commentaireBrouillon,
  modeEcriture = false,
}) => {
  const [modeÉdition, setModeÉdition] = useState(false);
  const [action, setAction] = useState<CommentaireAction | null>(null);
  const refreshRouter = useRefreshRouter();

  return (
    <div className="px-2 py-4">
      {!modeÉdition && (
        <p className="font-bold text-xl mb-1">
          {libellesTypesCommentaire[type]}
        </p>
      )}
      {commentaireBrouillon?.dateModification ? (
        <div className="my-2">
          <BandeauInformation bandeauType="INFO">
            {`Vous avez enregistré un nouveau commentaire en tant que brouillon le ${PiloteDateFormatter.isoDateFranceMetropolitaine(commentaireBrouillon.dateModification)}`}
          </BandeauInformation>
        </div>
      ) : null}
      {modeÉdition && modeEcriture ? (
        <CommentaireFormulaire
          annulationCallback={() => setModeÉdition(false)}
          commentaire={commentaire}
          onSuccess={(commentaireAction) => {
            setModeÉdition(false);
            refreshRouter();
            setAction(commentaireAction);
          }}
          type={type}
        />
      ) : (
        <>
          <AlerteCommentaire action={action} />
          <AffichageCommentaire
            commentaire={commentaire}
            onModifier={modeEcriture ? () => setModeÉdition(true) : undefined}
          />
          <div className="flex justify-end items-center gap-4 mt-2">
            {commentaire ? <HistoriqueCommentaire type={type} /> : null}
            {modeEcriture &&
              (commentaireBrouillon?.dateModification ? (
                <BoutonEditerBrouillonCommentaire
                  commentaire={commentaire}
                  brouillon={commentaireBrouillon}
                  onAction={setAction}
                />
              ) : (
                <BoutonNouveauCommentaire
                  commentaire={commentaire}
                  onAction={setAction}
                  type={type}
                />
              ))}
          </div>
        </>
      )}
    </div>
  );
};

export default CommentaireSection;
