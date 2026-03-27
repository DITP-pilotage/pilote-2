import "@gouvfr/dsfr/dist/component/table/table.min.css";
import "@gouvfr/dsfr/dist/component/notice/notice.min.css";
import { FunctionComponent } from "react";
import useRapportDétailléTableauChantiers from "@/components/PageRapportDétaillé/VueDEnsemble/RapportDétailléTableauChantiers/useRapportDétailléTableauChantiers";
import RapportDétailléTableauChantiersProps from "./RapportDétailléTableauChantiers.interface";
import RapportDétailléTableauChantiersEnTête from "./EnTête/RapportDétailléTableauChantiersEnTête";
import RapportDétailléTableauChantiersContenu from "./Contenu/RapportDétailléTableauChantiersContenu";

const RapportDétailléTableauChantiers: FunctionComponent<
  RapportDétailléTableauChantiersProps
> = ({ données, chantiersSontArchives }) => {
  const { tableau } = useRapportDétailléTableauChantiers(
    données,
    chantiersSontArchives,
  );

  return (
    <section className="fr-table fr-m-0 fr-p-0 overflow-x-auto [&_tbody_a]:no-underline [&_tbody_a]:bg-none">
      {tableau.getRowModel().rows.length === 0 ? (
        <div className="fr-notice fr-notice--info">
          <div className="fr-container">
            <div className="fr-notice__body">
              <p className="fr-notice__title">Aucun chantier à afficher.</p>
            </div>
          </div>
        </div>
      ) : (
        <table className="tableau table">
          <caption className="fr-sr-only">Liste des chantiers</caption>
          <RapportDétailléTableauChantiersEnTête tableau={tableau} />
          <RapportDétailléTableauChantiersContenu tableau={tableau} />
        </table>
      )}
    </section>
  );
};

export default RapportDétailléTableauChantiers;
