import { ModalePropositionValeurAvancement } from "@/components/_commons/IndicateursChantier/Bloc/ModalePropositionValeurAvancement/ModalePropositionValeurAvancement";
import { Icone1Icon } from "@/components/_commons/Icones/Icone1Icon";
import { Icone } from "@/components/_commons/Icone";

export const BoutonModifierProposition = () => {
  return (
    <ModalePropositionValeurAvancement>
      <button
        className="fr-btn gap-2 fr-btn--secondary !text-current ![box-shadow:inset_0_0_0_1px_currentColor] fr-mr-1w"
        type="button"
      >
        <Icone className="w-4 h-4 text-current" icone={Icone1Icon} />
        Modifier la proposition
      </button>
    </ModalePropositionValeurAvancement>
  );
};
