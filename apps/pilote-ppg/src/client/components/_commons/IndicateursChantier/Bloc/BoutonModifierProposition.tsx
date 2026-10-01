import { ModalePropositionValeurAvancement } from "@/components/_commons/IndicateursChantier/Bloc/ModalePropositionValeurAvancement/ModalePropositionValeurAvancement";
import { Button } from "@/components/shared/Button";
import { Icone1Icon } from "@/components/_commons/Icones/Icone1Icon";
import { Icone } from "@/components/_commons/Icone";

export const BoutonModifierProposition = () => {
  return (
    <ModalePropositionValeurAvancement>
      <Button
        variant="secondary"
        className="gap-2 text-current ring-current mr-2"
        type="button"
      >
        <Icone className="w-4 h-4 text-current" icone={Icone1Icon} />
        Modifier la proposition
      </Button>
    </ModalePropositionValeurAvancement>
  );
};
