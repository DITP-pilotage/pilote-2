import { FunctionComponent } from 'react';
import Modale from '@/components/_commons/Modale/Modale';
import Titre from '@/components/_commons/Titre/Titre';
import Input from '@/components/_commons/Input/Input';
import { useModaleInscriptionInfolettre } from './useModaleInscriptionInfolettre';

const ID_HTML_MODALE_INSCRIPTION_INFOLETTRE = 'modale-inscription-infolettre';

export const ModaleInscriptionInfolettre: FunctionComponent = () => {
  const {
    register,
    handleFermetureModale,
    handleSubmitForm,
    estConsentantALinscription,
    succesEnvoieEmail,
  } = useModaleInscriptionInfolettre();

  return (
    <Modale
      fermetureCallback={handleFermetureModale}
      idHtml={ID_HTML_MODALE_INSCRIPTION_INFOLETTRE}
      tailleModale='md'
    >
      {
        !succesEnvoieEmail ? (
          <div>
            <Titre
              baliseHtml='h1'
              className='fr-modal__title fr-mb-1w fr-text-title--blue-france flex justify-center'
            >
              Ne manquez pas les actualités de la plateforme PILOTE
            </Titre>
            <p className='fr-mt-3w'>
              Inscrivez-vous à notre infolettre 
              {' '}
              <strong>
                pour rester informé des évolutions de la plateforme PILOTE.
              </strong>
            </p>
            <ul>
              <li>
                Les dernières nouveautés de l'outil
              </li>
              <li>
                Les prochaines dates de webinaire
              </li>
              <li>
                Des conseils pratiques pour optimiser le pilotage de vos projets
              </li>
            </ul>
            <p className='fr-text fr-text--bold fr-mt-2w'>
              👉 Une fois par mois, pas plus.
            </p>
            <form 
              className='fr-mt-3w'
              method='post'
              onSubmit={handleSubmitForm}
            >
              <div className='fr-mb-3w'>
                <label 
                  className='fr-label fr-text--bold' 
                  htmlFor='email'
                >
                  EMAIL 
                  {}
                  <span className='fr-text-red'>
                    *
                  </span>
                </label>
                <Input 
                  disabled 
                  htmlName='email' 
                  register={register('emailUtilisateur')}
                  type='email'
                />
              </div>
              <div className='fr-checkbox-group'>
                <input 
                  id='consentement' 
                  type='checkbox'
                  {...register('consentement')} 
                />
                <label 
                  className='fr-label' 
                  htmlFor='consentement'
                >
                  Je consens à recevoir l'infolettre "Minute PILOTE" contenant des actualités et informations liées à l'évolution de l'outil. 
                  Je pourrai me désabonner à tout moment via le lien présent dans chaque envoi.
                  {}
                  <span className='fr-text-red'>
                    *
                  </span>
                </label>
              </div>
              <button 
                className='fr-btn fr-mt-3w'
                disabled={!estConsentantALinscription}
                type='submit'
              >
                M'inscrire maintenant
              </button>
            </form>
          </div>
        ) : (
          <div className='fr-alert fr-alert--success fr-mt-2w'>
            <h3 className='fr-alert__title'>
              Inscription enregistrée.
            </h3>
            <span>
              <p>
                Merci pour votre inscription à l'infolettre Minute PILOTE.
              </p>
              <p>
                Pour finaliser votre abonnement, veuillez confirmer votre adresse de messagerie en cliquant sur le lien que nous venons de vous envoyer par email.
              </p>
              <br />                  
              <p>
                Pensez à vérifier votre dossier de courriers indésirables si vous ne trouvez pas l'email dans votre boîte de réception.
              </p>
            </span>
          </div>
        )
      }
    </Modale>
  );
};
