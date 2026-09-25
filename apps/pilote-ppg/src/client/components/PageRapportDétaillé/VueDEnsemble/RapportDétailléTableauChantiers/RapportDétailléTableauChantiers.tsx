import "@gouvfr/dsfr/dist/component/notice/notice.min.css";
import { FunctionComponent } from "react";
import useRapportDétailléTableauChantiers from "@/components/PageRapportDétaillé/VueDEnsemble/RapportDétailléTableauChantiers/useRapportDétailléTableauChantiers";
import RapportDétailléTableauChantiersProps from "./RapportDétailléTableauChantiers.interface";
import RapportDétailléTableauChantiersEnTête from "./EnTête/RapportDétailléTableauChantiersEnTête";
import RapportDétailléTableauChantiersContenu from "./Contenu/RapportDétailléTableauChantiersContenu";
import {
  SANS_ESPACEMENT_TEXTE_DSFR,
  Tableau,
} from "@/components/shared/Tableau";
import { clsxm } from "@/utils/clsxm";

const RapportDétailléTableauChantiers: FunctionComponent<
  RapportDétailléTableauChantiersProps
> = ({ données, chantiersSontArchives }) => {
  const { tableau } = useRapportDétailléTableauChantiers(
    données,
    chantiersSontArchives,
  );

  return (
    <section
      className={clsxm(
        "relative overflow-x-auto [&_tbody_a]:no-underline [&_tbody_a]:bg-none",
        SANS_ESPACEMENT_TEXTE_DSFR,
      )}
    >
      {tableau.getRowModel().rows.length === 0 ? (
        <div className="fr-notice fr-notice--info">
          <div className="fr-container">
            <div className="fr-notice__body">
              <p className="fr-notice__title">Aucun chantier à afficher.</p>
            </div>
          </div>
        </div>
      ) : (
        <Tableau>
          <caption className="sr-only">Liste des chantiers</caption>
          <RapportDétailléTableauChantiersEnTête tableau={tableau} />
          <RapportDétailléTableauChantiersContenu tableau={tableau} />
        </Tableau>
      )}
    </section>
  );
};

export default RapportDétailléTableauChantiers;
