import { useId } from "react";
import BoutonSousLigné from "@/components/_commons/BoutonSousLigné/BoutonSousLigné";
import { ModaleHistoriqueIndicateurTerritoireValeurEvenement } from "@/components/_commons/IndicateursChantier/Bloc/ModaleHistoriqueIndicateurTerritoireValeurEvenement/ModaleHistoriqueIndicateurTerritoireValeurEvenement";
import { useBlocIndicateurContext } from "@/components/PageChantier/useBlocIndicateurContext";

export const BoutonVoirHistorique = () => {
  const modaleId = useId();
  const { configurationFeatureFlipping } = useBlocIndicateurContext();

  if (!configurationFeatureFlipping.voirHistoriqueProposition) return null;

  return (
    <>
      <BoutonSousLigné
        aria-controls={modaleId}
        className="fr-link--xs fr-link--icon-left fr-icon-time-line !text-current fr-mr-2w"
        dataFrOpened={false}
        type="button"
      >
        Voir l'historique
      </BoutonSousLigné>
      <ModaleHistoriqueIndicateurTerritoireValeurEvenement
        generatedHTMLID={modaleId}
      />
    </>
  );
};
