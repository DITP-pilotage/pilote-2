import { useState } from 'react';
import { useRouter } from 'next/router';
import PageAdminUtilisateursProps from '@/components/PageAdminUtilisateurs/PageAdminUtilisateurs.interface';
import Titre from '@/components/_commons/Titre/Titre';
import BarreLatérale from '@/components/_commons/BarreLatérale/BarreLatérale';
import Bloc from '@/components/_commons/Bloc/Bloc';
import TableauAdminUtilisateurs
  from '@/components/PageAdminUtilisateurs/TableauAdminUtilisateurs/TableauAdminUtilisateurs';

export default function PageAdminUtilisateurs({ utilisateurs } :PageAdminUtilisateursProps ) {
  const [estOuverteBarreLatérale, setEstOuverteBarreLatérale] = useState(false);
  const router = useRouter();

  return (
    <div className='flex'>
      <BarreLatérale
        estOuvert={estOuverteBarreLatérale}
        setEstOuvert={setEstOuverteBarreLatérale}
      >
        Filtres
      </BarreLatérale>
      <main>
        <div className='fr-mt-4w fr-mx-4w fr-mb-3w'>
          <div className="fr-grid-row fr-grid-row--middle fr-mb-3w">
            <div className="fr-col-12 fr-col-md-9">
              <Titre
                baliseHtml="h1"
                className="fr-h1 fr-mb-0"
              >
                Gestion des comptes
              </Titre>
            </div>
            <div className="fr-col-12 fr-col-md-3">
              <button
                className="fr-btn fr-btn--icon-left fr-icon-checkbox-circle-line"
                onClick={() => router.push('/admin/utilisateur/creer')}
                type='button'
              >
                Créer un compte
              </button>
            </div>
          </div>
          <Bloc>
            <TableauAdminUtilisateurs utilisateurs={utilisateurs} />
          </Bloc>
        </div>
      </main>
    </div>
  );
}
