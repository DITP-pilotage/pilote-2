import { ModalePropositionValeurAvancement } from "@/components/_commons/IndicateursChantier/Bloc/ModalePropositionValeurAvancement/ModalePropositionValeurAvancement";
import { Button } from "@/components/shared/Button";
import { Icone } from "@/components/_commons/Icone";
import { Icone1Icon } from "@/components/_commons/Icones/Icone1Icon";

export const BoutonProposerValeur = () => {
  return (
    <ModalePropositionValeurAvancement>
      <Button
        variant="link"
        className="text-xs leading-5 text-dsfr-mention-grey"
        iconLeft={<Icone className="text-current h-3 w-3" icone={Icone1Icon} />}
        type="button"
      >
        Proposer une autre valeur d'avancement
      </Button>
    </ModalePropositionValeurAvancement>
  );
};
