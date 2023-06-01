import '@gouvfr/dsfr/dist/component/table/table.min.css';
import Link from 'next/link';
import PageUtilisateurProps from '@/components/PageUtilisateur/PageUtilisateur.interface';
import FilAriane from '@/components/_commons/FilAriane/FilAriane';
import PageUtilisateurStyled from '@/components/PageUtilisateur/PageUtilisateur.styled';
import Titre from '@/components/_commons/Titre/Titre';
import Bloc from '@/components/_commons/Bloc/Bloc';
import DétailsDroitsUtilisateur from '@/components/PageUtilisateur/DétailsDroitsUtilisateur/DétailsDroitsUtilisateur';
import TableauUtilisateur from '@/components/PageUtilisateur/TableauUtilisateur/TableauUtilisateur';
import usePageUtilisateur from '@/components/PageUtilisateur/usePageUtilisateur';

export default function PageUtilisateur({ utilisateur, chantiers }:PageUtilisateurProps) {
  const chemin = [{ nom:'Gestion de Profils', lien:'/admin/utilisateurs' }];
  const { listeTerritoiresEnLecture, listeChantiersEnLecture } = usePageUtilisateur(utilisateur, chantiers);
  return (
    <main>
      <PageUtilisateurStyled className='fr-pt-2w fr-pl-15w'>
        <FilAriane
          chemin={chemin}
          libelléPageCourante='Utilisateur'
        />
        <div className='fiche-utilisateur fr-pl-15v fr-pt-1w fr-pb-13w'>
          <Link
            aria-label="Retour à la liste des utilisateurs"
            className="fr-link fr-fi-arrow-left-line fr-link--icon-left fr-text--sm bouton-retour"
            href='/admin/utilisateurs'
          >
            Retour
          </Link>
          <Titre
            baliseHtml='h1'
            className='fr-h1 fr-mt-4w'
          >
            Fiche profil
          </Titre>
          <Bloc>
            <div className='fr-py-4w fr-px-10w'>
              <Titre
                baliseHtml='h2'
                className='fr-h5'
              >
                Utilisateur
              </Titre>
              <TableauUtilisateur utilisateur={utilisateur} />
              <DétailsDroitsUtilisateur
                chantiers={listeChantiersEnLecture}
                territoires={listeTerritoiresEnLecture}
                titre='Droits de visualisation'
              />
              <DétailsDroitsUtilisateur
                chantiers={listeChantiersEnLecture}
                territoires={listeTerritoiresEnLecture}
                titre='Droits de saisie des données quantitatives'
              />
              <DétailsDroitsUtilisateur
                chantiers={listeChantiersEnLecture}
                territoires={listeTerritoiresEnLecture}
                titre='Droits de saisie des commentaires'
              />
            </div>
          </Bloc>
        </div>
      </PageUtilisateurStyled>
    </main>
  );
}
