import { DétailsIndicateur } from "@/shared/indicateur/DetailsIndicateur.interface";
import { Button } from "@/components/shared/Button";
import { Indicateur } from "@/shared/indicateur/Indicateur.interface";
import { ModaleSuppressionValeurAvancement } from "@/components/_commons/IndicateursChantier/Bloc/ModaleSuppressionValeurAvancement/ModaleSuppressionValeurAvancement";
import { DétailTerritoire } from "@/shared/territoire/Territoire.interface";
import { Icone } from "@/components/_commons/Icone";
import { Delete1Icon } from "@/components/_commons/Icones/Delete1Icon";

export const BoutonSupprimerProposition = ({
  detailIndicateur,
  indicateur,
  territoireCode,
  détailTerritoireSélectionné,
}: {
  detailIndicateur: DétailsIndicateur;
  indicateur: Indicateur;
  territoireCode: string;
  détailTerritoireSélectionné: DétailTerritoire;
}) => {
  return (
    <ModaleSuppressionValeurAvancement
      detailIndicateur={detailIndicateur}
      indicateur={indicateur}
      territoireCode={territoireCode}
      territoireCodeInsee={détailTerritoireSélectionné.codeInsee}
      territoireNom={détailTerritoireSélectionné.nom}
    >
      <Button
        variant="secondary"
        className="gap-2 text-current ring-current"
        type="button"
      >
        <Icone className="h-4 w-4 text-current" icone={Delete1Icon} />
        Supprimer la proposition
      </Button>
    </ModaleSuppressionValeurAvancement>
  );
};
