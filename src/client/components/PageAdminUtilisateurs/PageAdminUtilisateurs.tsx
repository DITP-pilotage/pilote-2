import { useState } from 'react';
import { useRouter } from 'next/router';
import Titre from '@/components/_commons/Titre/Titre';
import Bloc from '@/components/_commons/Bloc/Bloc';
import TableauAdminUtilisateurs
  from '@/components/PageAdminUtilisateurs/TableauAdminUtilisateurs/TableauAdminUtilisateurs';
import AdminUtilisateursBarreLatérale from '@/components/PageAdminUtilisateurs/BarreLatérale/AdminUtilisateursBarreLatérale';
import api from '@/server/infrastructure/api/trpc/api';
import { filtresUtilisateursActifs } from '@/client/stores/useFiltresUtilisateursStore/useFiltresUtilisateursStore';
import Loader from '@/client/components/_commons/Loader/Loader';

export default function PageAdminUtilisateurs() {
  const [estOuverteBarreLatérale, setEstOuverteBarreLatérale] = useState(false);
  const router = useRouter();
  const filtresActifs = filtresUtilisateursActifs();
  
  const { data: utilisateurs, isLoading } = api.utilisateur.récupérerUtilisateursFiltrés.useQuery({
    filtres: filtresActifs.territoires,
  });

  return (
    <div className='flex'>
      <AdminUtilisateursBarreLatérale
        estOuverteBarreLatérale={estOuverteBarreLatérale}
        setEstOuverteBarreLatérale={setEstOuverteBarreLatérale}
      />
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
              <div className='fr-grid-row fr-grid-row--right'>
                <button
                  className="fr-btn fr-btn--icon-left fr-icon-checkbox-circle-line"
                  onClick={() => router.push('/admin/utilisateur/creer')}
                  type='button'
                >
                  Créer un compte
                </button>
              </div>
            </div>
          </div>
          {
            isLoading  ? <Loader /> :
            <Bloc>
              { !!utilisateurs && <TableauAdminUtilisateurs utilisateurs={utilisateurs} /> }
            </Bloc>
          }
        </div>
      </main>
    </div>
  );
}
