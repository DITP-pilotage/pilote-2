import { ChangeEventHandler, FormEventHandler, useState } from 'react';
import useTableauPageAdminIndicateurs
  from '@/components/PageAdminIndicateurs/TableauAdminIndicateurs/useTableauAdminIndicateurs';
import TableauAdminIndicateursStyled
  from '@/components/PageAdminIndicateurs/TableauAdminIndicateurs/TableauAdminIndicateurs.styled';
import BarreDeRecherche from '@/components/_commons/BarreDeRecherche/BarreDeRecherche';
import Loader from '@/components/_commons/Loader/Loader';
import Titre from '@/components/_commons/Titre/Titre';
import TableauEnTête from '@/components/_commons/Tableau/EnTête/TableauEnTête';
import { MetadataParametrageIndicateurContrat } from '@/server/app/contrats/MetadataParametrageIndicateurContrat';
import TableauAdminIndicateursContenu
  from '@/components/PageAdminIndicateurs/TableauAdminIndicateurs/Contenu/TableauAdminIndicateursContenu';
import TableauPagination from '@/components/_commons/Tableau/Pagination/TableauPagination';
import InputFichier from '@/components/_commons/InputFichier/InputFichier';
import SubmitBouton from '@/components/_commons/SubmitBouton/SubmitBouton';

export function TableauAdminIndicateurs() {
  const {
    tableau,
    estEnChargement,
    changementDePageCallback,
    changementDeLaRechercheCallback,
    valeurDeLaRecherche,
    exporterLesIndicateurs,
  } = useTableauPageAdminIndicateurs();

  const [file, setFile] = useState<File | null>(null);

  const définirLeFichier: ChangeEventHandler<HTMLInputElement> = (event) => {
    if (event.target.files && event.target.files[0]) {
      setFile(event.target.files[0]);
    }
  };

  type UploadFichierFormulaireElement = { 'file-upload': HTMLInputElement } & HTMLFormElement;

  const verifierLeFichier: FormEventHandler<UploadFichierFormulaireElement> = async (event) => {
    event.preventDefault();

    if (!file) {
      return;
    }

    event.currentTarget['file-upload'].value = '';

    const body = new FormData();

    body.append('file', file);

    const result = await fetch('/api/import/metadata-indicateurs', {
      method: 'POST',
      body,
    });
  };



  return (
    <TableauAdminIndicateursStyled>
      <div className='barre-de-recherche fr-mt-2w'>
        <BarreDeRecherche
          changementDeLaRechercheCallback={changementDeLaRechercheCallback}
          valeur={valeurDeLaRecherche}
        />
      </div>
      {
          estEnChargement ? <Loader /> :
          <>
            <div className='flex justify-between'>
              <Titre
                baliseHtml='h2'
                className='fr-h4 fr-mt-3w fr-mb-0 titre-tableau'
              >
                {tableau.getFilteredRowModel().rows.length}
                {' '}
                {tableau.getFilteredRowModel().rows.length > 1 ? 'indicateurs' : 'indicateur'}
              </Titre>
              <form
                className='flex align-center fr-mb-3w'
                onSubmit={verifierLeFichier}
              >
                <InputFichier
                  accept='.csv'
                  onChange={définirLeFichier}
                />
                <SubmitBouton
                  disabled={!file}
                  label='Soumettre'
                />
              </form>
              <div>
                <button
                  className='fr-btn fr-text'
                  disabled={tableau.getFilteredRowModel().rows.length === 0}
                  onClick={exporterLesIndicateurs}
                  type='button'
                >
                  Exporter
                  {' '}
                  {`${tableau.getFilteredRowModel().rows.length === 1 ? "l'indicateur" : `les ${tableau.getFilteredRowModel().rows.length} indicateurs` }`}
                </button>
              </div>
            </div>
            <div className='fr-table'>
              <table className='tableau fr-m-0 fr-p-0'>
                <caption className='fr-sr-only'>
                  Tableau des indicateurs
                </caption>
                <TableauEnTête<MetadataParametrageIndicateurContrat> tableau={tableau} />
                <TableauAdminIndicateursContenu tableau={tableau} />
              </table>
              <TableauPagination
                changementDePageCallback={changementDePageCallback}
                nombreDePages={tableau.getPageCount()}
                numéroDePageInitiale={1}
              />
            </div>
          </>
      }
    </TableauAdminIndicateursStyled>
  );
}
