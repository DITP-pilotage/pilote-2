import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Titre from '@/components/_commons/Titre/Titre';
import Bloc from '@/components/_commons/Bloc/Bloc';
import TableauAdminUtilisateurs
  from '@/components/PageAdminUtilisateurs/TableauAdminUtilisateurs/TableauAdminUtilisateurs';
import Alerte from '@/client/components/_commons/Alerte/Alerte';
import AlerteProps from '@/client/components/_commons/Alerte/Alerte.interface';
import AdminUtilisateursBarreLatérale from '@/components/PageAdminUtilisateurs/BarreLatérale/AdminUtilisateursBarreLatérale';
import api from '@/server/infrastructure/api/trpc/api';
import { filtresUtilisateursActifsStore } from '@/client/stores/useFiltresUtilisateursStore/useFiltresUtilisateursStore';
import Loader from '@/client/components/_commons/Loader/Loader';
import '@gouvfr/dsfr/dist/component/select/select.min.css';
import '@gouvfr/dsfr/dist/component/form/form.min.css';

export default function PageAdminUtilisateurs() {
  const [estOuverteBarreLatérale, setEstOuverteBarreLatérale] = useState(false);
  const [alerte, setAlerte] = useState<AlerteProps | null>(null);
  const router = useRouter();
  const filtresActifs = filtresUtilisateursActifsStore();
  
  const { data: utilisateurs, isLoading } = api.utilisateur.récupérerUtilisateursFiltrés.useQuery({
    filtres: filtresActifs,
  });

  useEffect(() => {
    if (router.query['comptecréé']) {
      setAlerte({
        titre: 'Bravo le compte a bien été créé.',
        type: 'succès',
        message: 'Un mail lui a été envoyé pour définir son mot de passe.',
      });
    }
  }, [router]);

  return (
    <div className='flex'>
      <AdminUtilisateursBarreLatérale
        estOuverteBarreLatérale={estOuverteBarreLatérale}
        setEstOuverteBarreLatérale={setEstOuverteBarreLatérale}
      />
      <main>
        <div className='fr-mt-4w fr-mx-4w fr-mb-3w'>
          {
            !!alerte &&
              <div className='fr-my-4w'>
                <Alerte
                  message={alerte.message}
                  titre={alerte.titre}
                  type={alerte.type}
                />
              </div>
          }
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
                <Link
                  className="fr-btn fr-btn--icon-left fr-icon-checkbox-circle-line"
                  href='/admin/utilisateur/creer'
                >
                  Créer un compte
                </Link>
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
