import { ReactNode } from "react";
import { Notice } from "@/components/shared/Notice";
import AlertePublication from "@/components/PageChantier/Publication/AlertePublication";
import { AffichagePublication } from "@/components/PageChantier/Publication/Affichage/AffichagePublication";
import { FormulairePublication } from "@/components/PageChantier/Publication/FormulairePublication";
import { PublicationModalButton } from "@/components/PageChantier/Publication/PublicationModalButton";
import { PiloteDateFormatter } from "@/utils/PiloteDateFormatter";
import {
  PublicationFormConfig,
  Publication,
  PublicationActions,
  PublicationBrouillon,
  PublicationValues,
} from "./Publication.interface";
import { usePublicationSectionEtat } from "./usePublicationSectionEtat";

interface PublicationSectionProps<T extends PublicationValues> {
  libelle: string;
  showLabel?: boolean;
  consigne: string;
  complementConsigneGenerique: string;
  publication: Publication | null;
  brouillon: PublicationBrouillon | null;
  modeEcriture?: boolean;
  actions: PublicationActions<T>;
  formConfig: PublicationFormConfig<T>;
  aside?: ReactNode;
  emptyMessage?: string;
  historiqueNode?: ReactNode;
  type?: string;
}

export const PublicationSection = <T extends PublicationValues>({
  libelle,
  showLabel = true,
  consigne,
  complementConsigneGenerique,
  publication,
  brouillon,
  modeEcriture = false,
  actions,
  formConfig,
  aside,
  emptyMessage,
  historiqueNode,
  type,
}: PublicationSectionProps<T>) => {
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

  const hasDraft = !!brouillon?.dateModification;

  return (
    <div className="px-2 py-4">
      {!modeÉdition && showLabel ? (
        <h5 className="font-bold text-xl mb-1">{libelle}</h5>
      ) : null}
      {brouillon?.dateModification ? (
        <div className="my-2">
          <Notice
            containerClassName="px-4"
            dismissible
            title={`Vous avez enregistré un nouveau commentaire en tant que brouillon le ${PiloteDateFormatter.isoDateFranceMetropolitaine(brouillon.dateModification)}`}
          />
        </div>
      ) : null}
      {modeÉdition && modeEcriture ? (
        <FormulairePublication
          annulationCallback={quitterModeÉdition}
          consigne={consigne}
          formConfig={formConfig}
          libelle={libelle}
          onModifier={handleModifier}
          publication={publication}
        />
      ) : (
        <>
          <AlertePublication action={alerteAction} />
          <AffichagePublication
            aside={aside}
            commentaire={publication}
            emptyMessage={emptyMessage}
            onModifier={modeEcriture ? entrerEnModeÉdition : undefined}
          />
          <div className="flex justify-end items-center gap-4 mt-2">
            {publication ? historiqueNode : null}
            {modeEcriture ? (
              <PublicationModalButton
                aside={aside}
                ariaLabel={
                  type ? `bouton-nouveau-commentaire-${type}` : undefined
                }
                hasDraft={hasDraft}
                commentaire={publication}
                complementConsigneGenerique={complementConsigneGenerique}
                consigne={consigne}
                formConfig={formConfig}
                key={hasDraft ? "brouillon" : "nouveau"}
                libelle={libelle}
                emptyMessage={emptyMessage}
                onEnregistrerBrouillon={
                  hasDraft ? handleModifierBrouillon : handleBrouillon
                }
                onPublier={hasDraft ? handlePublierBrouillon : handlePublier}
              />
            ) : null}
          </div>
        </>
      )}
    </div>
  );
};
