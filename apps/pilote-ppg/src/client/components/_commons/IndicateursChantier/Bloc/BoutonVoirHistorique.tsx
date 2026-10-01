import { ModaleHistoriqueIndicateurTerritoireValeurEvenement } from "@/components/_commons/IndicateursChantier/Bloc/ModaleHistoriqueIndicateurTerritoireValeurEvenement/ModaleHistoriqueIndicateurTerritoireValeurEvenement";
import { Button } from "@/components/shared/Button";
import { Icone } from "@/components/_commons/Icone";
import { Time1Icon } from "@/components/_commons/Icones/Time1Icon";

export const BoutonVoirHistorique = () => {
  return (
    <ModaleHistoriqueIndicateurTerritoireValeurEvenement>
      <Button
        variant="link"
        className="text-xs leading-5 text-current !mr-4"
        iconLeft={<Icone className="text-current h-3 w-3" icone={Time1Icon} />}
        type="button"
      >
        Voir l'historique
      </Button>
    </ModaleHistoriqueIndicateurTerritoireValeurEvenement>
  );
};
