import { ReactNode } from "react";
import BandeauInformation from "@/components/_commons/BandeauInformation/BandeauInformation";
import AlertePublication from "@/components/PageChantier/Publication/AlertePublication";
import { AffichagePublication } from "@/components/PageChantier/Publication/Affichage/AffichagePublication";
import { FormulairePublication } from "@/components/PageChantier/Publication/FormulairePublication";
import { BoutonModalePublication } from "@/components/PageChantier/Publication/BoutonModalePublication";
import { PiloteDateFormatter } from "@/utils/PiloteDateFormatter";
import {
  FormulairePublicationConfiguration,
  Publication,
  PublicationActions,
  PublicationBrouillon,
  ValeursPublication,
} from "./Publication.interface";
import { usePublicationSectionEtat } from "./usePublicationSectionEtat";

interface PublicationSectionProps<T extends ValeursPublication> {
  libelle: string;
  afficherLibelle?: boolean;
  consigne: string;
  complementConsigneGenerique: string;
  publication: Publication | null;
  brouillon: PublicationBrouillon | null;
  modeEcriture?: boolean;
  actions: PublicationActions<T>;
  formulaire: FormulairePublicationConfiguration<T>;
  annexe?: ReactNode;
  messageAbsence?: string;
  historiqueNode?: ReactNode;
  type?: string;
}

export const PublicationSection = <T extends ValeursPublication>({
  libelle,
  afficherLibelle = true,
  consigne,
  complementConsigneGenerique,
  publication,
  brouillon,
  modeEcriture = false,
  actions,
  formulaire,
  annexe,
  messageAbsence,
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

  const avecBrouillon = !!brouillon?.dateModification;

  return (
    <div className="px-2 py-4">
      {!modeÉdition && afficherLibelle ? (
        <h5 className="font-bold text-xl mb-1">{libelle}</h5>
      ) : null}
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
          formulaire={formulaire}
          libelle={libelle}
          onModifier={handleModifier}
          publication={publication}
        />
      ) : (
        <>
          <AlertePublication action={alerteAction} />
          <AffichagePublication
            annexe={annexe}
            commentaire={publication}
            messageAbsence={messageAbsence}
            onModifier={modeEcriture ? entrerEnModeÉdition : undefined}
          />
          <div className="flex justify-end items-center gap-4 mt-2">
            {publication ? historiqueNode : null}
            {modeEcriture ? (
              <BoutonModalePublication
                annexe={annexe}
                ariaLabel={
                  type ? `bouton-nouveau-commentaire-${type}` : undefined
                }
                avecBrouillon={avecBrouillon}
                commentaire={publication}
                complementConsigneGenerique={complementConsigneGenerique}
                consigne={consigne}
                formulaire={formulaire}
                key={avecBrouillon ? "brouillon" : "nouveau"}
                libelle={libelle}
                messageAbsence={messageAbsence}
                onEnregistrerBrouillon={
                  avecBrouillon ? handleModifierBrouillon : handleBrouillon
                }
                onPublier={
                  avecBrouillon ? handlePublierBrouillon : handlePublier
                }
              />
            ) : null}
          </div>
        </>
      )}
    </div>
  );
};
