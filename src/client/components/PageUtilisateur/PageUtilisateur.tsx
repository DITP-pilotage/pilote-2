import '@gouvfr/dsfr/dist/component/table/table.min.css';
import Link from 'next/link';
import PageUtilisateurProps from '@/components/PageUtilisateur/PageUtilisateur.interface';
import FilAriane from '@/components/_commons/FilAriane/FilAriane';
import PageUtilisateurStyled from '@/components/PageUtilisateur/PageUtilisateur.styled';
import Titre from '@/components/_commons/Titre/Titre';
import Bloc from '@/components/_commons/Bloc/Bloc';
import FicheUtilisateur from '@/components/PageUtilisateur/FicheUtilisateur';

export default function PageUtilisateur({ utilisateur, chantiers }:PageUtilisateurProps) {
  const chemin = [{ nom:'Gestion des comptes', lien:'/admin/utilisateurs' }];

  return (
    <PageUtilisateurStyled className='fr-pt-2w'>
      <main className='fr-container'>
        <FilAriane
          chemin={chemin}
          libelléPageCourante='Utilisateur'
        />
        <div className='fiche-utilisateur fr-pt-1w fr-pb-13w'>
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
            Fiche du compte
          </Titre>
          <Bloc>
            <div className='fr-py-4w fr-px-10w'>
              <FicheUtilisateur
                chantiers={chantiers}
                utilisateur={utilisateur}
              />
            </div>
          </Bloc>
        </div>
      </main>
    </PageUtilisateurStyled>
  );
}
