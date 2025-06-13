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
    AConsentiALinscription,
  } = useModaleInscriptionInfolettre();

  return (
    <Modale
      fermetureCallback={handleFermetureModale}
      idHtml={ID_HTML_MODALE_INSCRIPTION_INFOLETTRE}
      tailleModale='md'
    >
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
              J'accepte de recevoir des emails marketing et j'accepte la politique de confidentialité.
              {}
              <span className='fr-text-red'>
                *
              </span>
            </label>
          </div>
          <button 
            aria-controls={ID_HTML_MODALE_INSCRIPTION_INFOLETTRE} 
            className='fr-btn fr-mt-3w'
            disabled={!AConsentiALinscription}
            type='submit'
          >
            M'inscrire maintenant
          </button>
        </form>
      </div>
    </Modale>
  );
};
