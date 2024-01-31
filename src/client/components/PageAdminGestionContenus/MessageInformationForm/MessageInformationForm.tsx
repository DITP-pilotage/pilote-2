import Interrupteur from '@/components/_commons/Interrupteur/Interrupteur';
import Sélecteur from '@/components/_commons/Sélecteur/Sélecteur';
import {
  useMessageInformationForm,
} from '@/components/PageAdminGestionContenus/MessageInformationForm/useMessageInformationForm';
import TextArea from '@/components/_commons/TextArea/TextArea';

export const MessageInformationForm = () => {
  const { errors, register, getValues } = useMessageInformationForm();
  return (
    <>
      <div className='flex flex-column fr-pb-2w'>
        <p className='fr-text--md bold fr-mb-1v relative'>
          Type de message et de bannière
        </p>
        <div className='flex'>
          <Sélecteur
            htmlName='bandeauType'
            options={[{ valeur: 'WARNING', libellé: 'Alerte (fond rouge)' }].map(acceptedValue => ({
              valeur: acceptedValue.valeur,
              libellé: acceptedValue.libellé,
            }))}
            register={register('bandeauType')}
            valeurSélectionnée={`${getValues('bandeauType')}`}
          />
        </div>
      </div>
      <div>
        <p className='fr-text--md bold fr-mb-1v relative'>
          Rédigez le message
        </p>
        <TextArea
          erreur={errors.bandeauTexte}
          htmlName='bandeauTexte'
          libellé='bandeauTexte'
          register={register('bandeauTexte', { value: 'test' })}
        />
      </div>
      <div className='flex fr-pb-2w'>
        <Interrupteur
          checked={getValues('isBandeauActif')}
          id='test'
          libellé='Activer la bannière'
          messageSecondaire='Activer la bannière pour la rendre visible à tous les utilisateurs de PILOTE'
          register={register('isBandeauActif')}
        />
      </div>
      <div className='w-full flex justify-end'>
        <button
          className='fr-btn fr-mr-2w'
          key='submit-bandeau-indispobilite'
          type='submit'
        >
          Valider les modifications
        </button>
      </div>
    </>
  );
};
