import { ModalePropositionValeurAvancementV2 } from "@/components/_commons/IndicateursChantier/Bloc/ModalePropositionValeurAvancementV2/ModalePropositionValeurAvancementV2";
import { Icone1Icon } from "@/components/_commons/Icones/Icone1Icon";
import { Icone } from "@/components/_commons/Icone";

export const BoutonModifierProposition = () => {
  return (
    <ModalePropositionValeurAvancementV2>
      <button
        className="fr-btn gap-2 fr-btn--secondary bouton-proposition-valeur-davancement fr-mr-1w"
        type="button"
      >
        <Icone className="w-4 h-4 text-current" icone={Icone1Icon} />
        Modifier la proposition
      </button>
    </ModalePropositionValeurAvancementV2>
  );
};
