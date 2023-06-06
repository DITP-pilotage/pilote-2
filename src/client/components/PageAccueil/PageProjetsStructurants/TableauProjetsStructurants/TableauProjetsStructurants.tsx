import { useEffect } from 'react';
import { estVueMobileStore } from '@/client/stores/useEstVueMobileStore/useEstVueMobileStore';
import TableauPagination from '@/components/_commons/Tableau/Pagination/TableauPagination';
import TableauRéformesEnTête from '@/client/components/PageAccueil/TableauRéformes/EnTête/TableauRéformesEnTête';
import BarreDeRecherche from '@/components/_commons/BarreDeRecherche/BarreDeRecherche';
import TableauChantiersActionsDeTri from '@/client/components/PageAccueil/PageChantiers/TableauChantiers/ActionsDeTri/TableauChantiersActionsDeTri';
import TableauProjetsStructurantsProps from './TableauProjetsStructurants.interface';
import useTableauProjetsStructurants from './useTableauProjetsStructurants';
import TableauProjetsStructurantsContenu from './Contenu/TableauProjetsStructurantsContenu';
import TableauProjetsStructurantsStyled from './TableauProjetsStructurants.styled';

export default function TableauProjetsStructurants({ données, setNombreProjetsStructurantsDansLeTableau }: TableauProjetsStructurantsProps) {
  const estVueMobile = estVueMobileStore();

  const {
    tableau,
    changementDeLaRechercheCallback,
    changementDePageCallback,
    valeurDeLaRecherche,
    sélectionColonneÀTrier,
    changementSélectionColonneÀTrierCallback,
    directionDeTri,
    changementDirectionDeTriCallback,
  } = useTableauProjetsStructurants(données);

  useEffect(() => {
    tableau.setPageSize(50);
  }, [tableau]);

  useEffect(() => {
    setNombreProjetsStructurantsDansLeTableau(tableau.getFilteredRowModel().rows.length);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tableau.getFilteredRowModel().rows.length]);

  return (
    <TableauProjetsStructurantsStyled className='fr-table fr-m-0 fr-p-0'>
      <div className='tableau-actions fr-mb-3v'>
        <div className="tableau-actions-gauche fr-py-1w">
          <div className="barre-de-recherche">
            <BarreDeRecherche
              changementDeLaRechercheCallback={changementDeLaRechercheCallback}
              valeur={valeurDeLaRecherche}
            />
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
                  Aucun projet ne correspond à votre recherche !
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
              { !estVueMobile && <TableauRéformesEnTête tableau={tableau} />}
              <TableauProjetsStructurantsContenu tableau={tableau} />
            </table>
            <TableauPagination
              changementDePageCallback={changementDePageCallback}
              nombreDePages={tableau.getPageCount()}
              numéroDePageInitiale={1}
            />
          </>}
    </TableauProjetsStructurantsStyled>
  );
}
