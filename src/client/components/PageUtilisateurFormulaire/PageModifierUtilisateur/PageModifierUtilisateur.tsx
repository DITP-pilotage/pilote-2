
import { FunctionComponent } from 'react';
import UtilisateurFormulaire from '@/components/PageUtilisateurFormulaire/UtilisateurFormulaire/UtilisateurFormulaire';
import FilAriane from '@/client/components/_commons/FilAriane/FilAriane';
import Utilisateur from '@/server/domain/utilisateur/Utilisateur.interface';
import PageModifierUtilisateurStyled from './PageModifierUtilisateur.styled';

interface PageModifierUtilisateurProps {
  utilisateur: Utilisateur
}

const PageModifierUtilisateur: FunctionComponent<PageModifierUtilisateurProps> = ({ utilisateur }) => {
  const chemin = [{ nom:'Gestion des comptes', lien:'/admin/utilisateurs' }];

  return (
    <PageModifierUtilisateurStyled className='fr-pt-2w' >
      <main className='fr-container'>
        <FilAriane
          chemin={chemin}
          libelléPageCourante='Modifier un compte'
        />
        <div className='fr-pb-4w'>
          <UtilisateurFormulaire utilisateur={utilisateur} />
        </div>
      </main>
    </PageModifierUtilisateurStyled>
  );
};

export default PageModifierUtilisateur;
