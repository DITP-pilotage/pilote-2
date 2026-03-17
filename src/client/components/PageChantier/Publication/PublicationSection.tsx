import { ReactNode } from "react";
import BandeauInformation from "@/components/_commons/BandeauInformation/BandeauInformation";
import AlertePublication from "@/components/PageChantier/Publication/AlertePublication";
import { AffichagePublication } from "@/components/PageChantier/Publication/Affichage/AffichagePublication";
import CommentaireFormulaire from "@/components/PageChantier/Commentaires/Formulaire/CommentaireFormulaire";
import BoutonNouveauCommentaire from "@/components/PageChantier/Commentaires/BoutonNouveauCommentaire/BoutonNouveauCommentaire";
import BoutonEditerBrouillonCommentaire from "@/components/PageChantier/Commentaires/BoutonNouveauCommentaire/BoutonEditerBrouillonCommentaire";
import { PiloteDateFormatter } from "@/server/rapports-hebdomadaires/infrastructure/adapters/PiloteDateFormatter";
import {
  PublicationBrouillon,
  PublicationActions,
  Publication,
} from "./Publication.interface";
import { usePublicationSectionEtat } from "./usePublicationSectionEtat";

interface PublicationSectionProps {
  libelle: string;
  consigne: string;
  publication: Publication | null;
  brouillon: PublicationBrouillon | null;
  modeEcriture?: boolean;
  actions: PublicationActions;
  historiqueNode?: ReactNode;
}

export const PublicationSection = ({
  libelle,
  consigne,
  publication,
  brouillon,
  modeEcriture = false,
  actions,
  historiqueNode,
}: PublicationSectionProps) => {
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
  } = usePublicationSectionEtat(actions);

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
          <AlertePublication action={alerteAction} />
          <AffichagePublication
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
