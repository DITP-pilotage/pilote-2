import { FormProvider } from 'react-hook-form';
import Titre from '@/components/_commons/Titre/Titre';
import Bloc from '@/components/_commons/Bloc/Bloc';
import { useMessageInformation } from '@/components/PageAdminGestionContenus/useMessageInformation';
import {
  MessageInformationForm,
} from '@/components/PageAdminGestionContenus/MessageInformationForm/MessageInformationForm';

export function PageMessageInformation() {
  const { reactHookForm, modifierIndicateur } = useMessageInformation();

  return (
    <div className='flex'>
      <main>
        <div className='fr-mt-2w fr-mx-4w fr-mb-3w'>
          <div className='fr-container'>
            <Titre
              baliseHtml='h1'
              className='fr-h1 fr-mb-2w'
            >
              Message d'information
            </Titre>
            <Bloc>
              <FormProvider {...reactHookForm}>
                <form
                  method='put'
                  onSubmit={reactHookForm.handleSubmit((data) => {
                    modifierIndicateur(data);
                  })}
                >
                  <MessageInformationForm />
                </form>
              </FormProvider>
            </Bloc>
          </div>
        </div>
      </main>
    </div>
  );

}
