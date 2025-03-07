import { FunctionComponent, useState } from 'react';
import AdminIndicateurBarreLatérale  from '@/components/PageAdminIndicateurs/AdminIndicateurBarreLatérale';
import Titre from '@/components/_commons/Titre/Titre';
import '@gouvfr/dsfr/dist/component/select/select.min.css';
import '@gouvfr/dsfr/dist/component/form/form.min.css';
import TableauAdminIndicateurs from '@/components/PageAdminIndicateurs/TableauAdminIndicateurs/TableauAdminIndicateurs';
import usePageAdminIndicateurs from '@/components/PageAdminIndicateurs/UsePageAdminIndicateurs';
import PageAdminIndicateursStyled from './PageAdminIndicateurs.styled';

const PageAdminIndicateurs: FunctionComponent<{}> = () => {
  const [estOuverteBarreLatérale, setEstOuverteBarreLatérale] = useState(false);
  const { naviguerVersCreationIndicateur  } = usePageAdminIndicateurs();

  return (
    <PageAdminIndicateursStyled>
      <div className='flex'>
        <AdminIndicateurBarreLatérale
          estOuverteBarreLatérale={estOuverteBarreLatérale}
          setEstOuverteBarreLatérale={setEstOuverteBarreLatérale}
        />
        <main className='fr-container--fluid fr-p-2w'>
          <div className='fr-grid-row fr-grid-row--middle fr-grid-row--gutters fr-mb-2w'>
            <div className='fr-col-12 fr-col-md-9'>
              <Titre
                baliseHtml='h1'
                className='fr-h1 fr-mb-0'
              >
                Gestion des paramètres des indicateurs
              </Titre>
            </div>
            <div className='fr-col-12 fr-col-md-3 bouton-creation-indicateur'>
              <button
                aria-controls='créer-nouvel-indicateur'
                className='fr-btn fr-text no-wrap'
                data-fr-opened={false}
                onClick={naviguerVersCreationIndicateur}
                type='button'
              >
                Créer un indicateur
              </button>
            </div>
          </div>
          <div className='fr-p-2w tableau'>
            <TableauAdminIndicateurs />
          </div>
        </main>
      </div>
    </PageAdminIndicateursStyled>
  );
};

export default PageAdminIndicateurs;
