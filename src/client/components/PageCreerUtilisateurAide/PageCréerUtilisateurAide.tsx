import { FunctionComponent } from 'react';
import Link from 'next/link';
import PageCréerUtilisateurAideStyled from './PageCréerUtilisateurAide.styled';
import { DescriptionEtapes } from './DescriptionEtapes/DescriptionEtapes';
import usePageCréerUtilisateurAide from './usePageCréerUtilisateurAide';

export const PageCréerUtilisateurAide: FunctionComponent<{}> = () => {  
  const { paragraphes, etapes } = usePageCréerUtilisateurAide();
  
  return (
    <PageCréerUtilisateurAideStyled>
      <main className='fr-container fr-py-6w'>
        <h3>
          Créer un compte pour un utilisateur sur votre territoire ou votre ministère
        </h3>
        <p className='fr-text fr-text--sm'>
          Un référent dédié par ministère ou par territoire est nécessaire pour toute nouvelle demande de compte, qui doit recevoir l'aval de la DITP. Assurez-vous d'utiliser votre adresse mail officielle et personnalisée (.gouv.fr) pour l'enregistrement, excluant tout usage d'adresses génériques.
        </p>
        <div className='fr-mt-6w'>
          <h3>
            Gestion des comptes
          </h3>
          {
            paragraphes.map(paragraphe => {
              return (
                <>
                  <h5 className='fr-mb-1w'>
                    {paragraphe.titre}
                  </h5>
                  <p className='fr-text fr-text--sm'>
                    {paragraphe.text}
                  </p>
                </>
              );
            })
          }
          <div className='flex justify-center align-center'>
            <DescriptionEtapes 
              etapes={etapes}
            />
          </div>
          <div className='flex justify-center align-center'>            
            <Link 
              className='fr-btn'
              href='/admin/utilisateur/creer'
            >
              Créer un compte
            </Link>
          </div>
        </div>
      </main>
    </PageCréerUtilisateurAideStyled>
  );
};
