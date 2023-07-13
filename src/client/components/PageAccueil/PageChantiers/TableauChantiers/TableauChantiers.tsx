import '@gouvfr/dsfr/dist/component/table/table.min.css';
import '@gouvfr/dsfr/dist/component/notice/notice.min.css';
import '@gouvfr/dsfr/dist/utility/icons/icons-map/icons-map.min.css';
import { useEffect } from 'react';
import BarreDeRecherche from '@/components/_commons/BarreDeRecherche/BarreDeRecherche';
import TableauPagination from '@/components/_commons/Tableau/Pagination/TableauPagination';
import useTableauChantiers from '@/components/PageAccueil/PageChantiers/TableauChantiers/useTableauChantiers';
import TableauChantiersActionsDeTri from '@/components/PageAccueil/PageChantiers/TableauChantiers/ActionsDeTri/TableauChantiersActionsDeTri';
import TableauRéformesEnTête from '@/client/components/PageAccueil/TableauRéformes/EnTête/TableauRéformesEnTête';
import TableauChantiersProps from './TableauChantiers.interface';
import TableauChantiersStyled from './TableauChantiers.styled';
import TableauChantiersContenu from './Contenu/TableauChantiersContenu';

export default function TableauChantiers({ données, setNombreChantiersDansLeTableau }: TableauChantiersProps) {
  const {
    tableau,
    changementDeLaRechercheCallback,
    changementDePageCallback,
    valeurDeLaRecherche,
    sélectionColonneÀTrier,
    changementSélectionColonneÀTrierCallback,
    directionDeTri,
    changementDirectionDeTriCallback,
    estVueTuile,
  } = useTableauChantiers(données);
  
  useEffect(() => {
    tableau.setPageSize(50);
  }, [tableau]);

  useEffect(() => {
    if (setNombreChantiersDansLeTableau) {
      setNombreChantiersDansLeTableau(tableau.getFilteredRowModel().rows.length);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tableau.getFilteredRowModel().rows.length]);

  return (
    <TableauChantiersStyled className='fr-table fr-m-0 fr-p-0'>
      <div className='tableau-actions fr-mb-3v'>
        <div className="tableau-actions-gauche">
          <div className="barre-de-recherche">
            <BarreDeRecherche
              changementDeLaRechercheCallback={changementDeLaRechercheCallback}
              valeur={valeurDeLaRecherche}
            />
          </div>
          <div className="fr-toggle">
            <input
              className="fr-toggle__input"
              id="interrupteur-grouper-par-ministères"
              onChange={tableau.getColumn('porteur')?.getToggleGroupingHandler() ?? undefined}
              type="checkbox"
            />
            <label
              className="fr-toggle__label fr-pl-1w"
              htmlFor="interrupteur-grouper-par-ministères"
            >
              Grouper par ministère
            </label>
          </div>
        </div>
        <div className="tableau-actions-droite">
          <TableauChantiersActionsDeTri
            changementColonneÀTrierCallback={changementSélectionColonneÀTrierCallback}
            changementDirectionDeTriCallback={changementDirectionDeTriCallback}
            colonneÀTrier={sélectionColonneÀTrier}
            directionDeTri={directionDeTri}
          />
        </div>
      </div>
      {tableau.getRowModel().rows.length === 0
        ?
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
        :
          <>
            <table className='tableau'>
              <caption className="fr-sr-only">
                Liste des chantiers
              </caption>
              {
                !estVueTuile && <TableauRéformesEnTête tableau={tableau} />
              }
              <TableauChantiersContenu tableau={tableau} />
            </table>
            <TableauPagination
              changementDePageCallback={changementDePageCallback}
              nombreDePages={tableau.getPageCount()}
              numéroDePageInitiale={1}
            />
          </>}
    </TableauChantiersStyled>
  );
}
