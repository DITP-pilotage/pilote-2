import BoutonSousLigné from "@/components/_commons/BoutonSousLigné/BoutonSousLigné";
import { ModaleHistoriqueIndicateurTerritoireValeurEvenement } from "@/components/_commons/IndicateursChantier/Bloc/ModaleHistoriqueIndicateurTerritoireValeurEvenement/ModaleHistoriqueIndicateurTerritoireValeurEvenement";
import { ID_HTML_MODALE_HISTORIQUE_INDICATEUR_TERRITOIRE_VALEUR_EVENEMENT } from "@/components/_commons/IndicateursChantier/Bloc/IndicateurPropositionValeur";
import { usePageChantierContext } from "@/components/PageChantier/usePageChantierContext";

export const BoutonVoirHistorique = () => {
  const { indicateur } = usePageChantierContext();
  return (
    <>
      <BoutonSousLigné
        aria-controls={
          ID_HTML_MODALE_HISTORIQUE_INDICATEUR_TERRITOIRE_VALEUR_EVENEMENT +
          indicateur.id
        }
        className="fr-link--xs fr-link--icon-left fr-icon-time-line !text-current fr-mr-2w"
        dataFrOpened={false}
        type="button"
      >
        Voir l'historique
      </BoutonSousLigné>
      <ModaleHistoriqueIndicateurTerritoireValeurEvenement
        generatedHTMLID={
          ID_HTML_MODALE_HISTORIQUE_INDICATEUR_TERRITOIRE_VALEUR_EVENEMENT +
          indicateur.id
        }
      />
    </>
  );
};
