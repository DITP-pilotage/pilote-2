import { DétailsIndicateur } from "@/server/domain/indicateur/DétailsIndicateur.interface";
import Indicateur from "@/server/domain/indicateur/Indicateur.interface";
import { ID_HTML_MODALE_SUPPRESSION_VALEUR_DAVANCEMENT } from "@/components/_commons/IndicateursChantier/Bloc/IndicateurBloc";
import { ModaleSuppressionValeurAvancementV2 } from "@/components/_commons/IndicateursChantier/Bloc/ModaleSuppressionValeurAvancementV2/ModaleSuppressionValeurAvancementV2";
import { DétailTerritoire } from "@/server/domain/territoire/Territoire.interface";

export const BoutonSupprimerProposition = ({
  id,
  detailIndicateur,
  indicateur,
  territoireCode,
  détailTerritoireSélectionné,
}: {
  id: string;
  detailIndicateur: DétailsIndicateur;
  indicateur: Indicateur;
  territoireCode: string;
  détailTerritoireSélectionné: DétailTerritoire;
}) => (
  <>
    <button
      aria-controls={ID_HTML_MODALE_SUPPRESSION_VALEUR_DAVANCEMENT + id}
      className="fr-btn fr-btn--icon-left fr-icon-delete-line fr-btn--secondary bouton-proposition-valeur-davancement"
      data-fr-opened="false"
      type="button"
    >
      Supprimer la proposition
    </button>
    <ModaleSuppressionValeurAvancementV2
      detailIndicateur={detailIndicateur}
      generatedHTMLID={ID_HTML_MODALE_SUPPRESSION_VALEUR_DAVANCEMENT + id}
      indicateur={indicateur}
      territoireCode={territoireCode}
      territoireCodeInsee={détailTerritoireSélectionné.codeInsee}
      territoireNom={détailTerritoireSélectionné.nom}
    />
  </>
);
