import { DétailsIndicateur } from "@/server/domain/indicateur/DétailsIndicateur.interface";
import Indicateur from "@/server/domain/indicateur/Indicateur.interface";
import { DétailTerritoire } from "@/server/domain/territoire/Territoire.interface";
import { ID_HTML_MODALE_ACCEPTER_PROPOSITION_VALEUR_DAVANCEMENT } from "@/components/_commons/IndicateursChantier/Bloc/IndicateurBloc";
import { ModaleAccepterPropositionValeurAvancement } from "@/components/_commons/IndicateursChantier/Bloc/ModaleAccepterPropositionValeurAvancement/ModaleAccepterPropositionValeurAvancement";

export const BoutonPrendreDecisionProposition = ({
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
      aria-controls={
        ID_HTML_MODALE_ACCEPTER_PROPOSITION_VALEUR_DAVANCEMENT + id
      }
      className="fr-btn fr-btn--icon-left fr-icon-scales-3-fill fr-btn--secondary bouton-proposition-valeur-davancement"
      data-fr-opened="false"
      type="button"
    >
      Prendre une décision
    </button>
    <ModaleAccepterPropositionValeurAvancement
      detailIndicateur={detailIndicateur}
      generatedHTMLID={
        ID_HTML_MODALE_ACCEPTER_PROPOSITION_VALEUR_DAVANCEMENT + id
      }
      indicateur={indicateur}
      territoireCode={territoireCode}
      territoireCodeInsee={détailTerritoireSélectionné.codeInsee}
      territoireNom={détailTerritoireSélectionné.nom}
    />
  </>
);
