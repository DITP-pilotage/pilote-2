import { ReactNode } from "react";
import BandeauInformation from "@/components/_commons/BandeauInformation/BandeauInformation";
import AlerteCommentaire from "@/components/_commons/CommentairesNew/CommentaireSection/AlerteCommentaire";
import { AffichageCommentaire } from "@/components/_commons/CommentairesNew/CommentaireSection/Affichage/Affichage";
import CommentaireFormulaire from "@/components/_commons/CommentairesNew/CommentaireSection/Formulaire/CommentaireFormulaire";
import BoutonNouveauCommentaire from "@/components/_commons/CommentairesNew/CommentaireSection/BoutonNouveauCommentaire/BoutonNouveauCommentaire";
import BoutonEditerBrouillonCommentaire from "@/components/_commons/CommentairesNew/CommentaireSection/BoutonNouveauCommentaire/BoutonEditerBrouillonCommentaire";
import { PiloteDateFormatter } from "@/server/rapports-hebdomadaires/infrastructure/adapters/PiloteDateFormatter";
import {
  PublicationBrouillon,
  PublicationActions,
  Publication,
} from "./Publication.interface";
import { useCommentaireSectionEtat } from "./useCommentaireSectionEtat";

interface CommentaireSectionProps {
  libelle: string;
  consigne: string;
  publication: Publication | null;
  brouillon: PublicationBrouillon | null;
  modeEcriture?: boolean;
  actions: PublicationActions;
  historiqueNode?: ReactNode;
}

export const CommentaireSection = ({
  libelle,
  consigne,
  publication,
  brouillon,
  modeEcriture = false,
  actions,
  historiqueNode,
}: CommentaireSectionProps) => {
  const {
    modeÉdition,
    entrerEnModeÉdition,
    quitterModeÉdition,
    alerteAction,
    handleModifier,
    handlePublier,
    handleBrouillon,
    handlePublierBrouillon,
    handleModifierBrouillon,
  } = useCommentaireSectionEtat(actions);

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
          annulationCallback={quitterModeÉdition}
          consigne={consigne}
          libelle={libelle}
          onModifier={handleModifier}
          publication={publication}
        />
      ) : (
        <>
          <AlerteCommentaire action={alerteAction} />
          <AffichageCommentaire
            commentaire={publication}
            onModifier={modeEcriture ? entrerEnModeÉdition : undefined}
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
                  onEnregistrerBrouillon={handleModifierBrouillon}
                  onPublier={handlePublierBrouillon}
                />
              ) : (
                <BoutonNouveauCommentaire
                  commentaire={publication}
                  consigne={consigne}
                  libelle={libelle}
                  onEnregistrerBrouillon={handleBrouillon}
                  onPublier={handlePublier}
                />
              ))}
          </div>
        </>
      )}
    </div>
  );
};
