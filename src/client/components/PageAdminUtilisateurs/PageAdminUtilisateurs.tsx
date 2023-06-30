import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import PageAdminUtilisateursProps from '@/components/PageAdminUtilisateurs/PageAdminUtilisateurs.interface';
import Titre from '@/components/_commons/Titre/Titre';
import BarreLatérale from '@/components/_commons/BarreLatérale/BarreLatérale';
import Bloc from '@/components/_commons/Bloc/Bloc';
import TableauAdminUtilisateurs
  from '@/components/PageAdminUtilisateurs/TableauAdminUtilisateurs/TableauAdminUtilisateurs';
import Alerte from '@/client/components/_commons/Alerte/Alerte';
import AlerteProps from '@/client/components/_commons/Alerte/Alerte.interface';

export default function PageAdminUtilisateurs({ utilisateurs } :PageAdminUtilisateursProps ) {
  const [estOuverteBarreLatérale, setEstOuverteBarreLatérale] = useState(false);
  const [alerte, setAlerte] = useState<AlerteProps | null>(null);
  const router = useRouter();

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
      <BarreLatérale
        estOuvert={estOuverteBarreLatérale}
        setEstOuvert={setEstOuverteBarreLatérale}
      >
        Filtres
      </BarreLatérale>
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
          <Bloc>
            <TableauAdminUtilisateurs utilisateurs={utilisateurs} />
          </Bloc>
        </div>
      </main>
    </div>
  );
}
