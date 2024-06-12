import '@gouvfr/dsfr/dist/component/table/table.min.css';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import PageUtilisateurProps from '@/components/PageUtilisateur/PageUtilisateur.interface';
import FilAriane from '@/components/_commons/FilAriane/FilAriane';
import PageUtilisateurStyled from '@/components/PageUtilisateur/PageUtilisateur.styled';
import Titre from '@/components/_commons/Titre/Titre';
import Bloc from '@/components/_commons/Bloc/Bloc';
import FicheUtilisateur from '@/components/PageUtilisateur/FicheUtilisateur/FicheUtilisateur';
import Alerte from '@/components/_commons/Alerte/Alerte';
import Modale from '@/client/components/_commons/Modale/Modale';
import Bouton from '@/client/components/_commons/Bouton/Bouton';
import { BandeauInformation } from '@/client/components/_commons/BandeauInformation';
import { useGestionTokenAPI } from '@/components/PageAdminGestionTokenAPI/useGestionTokenAPI';
import usePageUtilisateur from './usePageUtilisateur';

export default function PageUtilisateur({ utilisateur, tokenAPIInformation  }: PageUtilisateurProps) {
  const { supprimerUtilisateur, fermerLaModaleDeSuppressionUtilisateur, modificationEstImpossible, donnneContenuBandeau, habilitationsAGenererUnTokenDAuthentification } = usePageUtilisateur(utilisateur);
  const chemin = [{ nom:'Gestion des comptes', lien:'/admin/utilisateurs' }];
  const { data : session } = useSession();
  const { creerTokenAPI, alerte } = useGestionTokenAPI();
  const date = new Date();
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth();
  const day = date.getUTCDate();
  const hours = date.getUTCHours();
  const minutes = date.getUTCMinutes();
  const millisecondes = date.getUTCMilliseconds();
  const expirationDate = new Date(year + 1, month, day, hours, minutes, millisecondes);
  return (
    <PageUtilisateurStyled className='fr-pt-2w'>
      <main className='fr-container'>
        <FilAriane
          chemin={chemin}
          libelléPageCourante='Utilisateur'
        />
        <div className='fiche-utilisateur fr-pt-1w fr-pb-13w'>
          <Link
            aria-label='Retour à la liste des utilisateurs'
            className='fr-link fr-fi-arrow-left-line fr-link--icon-left fr-text--sm bouton-retour'
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
              {
                modificationEstImpossible(session, utilisateur.habilitations, utilisateur.profil) &&
                <div className='fr-pb-4w'>
                  <BandeauInformation 
                    bandeauType='INFO'
                    fermable={false}
                  >
                    {donnneContenuBandeau(session, utilisateur.habilitations, utilisateur.profil)}
                  </BandeauInformation>
                </div>
              }
              <FicheUtilisateur utilisateur={utilisateur} />
              {
                !modificationEstImpossible(session, utilisateur.habilitations, utilisateur.profil) && 
                <div className='fr-grid-row fr-mt-4w'>
                  <Link
                    className='fr-btn fr-mr-2w'
                    href={`/admin/utilisateur/${utilisateur.id}/modifier`}
                  >
                    Modifier
                  </Link>          
                  {
                    habilitationsAGenererUnTokenDAuthentification(session, utilisateur.profil) ? 
                      <button
                        className='fr-btn fr-btn--secondary fr-mr-2w'
                        onClick={() => creerTokenAPI({ email : utilisateur.email })}
                        title='Générer un token d’authentification'
                        type='submit'
                      >
                        Générer un token d’authentification
                      </button>
                      : null
                  }
                  <button
                    aria-controls='supprimer-compte'
                    className='fr-text supprimer'
                    data-fr-opened={false}
                    type='button'
                  >
                    Supprimer le compte
                  </button>
                  {
                    alerte ? (
                      <div className='fr-my-2w'>
                        <Alerte
                          message={alerte.message}
                          titre={alerte.titre}
                          type={alerte.type}
                        />
                      </div>
                    ) : null
                  } 
                  {tokenAPIInformation ? 
                    <div className='fr-alert fr-alert--info fr-alert--sm fr-mt-2w'>
                      <p className='fr-text--sm'>
                        Information : Le token d’authentification est généré pour cet utilisateur et est sauvegardé dans votre presse-papier. Ce token est valable jusqu’au                      
                      </p>
                    </div> : null}
                  <Modale
                    idHtml='supprimer-compte'
                    titre='Suppression de compte'
                  >
                    <div>
                      Vous êtes sur le point de supprimer le compte de 
                      {' '}
                      <span className='prénom'>
                        {utilisateur.prénom}
                      </span>
                      {' '}
                      <span className='nom'>
                        {utilisateur.nom}
                        .
                      </span>
                    </div>
                    <div className='fr-grid-row fr-grid-row--right fr-mt-4w'>
                      <Bouton
                        className='fr-btn--secondary fr-mr-2w'
                        label='Annuler'
                        onClick={fermerLaModaleDeSuppressionUtilisateur}
                      />
                      <Bouton
                        label='Confirmer la suppression'
                        onClick={supprimerUtilisateur}
                      />
                    </div>
                  </Modale>
                </div>
              }
            </div>
          </Bloc>
          
        </div>
      </main>
    </PageUtilisateurStyled>
  );
}
