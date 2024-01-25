import { useFormContext } from 'react-hook-form';
import { ContenuForm } from '@/components/PageAdminGestionContenus/useMessageInformation';

export const useMessageInformationForm = () => {
  const { register, watch, getValues, formState: { errors } } = useFormContext<ContenuForm>();

  watch('bandeauType');
  watch('isBandeauActif');
  
  return {
    register,
    errors,
    getValues,
  };
};
