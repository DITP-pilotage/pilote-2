import Link from 'next/link';
import FilAriane from '@/components/_commons/FilAriane/FilAriane';
import Titre from '@/components/_commons/Titre/Titre';
import Bloc from '@/components/_commons/Bloc/Bloc';
import PageUtilisateurFormulaireStyled from '@/components/PageUtilisateurFormulaire/PageUtilisateurFormulaire.styled';
import PageUtilisateurFormulaireProps from '@/components/PageUtilisateurFormulaire/PageUtilisateurFormulaire.interface';
import UtilisateurFormulaire from '@/components/PageUtilisateurFormulaire/UtilisateurFormulaire/UtilisateurFormulaire';

export default function PageUtilisateurFormulaire({ profils } :PageUtilisateurFormulaireProps) {
  const chemin = [{ nom:'Gestion des comptes', lien:'/admin/utilisateurs' }];

  return (
    <PageUtilisateurFormulaireStyled className='fr-pt-2w' >
      <main className="fr-container">
        <FilAriane
          chemin={chemin}
          libelléPageCourante='Ajouter un compte'
        />
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
          Créer un compte
        </Titre>
        <div className='fr-pb-4w'>
          <Bloc>
            <div className='fr-px-10w fr-py-6w'>
              <UtilisateurFormulaire profils={profils} />
            </div>
          </Bloc>
        </div>
      </main>
    </PageUtilisateurFormulaireStyled>
  );
}
