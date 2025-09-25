import { useId } from "react";
import { DétailsIndicateur } from "@/server/domain/indicateur/DétailsIndicateur.interface";
import Indicateur from "@/server/domain/indicateur/Indicateur.interface";
import { DétailTerritoire } from "@/server/domain/territoire/Territoire.interface";
import { ModaleAccepterPropositionValeurAvancement } from "@/components/_commons/IndicateursChantier/Bloc/ModaleAccepterPropositionValeurAvancement/ModaleAccepterPropositionValeurAvancement";
import { Icone } from "@/components/_commons/Icone";
import { Scales3Icon } from "@/components/_commons/Icones/Scales3Icon";

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
        className="fr-btn gap-2 fr-btn--secondary bouton-proposition-valeur-davancement"
        data-fr-opened="false"
        type="button"
      >
        <Icone className="h-4 w-4 text-current" icone={Scales3Icon} />
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
