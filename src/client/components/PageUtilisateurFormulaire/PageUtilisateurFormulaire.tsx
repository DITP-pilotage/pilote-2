
import PageUtilisateurFormulaireStyled from '@/components/PageUtilisateurFormulaire/PageUtilisateurFormulaire.styled';
import PageUtilisateurFormulaireProps from '@/components/PageUtilisateurFormulaire/PageUtilisateurFormulaire.interface';
import UtilisateurFormulaire from '@/components/PageUtilisateurFormulaire/UtilisateurFormulaire/UtilisateurFormulaire';
import FilAriane from '@/client/components/_commons/FilAriane/FilAriane';

export default function PageUtilisateurFormulaire({ profils } :PageUtilisateurFormulaireProps) {
  const chemin = [{ nom:'Gestion des comptes', lien:'/admin/utilisateurs' }];

  return (
    <PageUtilisateurFormulaireStyled className='fr-pt-2w' >
      <main className="fr-container">
        <FilAriane
          chemin={chemin}
          libelléPageCourante='Ajouter un compte'
        />
        <div className='fr-pb-4w'>
          <UtilisateurFormulaire profils={profils} />
        </div>
      </main>
    </PageUtilisateurFormulaireStyled>
  );
}
