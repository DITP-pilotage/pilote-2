import { useId } from "react";
import { DétailsIndicateur } from "@/server/domain/indicateur/DétailsIndicateur.interface";
import Indicateur from "@/server/domain/indicateur/Indicateur.interface";
import { DétailTerritoire } from "@/server/domain/territoire/Territoire.interface";
import { ModaleAccepterPropositionValeurAvancement } from "@/components/_commons/IndicateursChantier/Bloc/ModaleAccepterPropositionValeurAvancement/ModaleAccepterPropositionValeurAvancement";

export const BoutonPrendreDecisionProposition = ({
  detailIndicateur,
  indicateur,
  territoireCode,
  détailTerritoireSélectionné,
}: {
  detailIndicateur: DétailsIndicateur;
  indicateur: Indicateur;
  territoireCode: string;
  détailTerritoireSélectionné: DétailTerritoire;
}) => {
  const modaleId = useId();

  return (
    <>
      <button
        aria-controls={modaleId}
        className="fr-btn fr-btn--icon-left fr-icon-scales-3-fill fr-btn--secondary bouton-proposition-valeur-davancement"
        data-fr-opened="false"
        type="button"
      >
        Prendre une décision
      </button>
      <ModaleAccepterPropositionValeurAvancement
        detailIndicateur={detailIndicateur}
        generatedHTMLID={modaleId}
        indicateur={indicateur}
        territoireCode={territoireCode}
        territoireCodeInsee={détailTerritoireSélectionné.codeInsee}
        territoireNom={détailTerritoireSélectionné.nom}
      />
    </>
  );
};
