import { parseAsBoolean, parseAsStringLiteral, useQueryState } from "nuqs";
import { FunctionComponent } from "react";
import Bloc from "@/components/_commons/Bloc/Bloc";
import SyntheseDesResultatsStyled from "@/components/PageChantier/SynthèseDesRésultatsChantier/SyntheseDesResultats.styled";
import MeteoPicto from "@/components/_commons/Meteo/Picto/MeteoPicto";
import MétéoBadge from "@/components/_commons/Meteo/Badge/MétéoBadge";
import SynthèseDesRésultatsHistorique from "@/components/PageChantier/SynthèseDesRésultatsChantier/Historique/Historique";
import { useSyntheseDesResultats } from "@/components/PageChantier/SynthèseDesRésultatsChantier/useSyntheseDesResultats";
import Alerte from "@/components/_commons/Alerte/Alerte";
import SynthèseDesRésultatsAffichage from "@/components/PageChantier/SynthèseDesRésultatsChantier/Affichage/Affichage";
import { pageChantier } from "@/components/PageChantier/PageChantierServerSideContext";
import SyntheseDesResultatsFormulaire from "@/components/PageChantier/SynthèseDesRésultatsChantier/SyntheseDesResultatsFormulaire/SyntheseDesResultatsFormulaire";

export interface SyntheseDesResultatsProps {
  nomTerritoire: string;
  modeEcriture?: boolean;
  estInteractif?: boolean;
}

const SyntheseDesResultats: FunctionComponent<SyntheseDesResultatsProps> = ({
  nomTerritoire,
  modeEcriture = false,
  estInteractif = true,
}) => {
  const { synthèseDesRésultats, chantier } =
    pageChantier.useServerSidePropsContext();

  const [action] = useQueryState(
    "_action",
    parseAsStringLiteral(["creation-reussie", ""]),
  );
  const [modeÉdition, setModeÉdition] = useQueryState(
    "edition",
    parseAsBoolean.withDefault(false).withOptions({
      history: "push",
      shallow: false,
      clearOnDefault: true,
    }),
  );

  const { synthèseDesRésultatsCréée } = useSyntheseDesResultats();

  return (
    <SyntheseDesResultatsStyled>
      <Bloc
        backgroundClassNameTitre={
          chantier.statut === "ARCHIVE"
            ? "bg-dsfr-grey-925"
            : "bg-dsfr-blue-france-925"
        }
        className="h-full"
        titre={nomTerritoire}
      >
        <div className="fr-py-1w">
          {modeÉdition && modeEcriture ? (
            <SyntheseDesResultatsFormulaire
              annulationCallback={() => setModeÉdition(false)}
              syntheseDesResultatsCreeeCallback={synthèseDesRésultatsCréée}
            />
          ) : (
            <>
              {action === "creation-reussie" && (
                <div className="fr-mb-2w">
                  <Alerte
                    titre="Météo et synthèse des résultats publiées"
                    type="succès"
                  />
                </div>
              )}
              <div className="contenu">
                <div className="fr-mx-1w fr-mb-2w fr-mb-md-0 météo-affichage">
                  <div className="fr-mb-2w">
                    <MétéoBadge
                      météo={synthèseDesRésultats?.météo ?? "NON_RENSEIGNEE"}
                    />
                  </div>
                  {!!synthèseDesRésultats && (
                    <div>
                      <MeteoPicto meteo={synthèseDesRésultats.météo} />
                    </div>
                  )}
                </div>
                <div className="synthèse-affichage">
                  <SynthèseDesRésultatsAffichage />
                </div>
              </div>
              {estInteractif ? (
                <div className="fr-grid-row fr-grid-row--right">
                  <div className="fr-col-12 actions fr-mt-1w">
                    {!!synthèseDesRésultats ? (
                      <SynthèseDesRésultatsHistorique />
                    ) : null}
                    {modeEcriture ? (
                      <button
                        className="fr-btn fr-btn--secondary fr-ml-3w bouton-modifier"
                        onClick={() => setModeÉdition(true)}
                        type="button"
                      >
                        <span
                          aria-hidden="true"
                          className="fr-icon-edit-line fr-mr-1w"
                        />
                        {}
                        Modifier
                      </button>
                    ) : null}
                  </div>
                </div>
              ) : null}
            </>
          )}
        </div>
      </Bloc>
    </SyntheseDesResultatsStyled>
  );
};

export default SyntheseDesResultats;
