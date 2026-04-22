import { BoutonSousLigné } from "@/components/_commons/BoutonSousLigné/BoutonSousLigné";
import { ModaleHistoriqueIndicateurTerritoireValeurEvenement } from "@/components/_commons/IndicateursChantier/Bloc/ModaleHistoriqueIndicateurTerritoireValeurEvenement/ModaleHistoriqueIndicateurTerritoireValeurEvenement";
import { Icone } from "@/components/_commons/Icone";
import { Time1Icon } from "@/components/_commons/Icones/Time1Icon";
import { useEnv } from "@/client/hooks/useEnv";

export const BoutonVoirHistorique = () => {
  const ffVoirHistoriqueProposition = useEnv(
    "NEXT_PUBLIC_FF_PROPOSITION_VOIR_HISTORIQUE",
  );

  if (!ffVoirHistoriqueProposition) return null;

  return (
    <ModaleHistoriqueIndicateurTerritoireValeurEvenement>
      <BoutonSousLigné
        className="fr-link--xs !text-current !mr-4"
        iconLeft={<Icone className="text-current h-3 w-3" icone={Time1Icon} />}
        type="button"
      >
        Voir l'historique
      </BoutonSousLigné>
    </ModaleHistoriqueIndicateurTerritoireValeurEvenement>
  );
};
