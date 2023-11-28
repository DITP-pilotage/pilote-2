
import UtilisateurFormulaire from '@/components/PageUtilisateurFormulaire/UtilisateurFormulaire/UtilisateurFormulaire';
import FilAriane from '@/client/components/_commons/FilAriane/FilAriane';
import PageCréerUtilisateurStyled from './PageCréerUtilisateur.styled';

export default function PageCréerUtilisateur() {
  const chemin = [{ nom:'Gestion des comptes', lien:'/admin/utilisateurs' }];

  return (
    <PageCréerUtilisateurStyled className='fr-pt-2w' >
      <main className='fr-container'>
        <FilAriane
          chemin={chemin}
          libelléPageCourante='Ajouter un compte'
        />
        <div className='fr-pb-4w'>
          <UtilisateurFormulaire />
        </div>
      </main>
    </PageCréerUtilisateurStyled>
  );
}
