import { FunctionComponent, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import Titre from '@/components/_commons/Titre/Titre';
import Bloc from '@/components/_commons/Bloc/Bloc';
import TableauAdminUtilisateurs
  from '@/components/PageAdminUtilisateurs/TableauAdminUtilisateurs/TableauAdminUtilisateurs';
import Alerte from '@/client/components/_commons/Alerte/Alerte';
import AlerteProps from '@/client/components/_commons/Alerte/Alerte.interface';
import AdminUtilisateursBarreLatérale
  from '@/components/PageAdminUtilisateurs/BarreLatérale/AdminUtilisateursBarreLatérale';
import { réinitialiser } from '@/client/stores/useFiltresUtilisateursStore/useFiltresUtilisateursStore';
import '@gouvfr/dsfr/dist/component/select/select.min.css';
import '@gouvfr/dsfr/dist/component/form/form.min.css';
import { ProfilEnum } from '@/server/app/enum/profil.enum';

const PageAdminUtilisateurs: FunctionComponent<{}> = () => {
  const [estOuverteBarreLatérale, setEstOuverteBarreLatérale] = useState(false);
  const [alerte, setAlerte] = useState<AlerteProps | null>(null);
  const router = useRouter();
  const { data: session } = useSession();
  const réinitialiserFiltres = réinitialiser();

  const donneLaRedirection = () => {
    if (!session) {
      return '/';
    }

    return [ProfilEnum.DITP_ADMIN, ProfilEnum.DITP_PILOTAGE].includes(session.profil) ? '/admin/utilisateur/creer' : '/admin/utilisateur/creer/aide';
  };

  useEffect(() => {
    if (router.query['compteCréé']) {
      setAlerte({
        titre: 'Bravo, le compte a bien été créé !',
        type: 'succès',
        message: 'Un mail lui a été envoyé pour définir son mot de passe.',
      });
    }

    if (router.query['compteModifié']) {
      setAlerte({
        titre: 'Bravo, le compte a bien été modifié !',
        type: 'succès',
      });
    }

    if (router.query['compteSupprimé']) {
      setAlerte({
        titre: 'Le compte a bien été supprimé.',
        type: 'erreur',
      });
      window.scroll(0, 0);
    }
  }, [router]);

  useEffect(() => {
    réinitialiserFiltres();
  }, [réinitialiserFiltres]);

  return (
    <div className='flex'>
      <AdminUtilisateursBarreLatérale
        estOuverteBarreLatérale={estOuverteBarreLatérale}
        setEstOuverteBarreLatérale={setEstOuverteBarreLatérale}
      />
      <main>
        <div className='fr-mt-4w fr-mx-4w fr-mb-3w'>
          {
            alerte ? (
              <div className='fr-my-4w'>
                <Alerte
                  message={alerte.message}
                  titre={alerte.titre}
                  type={alerte.type}
                />
              </div>
            ) : null
          }
          <div className='fr-grid-row fr-grid-row--middle fr-mb-3w'>
            <div className='fr-col-12 fr-col-md-9'>
              <Titre
                baliseHtml='h1'
                className='fr-h1 fr-mb-0'
              >
                Gestion des comptes
              </Titre>
            </div>
            <div className='fr-col-12 fr-col-md-3'>
              <div className='fr-grid-row fr-grid-row--right'>
                <Link
                  className='fr-btn fr-btn--icon-left fr-icon-checkbox-circle-line'
                  href={donneLaRedirection()}
                >
                  Créer un compte
                </Link>
              </div>
            </div>
          </div>
          <Bloc>
            <TableauAdminUtilisateurs />
          </Bloc>
        </div>
      </main>
    </div>
  );
};

export default PageAdminUtilisateurs;
