import { useState } from 'react';
import { AdminIndicateurBarreLatérale } from '@/components/PageAdminIndicateurs/AdminIndicateurBarreLatérale';
import Titre from '@/components/_commons/Titre/Titre';
import '@gouvfr/dsfr/dist/component/select/select.min.css';
import '@gouvfr/dsfr/dist/component/form/form.min.css';
import Bloc from '@/components/_commons/Bloc/Bloc';
import {
  TableauAdminIndicateurs,
} from '@/components/PageAdminIndicateurs/TableauAdminIndicateurs/TableauAdminIndicateurs';
import usePageAdminIndicateurs from '@/components/PageAdminIndicateurs/UsePageAdminIndicateurs';

function PageAdminIndicateurs() {
  const [estOuverteBarreLatérale, setEstOuverteBarreLatérale] = useState(false);
  const { naviguerVersCreationIndicateur  } = usePageAdminIndicateurs();

  return (
    <div className='flex'>
      <AdminIndicateurBarreLatérale
        estOuverteBarreLatérale={estOuverteBarreLatérale}
        setEstOuverteBarreLatérale={setEstOuverteBarreLatérale}
      />
      <main>
        <div className='fr-mt-4w fr-mx-4w fr-mb-3w'>
          <div className="fr-grid-row fr-grid-row--middle fr-mb-3w">
            <div className="flex justify-between w-full">
              <Titre
                baliseHtml="h1"
                className="fr-h1 fr-mb-0"
              >
                Gestion des paramètres des indicateurs
              </Titre>
              <button
                aria-controls='créer-nouvel-indicateur'
                className='fr-btn fr-text'
                data-fr-opened={false}
                onClick={naviguerVersCreationIndicateur}
                type="button"
              >
                Créer un nouvel indicateur
              </button>
            </div>
          </div>
          <Bloc>
            <TableauAdminIndicateurs />
          </Bloc>
        </div>
      </main>
    </div>
  );
}

export default PageAdminIndicateurs;
