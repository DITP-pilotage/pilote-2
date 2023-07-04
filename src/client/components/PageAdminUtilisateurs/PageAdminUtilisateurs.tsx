import { useState } from 'react';
import { useRouter } from 'next/router';
import PageAdminUtilisateursProps from '@/components/PageAdminUtilisateurs/PageAdminUtilisateurs.interface';
import Titre from '@/components/_commons/Titre/Titre';
import Bloc from '@/components/_commons/Bloc/Bloc';
import TableauAdminUtilisateurs
  from '@/components/PageAdminUtilisateurs/TableauAdminUtilisateurs/TableauAdminUtilisateurs';
import AdminUtilisateursBarreLatérale from '@/components/PageAdminUtilisateurs/BarreLatérale/AdminUtilisateursBarreLatérale';
import Utilisateur from '@/server/domain/utilisateur/Utilisateur.interface';
import { filtresUtilisateursActifs } from '@/stores/useFiltresUtilisateursStore/useFiltresUtilisateursStore';



function usePageAdminUtilisateurs(utilisateurs: Utilisateur[]) {
  const filtresActifs = filtresUtilisateursActifs();
  function passeLesFiltres(utilisateur: Utilisateur) {
    if (filtresActifs.territoires.length === 0) {
      return true;
    }
    return utilisateur.habilitations.lecture.territoires.some((territoire) => filtresActifs.territoires.includes(territoire));
  }

  return {
    utilisateursFiltrés: utilisateurs.filter(passeLesFiltres),
  };
}

export default function PageAdminUtilisateurs({ utilisateurs } :PageAdminUtilisateursProps ) {
  const [estOuverteBarreLatérale, setEstOuverteBarreLatérale] = useState(false);
  const router = useRouter();
  const { utilisateursFiltrés } = usePageAdminUtilisateurs(utilisateurs);

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
          <Bloc>
            <TableauAdminUtilisateurs utilisateurs={utilisateursFiltrés} />
          </Bloc>
        </div>
      </main>
    </div>
  );
}
