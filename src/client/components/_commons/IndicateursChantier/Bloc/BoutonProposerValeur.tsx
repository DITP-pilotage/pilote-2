import { DétailsIndicateur } from "@/server/domain/indicateur/DétailsIndicateur.interface";
import { useBlocIndicateurContext } from "@/components/PageChantier/useBlocIndicateurContext";
import BoutonSousLigné from "@/components/_commons/BoutonSousLigné/BoutonSousLigné";
import { ID_HTML_MODALE_PROPOSITION_VALEUR_DAVANCEMENT } from "@/components/_commons/IndicateursChantier/Bloc/IndicateurBloc";
import { ModalePropositionValeurAvancementV2 } from "@/components/_commons/IndicateursChantier/Bloc/ModalePropositionValeurAvancementV2/ModalePropositionValeurAvancementV2";

export const BoutonProposerValeur = ({
  detailIndicateur,
}: {
  detailIndicateur: DétailsIndicateur;
}) => {
  const { indicateur, territoireCode, territoireSélectionné } =
    useBlocIndicateurContext();
  return (
    <>
      <BoutonSousLigné
        aria-controls={
          ID_HTML_MODALE_PROPOSITION_VALEUR_DAVANCEMENT + indicateur.id
        }
        className="fr-link--xs fr-link--icon-left fr-icon-edit-line texte-gris"
        dataFrOpened={false}
        type="button"
      >
        Proposer une autre valeur d'avancement
      </BoutonSousLigné>

      <ModalePropositionValeurAvancementV2
        detailIndicateur={detailIndicateur}
        generatedHTMLID={
          ID_HTML_MODALE_PROPOSITION_VALEUR_DAVANCEMENT + indicateur.id
        }
        indicateur={indicateur}
        territoireCode={territoireCode}
        territoireCodeInsee={territoireSélectionné.codeInsee}
        territoireNom={territoireSélectionné.nom}
      />
    </>
  );
};
