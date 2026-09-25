import "@gouvfr/dsfr/dist/component/notice/notice.min.css";
import { FunctionComponent } from "react";
import BarreDeRecherche from "@/components/_commons/BarreDeRecherche/BarreDeRecherche";
import TableauPagination from "@/components/_commons/TableauNew/Pagination/TableauPagination";
import { useTableauChantiers } from "@/components/PageAccueil/PageChantiers/TableauChantiers/useTableauChantiers";
import { TableauChantiersActionsDeTri } from "@/components/PageAccueil/PageChantiers/TableauChantiers/TableauChantiersActionsDeTri";
import TableauRéformesEnTête from "@/client/components/PageAccueil/TableauRéformes/EnTête/TableauRéformesEnTête";
import { SelecteurGroupementTableauChantier } from "./SelecteurGroupementTableauChantier";
import TableauChantiersProps from "./TableauChantiers.interface";
import TableauChantiersContenu from "./Contenu/TableauChantiersContenu";
import {
  SANS_ESPACEMENT_TEXTE_DSFR,
  Tableau,
} from "@/components/shared/Tableau";
import { clsxm } from "@/utils/clsxm";

const TableauChantiers: FunctionComponent<TableauChantiersProps> = ({
  nombreTotalChantiersAvecAlertes,
  données,
  ministèresDisponibles,
  territoireCode,
  jalon,
  chantiersSontArchives,
}) => {
  const {
    tableau,
    changementDeLaRechercheCallback,
    valeurDeLaRecherche,
    estVueTuile,
  } = useTableauChantiers(
    données,
    ministèresDisponibles,
    nombreTotalChantiersAvecAlertes,
    chantiersSontArchives,
    jalon,
  );

  return (
    <section
      className={clsxm(
        "relative text-dsfr-grey-50",
        SANS_ESPACEMENT_TEXTE_DSFR,
      )}
    >
      <div className="flex flex-col justify-between 2xl:flex-row gap-4 2xl:items-end w-full mb-4">
        <div className="flex flex-col 2xl:flex-row gap-4">
          <div className="w-80">
            <BarreDeRecherche
              changementDeLaRechercheCallback={changementDeLaRechercheCallback}
              valeur={valeurDeLaRecherche}
            />
          </div>
        </div>
        <div className="flex 2xl:flex-row gap-4 items-end">
          <SelecteurGroupementTableauChantier />
          <TableauChantiersActionsDeTri />
        </div>
      </div>
      {tableau.getRowModel().rows.length === 0 ? (
        <div className="fr-notice fr-notice--info">
          <div className="fr-container">
            <div className="fr-notice__body">
              <p className="fr-notice__title">
                Aucun chantier ne correspond à votre recherche !
              </p>
              Vous pouvez modifier vos filtres pour élargir votre recherche.
            </div>
          </div>
        </div>
      ) : (
        <>
          <Tableau>
            <caption className="sr-only">Liste des chantiers</caption>
            {!estVueTuile ? <TableauRéformesEnTête tableau={tableau} /> : null}
            <TableauChantiersContenu
              chantiersSontArchives={chantiersSontArchives}
              jalon={jalon}
              tableau={tableau}
              territoireCode={territoireCode}
            />
          </Tableau>
          <TableauPagination
            initialPageSize={50}
            nombreDePages={tableau.getPageCount()}
            tableau={tableau}
          />
        </>
      )}
    </section>
  );
};

export default TableauChantiers;
