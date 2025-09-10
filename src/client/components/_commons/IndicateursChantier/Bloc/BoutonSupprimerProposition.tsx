import { useId } from "react";
import { DétailsIndicateur } from "@/server/domain/indicateur/DétailsIndicateur.interface";
import Indicateur from "@/server/domain/indicateur/Indicateur.interface";
import { ModaleSuppressionValeurAvancementV2 } from "@/components/_commons/IndicateursChantier/Bloc/ModaleSuppressionValeurAvancementV2/ModaleSuppressionValeurAvancementV2";
import { DétailTerritoire } from "@/server/domain/territoire/Territoire.interface";

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
        className="fr-btn fr-btn--icon-left fr-icon-delete-line fr-btn--secondary bouton-proposition-valeur-davancement"
        data-fr-opened="false"
        type="button"
      >
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
