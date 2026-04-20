import { ReactNode } from "react";
import BandeauInformation from "@/components/_commons/BandeauInformation/BandeauInformation";
import AlertePublication from "@/components/PageChantier/PublicationV2/AlertePublication";
import { AffichagePublication } from "@/components/PageChantier/PublicationV2/Affichage/AffichagePublication";
import FormulairePublication from "@/components/PageChantier/PublicationV2/FormulairePublication";
import { BoutonNouvellePublication } from "@/components/PageChantier/PublicationV2/BoutonNouvellePublication";
import { BoutonEditerBrouillonPublication } from "@/components/PageChantier/PublicationV2/BoutonEditerBrouillonPublication";
import { PiloteDateFormatter } from "@/utils/PiloteDateFormatter";
import {
  PublicationBrouillon,
  PublicationActions,
  Publication,
} from "./Publication.interface";
import { usePublicationSectionEtat } from "./usePublicationSectionEtat";

interface PublicationSectionProps {
  libelle: string;
  consigne: string;
  complementConsigneGenerique: string;
  publication: Publication | null;
  brouillon: PublicationBrouillon | null;
  modeEcriture?: boolean;
  actions: PublicationActions;
  historiqueNode?: ReactNode;
  type: string;
}

export const PublicationSection = ({
  libelle,
  consigne,
  complementConsigneGenerique,
  publication,
  brouillon,
  modeEcriture = false,
  actions,
  historiqueNode,
  type,
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
          <BandeauInformation bandeauType="INFO" classNameContainer="px-4">
            {`Vous avez enregistré un nouveau commentaire en tant que brouillon le ${PiloteDateFormatter.isoDateFranceMetropolitaine(brouillon.dateModification)}`}
          </BandeauInformation>
        </div>
      ) : null}
      {modeÉdition && modeEcriture ? (
        <FormulairePublication
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
                <BoutonEditerBrouillonPublication
                  brouillon={brouillon}
                  commentaire={publication}
                  complementConsigneGenerique={complementConsigneGenerique}
                  consigne={consigne}
                  libelle={libelle}
                  onEnregistrerBrouillon={handleModifierBrouillon}
                  onPublier={handlePublierBrouillon}
                />
              ) : (
                <BoutonNouvellePublication
                  commentaire={publication}
                  complementConsigneGenerique={complementConsigneGenerique}
                  consigne={consigne}
                  libelle={libelle}
                  onEnregistrerBrouillon={handleBrouillon}
                  onPublier={handlePublier}
                  ariaLabel={`bouton-nouveau-commentaire-${type}`}
                />
              ))}
          </div>
        </>
      )}
    </div>
  );
};
