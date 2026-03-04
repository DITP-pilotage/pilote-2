import { Fragment } from "react";
import { Modale } from "@/components/shared/Modale";
import MétéoBadge from "@/components/_commons/Meteo/Badge/MétéoBadge";
import { MeteoPicto } from "@/components/_commons/Meteo/Picto/MeteoPicto";
import SynthèseDesRésultatsAffichage from "@/components/PageChantier/SynthèseDesRésultatsChantier/Affichage/Affichage";
import { BoutonSousLigné } from "@/components/_commons/BoutonSousLigné/BoutonSousLigné";
import { Icone } from "@/components/_commons/Icone";
import { Eye1Icon } from "@/components/_commons/Icones/Eye1Icon";
import { useTerritoireSelectionne } from "@/components/PageChantier/PageChantierServerSideContext";
import SynthèseDesRésultatsHistoriqueStyled from "./Historique.styled";
import useHistoriqueDeLaSyntheseDesResultats from "./useHistoriqueDeLaSyntheseDesResultats";

const SynthèseDesRésultatsHistorique = () => {
  const {
    historiqueDeLaSynthèseDesRésultats,
    récupérerHistoriqueSynthèseDesRésultats,
  } = useHistoriqueDeLaSyntheseDesResultats();
  const territoireSélectionné = useTerritoireSelectionne();

  return (
    <Modale
      onOpenChange={(open) => {
        if (open) {
          récupérerHistoriqueSynthèseDesRésultats();
        }
      }}
      sousTitre={territoireSélectionné.nomAffiché}
      title="Historique - Synthèse des résultats"
      trigger={
        <BoutonSousLigné
          className="fr-mt-1w fr-ml-3w"
          iconLeft={
            <Icone className="w-4 h-4 !text-current" icone={Eye1Icon} />
          }
          type="button"
        >
          Voir l'historique
        </BoutonSousLigné>
      }
    >
      <SynthèseDesRésultatsHistoriqueStyled>
        {historiqueDeLaSynthèseDesRésultats ? (
          historiqueDeLaSynthèseDesRésultats.map((synthèse, i) => (
            <Fragment key={synthèse.date_modification}>
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
                    itemHistoriqueSyntheseDesResultats={synthèse}
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
  );
};

export default SynthèseDesRésultatsHistorique;
