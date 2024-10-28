import '@gouvfr/dsfr/dist/component/table/table.min.css';
import '@gouvfr/dsfr/dist/component/notice/notice.min.css';
import '@gouvfr/dsfr/dist/utility/icons/icons-map/icons-map.min.css';
import { parseAsBoolean, useQueryState } from 'nuqs';
import { FunctionComponent } from 'react';
import BarreDeRecherche from '@/components/_commons/BarreDeRecherche/BarreDeRecherche';
import TableauPagination from '@/components/_commons/TableauNew/Pagination/TableauPagination';
import { useTableauChantiers } from '@/components/PageAccueil/PageChantiers/TableauChantiers/useTableauChantiers';
import { TableauChantiersActionsDeTri }
  from '@/components/PageAccueil/PageChantiers/TableauChantiers/ActionsDeTriNew/TableauChantiersActionsDeTri';
import TableauRéformesEnTête from '@/client/components/PageAccueil/TableauRéformes/EnTête/TableauRéformesEnTête';
import Interrupteur from '@/components/_commons/Interrupteur/Interrupteur';
import { sauvegarderFiltres } from '@/stores/useFiltresStoreNew/useFiltresStoreNew';
import TableauChantiersProps from './TableauChantiers.interface';
import TableauChantiersStyled from './TableauChantiers.styled';
import TableauChantiersContenu from './Contenu/TableauChantiersContenu';

const TableauChantiers: FunctionComponent<TableauChantiersProps> = ({
  nombreTotalChantiersAvecAlertes,
  données,
  ministèresDisponibles,
  territoireCode,
  mailleSelectionnee,
}) => {

  const {
    tableau,
    changementDeLaRechercheCallback,
    valeurDeLaRecherche,
    estVueTuile,
  } = useTableauChantiers(données, ministèresDisponibles, nombreTotalChantiersAvecAlertes);

  const [estGroupe, setEstGroupe] = useQueryState('groupeParMinistere', parseAsBoolean.withDefault(false).withOptions({
    clearOnDefault: true,
  }));

  return (
    <TableauChantiersStyled className='fr-table fr-m-0 fr-p-0'>
      <div className='tableau-actions fr-mb-3v'>
        <div className='tableau-actions-gauche'>
          <div className='barre-de-recherche'>
            <BarreDeRecherche
              changementDeLaRechercheCallback={changementDeLaRechercheCallback}
              valeur={valeurDeLaRecherche}
            />
          </div>
          <Interrupteur
            auChangement={async () => {
              sauvegarderFiltres({ groupeParMinistere: !estGroupe });
              await setEstGroupe(!estGroupe);
              return tableau.getColumn('porteur')?.getToggleGroupingHandler()() ?? undefined;
            }}
            checked={estGroupe}
            id='interrupteur-grouper-par-ministères'
            libellé='Grouper par ministère'
          />
        </div>
        <div className='tableau-actions-droite'>
          <TableauChantiersActionsDeTri />
        </div>
      </div>
      {tableau.getRowModel().rows.length === 0
        ?
          <div className='fr-notice fr-notice--info'>
            <div className='fr-container'>
              <div className='fr-notice__body'>
                <p className='fr-notice__title'>
                  Aucun chantier ne correspond à votre recherche !
                </p>
                Vous pouvez modifier vos filtres pour élargir votre recherche.
              </div>
            </div>
          </div>
        :
          <>
            <table className='tableau'>
              <caption className='fr-sr-only'>
                Liste des chantiers
              </caption>
              {
              !estVueTuile ? (
                <TableauRéformesEnTête tableau={tableau} />
              ) : null
            }
              <TableauChantiersContenu
                mailleSelectionnee={mailleSelectionnee}
                tableau={tableau}
                territoireCode={territoireCode}
              />
            </table>
            <TableauPagination
              initialPageSize={50}
              nombreDePages={tableau.getPageCount()}
              tableau={tableau}
            />
          </>}
    </TableauChantiersStyled>
  );
};

export default TableauChantiers;
