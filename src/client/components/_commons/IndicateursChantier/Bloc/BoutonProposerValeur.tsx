import { useId } from "react";
import BoutonSousLigné from "@/components/_commons/BoutonSousLigné/BoutonSousLigné";
import { ModalePropositionValeurAvancementV2 } from "@/components/_commons/IndicateursChantier/Bloc/ModalePropositionValeurAvancementV2/ModalePropositionValeurAvancementV2";

export const BoutonProposerValeur = () => {
  const idModale = useId();
  return (
    <>
      <BoutonSousLigné
        aria-controls={idModale}
        className="fr-link--xs fr-link--icon-left fr-icon-edit-line !text-dsfr-mention-grey"
        dataFrOpened={false}
        type="button"
      >
        Proposer une autre valeur d'avancement
      </BoutonSousLigné>

      <ModalePropositionValeurAvancementV2 generatedHTMLID={idModale} />
    </>
  );
};
