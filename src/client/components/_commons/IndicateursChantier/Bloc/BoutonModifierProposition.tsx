import { useId } from "react";
import { ModalePropositionValeurAvancementV2 } from "@/components/_commons/IndicateursChantier/Bloc/ModalePropositionValeurAvancementV2/ModalePropositionValeurAvancementV2";

export const BoutonModifierProposition = () => {
  const idModifierProposition = useId();

  return (
    <>
      <button
        aria-controls={idModifierProposition}
        className="fr-btn fr-btn--icon-left fr-icon-edit-fill fr-btn--secondary bouton-proposition-valeur-davancement fr-mr-1w"
        data-fr-opened="false"
        type="button"
      >
        Modifier la proposition
      </button>
      <ModalePropositionValeurAvancementV2
        generatedHTMLID={idModifierProposition}
      />
    </>
  );
};
