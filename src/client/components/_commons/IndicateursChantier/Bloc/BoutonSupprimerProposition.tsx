import { useId } from "react";
import { DétailsIndicateur } from "@/server/domain/indicateur/DétailsIndicateur.interface";
import Indicateur from "@/server/domain/indicateur/Indicateur.interface";
import { ModaleSuppressionValeurAvancementV2 } from "@/components/_commons/IndicateursChantier/Bloc/ModaleSuppressionValeurAvancementV2/ModaleSuppressionValeurAvancementV2";
import { DétailTerritoire } from "@/server/domain/territoire/Territoire.interface";
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
  const modaleId = useId();

  return (
    <>
      <button
        aria-controls={modaleId}
        className="fr-btn gap-2 fr-btn--secondary bouton-proposition-valeur-davancement"
        data-fr-opened="false"
        type="button"
      >
        <Icone className="h-4 w-4 text-current" icone={Delete1Icon} />
        Supprimer la proposition
      </button>
      <ModaleSuppressionValeurAvancementV2
        detailIndicateur={detailIndicateur}
        generatedHTMLID={modaleId}
        indicateur={indicateur}
        territoireCode={territoireCode}
        territoireCodeInsee={détailTerritoireSélectionné.codeInsee}
        territoireNom={détailTerritoireSélectionné.nom}
      />
    </>
  );
};
