import { Fragment } from "react";
import Modale from "@/components/_commons/Modale/Modale";
import MétéoBadge from "@/components/_commons/Meteo/Badge/MétéoBadge";
import MeteoPicto from "@/components/_commons/Meteo/Picto/MeteoPicto";
import SynthèseDesRésultatsAffichage from "@/components/PageChantier/SynthèseDesRésultatsChantier/Affichage/Affichage";
import BoutonSousLigné from "@/components/_commons/BoutonSousLigné/BoutonSousLigné";
import { useTerritoireSelectionne } from "@/components/PageChantier/PageChantierServerSideContext";
import SynthèseDesRésultatsHistoriqueStyled from "./Historique.styled";
import useHistoriqueDeLaSyntheseDesResultats from "./useHistoriqueDeLaSyntheseDesResultats";

const ID_HTML = "historique-synthèse-des-résultats";

const SynthèseDesRésultatsHistorique = () => {
  const {
    historiqueDeLaSynthèseDesRésultats,
    récupérerHistoriqueSynthèseDesRésultats,
  } = useHistoriqueDeLaSyntheseDesResultats();
  const territoireSélectionné = useTerritoireSelectionne();

  return (
    <>
      <BoutonSousLigné
        aria-controls={ID_HTML}
        className="fr-mt-1w fr-ml-3w"
        dataFrOpened={false}
        type="button"
      >
        Voir l'historique
      </BoutonSousLigné>
      <Modale
        idHtml={ID_HTML}
        ouvertureCallback={récupérerHistoriqueSynthèseDesRésultats}
        sousTitre={territoireSélectionné.nomAffiché}
        titre="Historique - Synthèse des résultats"
      >
        <SynthèseDesRésultatsHistoriqueStyled>
          {historiqueDeLaSynthèseDesRésultats ? (
            historiqueDeLaSynthèseDesRésultats.map((synthèse, i) => (
              <Fragment key={synthèse?.date ?? "MANQUANT"}>
                {i !== 0 && <hr className="fr-mt-4w" />}
                <div className="conteneur">
                  <div className="conteneur-météo fr-mb-3w fr-mb-md-0">
                    <div className="fr-mb-2w">
                      <MétéoBadge météo={synthèse?.météo ?? "NON_RENSEIGNEE"} />
                    </div>
                    {!!synthèse && (
                      <div>
                        <MeteoPicto meteo={synthèse.météo} />
                      </div>
                    )}
                  </div>
                  <div className="fr-pl-md-3w">
                    <SynthèseDesRésultatsAffichage
                      synthèseDesRésultats={synthèse}
                    />
                  </div>
                </div>
              </Fragment>
            ))
          ) : (
            <p>Chargement de l'historique...</p>
          )}
        </SynthèseDesRésultatsHistoriqueStyled>
      </Modale>
    </>
  );
};

export default SynthèseDesRésultatsHistorique;
