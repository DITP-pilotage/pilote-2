import { useId } from "react";
import { BoutonSousLigné } from "@/components/_commons/BoutonSousLigné/BoutonSousLigné";
import { ModalePropositionValeurAvancementV2 } from "@/components/_commons/IndicateursChantier/Bloc/ModalePropositionValeurAvancementV2/ModalePropositionValeurAvancementV2";
import { Icone } from "@/components/_commons/Icone";
import { Icone1Icon } from "@/components/_commons/Icones/Icone1Icon";

export const BoutonProposerValeur = () => {
  const idModale = useId();
  return (
    <>
      <BoutonSousLigné
        aria-controls={idModale}
        className="fr-link--xs !text-dsfr-mention-grey"
        dataFrOpened={false}
        iconLeft={<Icone className="text-current h-3 w-3" icone={Icone1Icon} />}
        type="button"
      >
        Proposer une autre valeur d'avancement
      </BoutonSousLigné>

      <ModalePropositionValeurAvancementV2 generatedHTMLID={idModale} />
    </>
  );
};
