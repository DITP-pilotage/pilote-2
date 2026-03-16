import { FunctionComponent, ReactNode, useState } from "react";
import { SubmitHandler } from "react-hook-form";
import { useRefreshRouter } from "@/client/hooks/useRefreshRouter";
import BandeauInformation from "@/components/_commons/BandeauInformation/BandeauInformation";
import AlerteCommentaire, {
  CommentaireAction,
} from "@/components/_commons/CommentairesNew/CommentaireSection/AlerteCommentaire";
import AffichageCommentaire from "@/components/_commons/CommentairesNew/CommentaireSection/Affichage/Affichage";
import CommentaireFormulaire from "@/components/_commons/CommentairesNew/CommentaireSection/Formulaire/CommentaireFormulaire";
import BoutonNouveauCommentaire from "@/components/_commons/CommentairesNew/CommentaireSection/BoutonNouveauCommentaire/BoutonNouveauCommentaire";
import BoutonEditerBrouillonCommentaire from "@/components/_commons/CommentairesNew/CommentaireSection/BoutonNouveauCommentaire/BoutonEditerBrouillonCommentaire";
import { PiloteDateFormatter } from "@/server/rapports-hebdomadaires/infrastructure/adapters/PiloteDateFormatter";
import {
  BrouillonPublication,
  PublicationActions,
  PublicationAvecAuteur,
} from "./Publication.interface";

interface CommentaireSectionProps {
  libelle: string;
  consigne: string;
  publication: PublicationAvecAuteur | null;
  brouillon: BrouillonPublication | null;
  modeEcriture?: boolean;
  actions: PublicationActions;
  historiqueNode?: ReactNode;
}

const CommentaireSection: FunctionComponent<CommentaireSectionProps> = ({
  libelle,
  consigne,
  publication,
  brouillon,
  modeEcriture = false,
  actions,
  historiqueNode,
}) => {
  const [modeÉdition, setModeÉdition] = useState(false);
  const [action, setAction] = useState<CommentaireAction | null>(null);
  const refreshRouter = useRefreshRouter();

  const handleModifier: SubmitHandler<{ contenu: string }> = async (data) => {
    await actions.modifier(data);
    setModeÉdition(false);
    refreshRouter();
    setAction("modification-reussie");
  };

  return (
    <div className="px-2 py-4">
      {!modeÉdition && <h5 className="font-bold text-xl mb-1">{libelle}</h5>}
      {brouillon?.dateModification ? (
        <div className="my-2">
          <BandeauInformation bandeauType="INFO">
            {`Vous avez enregistré un nouveau commentaire en tant que brouillon le ${PiloteDateFormatter.isoDateFranceMetropolitaine(brouillon.dateModification)}`}
          </BandeauInformation>
        </div>
      ) : null}
      {modeÉdition && modeEcriture ? (
        <CommentaireFormulaire
          annulationCallback={() => setModeÉdition(false)}
          consigne={consigne}
          libelle={libelle}
          onModifier={handleModifier}
          publication={publication}
        />
      ) : (
        <>
          <AlerteCommentaire action={action} />
          <AffichageCommentaire
            commentaire={publication}
            onModifier={modeEcriture ? () => setModeÉdition(true) : undefined}
          />
          <div className="flex justify-end items-center gap-4 mt-2">
            {publication ? historiqueNode : null}
            {modeEcriture &&
              (brouillon?.dateModification ? (
                <BoutonEditerBrouillonCommentaire
                  brouillon={brouillon}
                  commentaire={publication}
                  consigne={consigne}
                  libelle={libelle}
                  onAction={setAction}
                  onBrouillon={actions.modifierBrouillon}
                  onPublier={actions.publierBrouillon}
                />
              ) : (
                <BoutonNouveauCommentaire
                  commentaire={publication}
                  consigne={consigne}
                  libelle={libelle}
                  onAction={setAction}
                  onBrouillon={actions.enregistrerEnBrouillon}
                  onPublier={actions.publier}
                />
              ))}
          </div>
        </>
      )}
    </div>
  );
};

export default CommentaireSection;
