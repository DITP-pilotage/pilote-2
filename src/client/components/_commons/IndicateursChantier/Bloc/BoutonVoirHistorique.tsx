import Chantier from "@/server/domain/chantier/Chantier.interface";
import Indicateur from "@/server/domain/indicateur/Indicateur.interface";
import { DétailTerritoire } from "@/server/domain/territoire/Territoire.interface";
import BoutonSousLigné from "@/components/_commons/BoutonSousLigné/BoutonSousLigné";
import { ModaleHistoriqueIndicateurTerritoireValeurEvenement } from "@/components/_commons/IndicateursChantier/Bloc/ModaleHistoriqueIndicateurTerritoireValeurEvenement/ModaleHistoriqueIndicateurTerritoireValeurEvenement";
import { ID_HTML_MODALE_HISTORIQUE_INDICATEUR_TERRITOIRE_VALEUR_EVENEMENT } from "@/components/_commons/IndicateursChantier/Bloc/IndicateurPropositionValeur";

export const BoutonVoirHistorique = ({
  chantier,
  id,
  indicateur,
  territoireCode,
  territoireSélectionné,
}: {
  id: string;
  chantier: Chantier;
  indicateur: Indicateur;
  territoireCode: string;
  territoireSélectionné: DétailTerritoire;
}) => (
  <>
    <BoutonSousLigné
      aria-controls={
        ID_HTML_MODALE_HISTORIQUE_INDICATEUR_TERRITOIRE_VALEUR_EVENEMENT + id
      }
      className="fr-link--xs fr-link--icon-left fr-icon-time-line !text-current fr-mr-2w"
      dataFrOpened={false}
      type="button"
    >
      Voir l'historique
    </BoutonSousLigné>
    <ModaleHistoriqueIndicateurTerritoireValeurEvenement
      chantier={chantier}
      generatedHTMLID={
        ID_HTML_MODALE_HISTORIQUE_INDICATEUR_TERRITOIRE_VALEUR_EVENEMENT + id
      }
      indicateur={indicateur}
      territoireCode={territoireCode}
      territoireCodeInsee={territoireSélectionné?.codeInsee || ""}
      territoireNom={territoireSélectionné?.nom || ""}
    />
  </>
);
