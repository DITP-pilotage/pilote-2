import { useFormContext } from 'react-hook-form';
import { TokenAPIForm } from '@/components/PageAdminGestionTokenAPI/useGestionTokenAPI';

export const useTokenAPIForm = () => {
  const { register, getValues, formState: { errors } } = useFormContext<TokenAPIForm>();
  
  return {
    register,
    errors,
    getValues,
  };
};
