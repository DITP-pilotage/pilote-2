import { DétailsIndicateur } from "@/server/domain/indicateur/DétailsIndicateur.interface";
import Indicateur from "@/server/domain/indicateur/Indicateur.interface";
import { DétailTerritoire } from "@/server/domain/territoire/Territoire.interface";
import { ID_HTML_MODALE_PROPOSITION_VALEUR_DAVANCEMENT } from "@/components/_commons/IndicateursChantier/Bloc/IndicateurBloc";
import { ModalePropositionValeurAvancementV2 } from "@/components/_commons/IndicateursChantier/Bloc/ModalePropositionValeurAvancementV2/ModalePropositionValeurAvancementV2";

export const BoutonModifierProposition = ({
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
      aria-controls={ID_HTML_MODALE_PROPOSITION_VALEUR_DAVANCEMENT + id}
      className="fr-btn fr-btn--icon-left fr-icon-edit-fill fr-btn--secondary bouton-proposition-valeur-davancement fr-mr-1w"
      data-fr-opened="false"
      type="button"
    >
      Modifier la proposition
    </button>
    <ModalePropositionValeurAvancementV2
      detailIndicateur={detailIndicateur}
      generatedHTMLID={ID_HTML_MODALE_PROPOSITION_VALEUR_DAVANCEMENT + id}
      indicateur={indicateur}
      territoireCode={territoireCode}
      territoireCodeInsee={détailTerritoireSélectionné.codeInsee}
      territoireNom={détailTerritoireSélectionné.nom}
    />
  </>
);
