import Input from '@/components/_commons/Input/Input';
import { useTokenAPIForm } from '@/components/PageAdminGestionTokenAPI/TokenAPIForm/useTokenAPIForm';

export const TokenAPIForm = () => {
  const { errors, register } = useTokenAPIForm();
  return (
    <div className='fr-container'>
      <div className='fr-grid-row'>

        <div className='fr-col-4'>
          <p className='fr-text--md bold fr-mb-1v relative'>
            Émail
          </p>
          <Input
            erreur={errors.email}
            htmlName='email'
            register={register('email')}
          />
        </div>
        <div className='fr-col-4 flex align-end'>
          <button
            className='fr-btn fr-ml-2w'
            key='submit-token-api'
            type='submit'
          >
            Créer un token API
          </button>
        </div>
      </div>
    </div>
  );
};
