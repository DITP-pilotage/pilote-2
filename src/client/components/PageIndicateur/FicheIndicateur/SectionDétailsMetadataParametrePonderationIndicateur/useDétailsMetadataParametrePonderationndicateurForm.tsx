import { useFormContext } from 'react-hook-form';

export interface MetadataParametrageParametrePonderationIndicateurForm {
  poidsPourcentDept: string;
  poidsPourcentReg: string;
  poidsPourcentNat: string;
}

export default function useDétailsMetadataParametrePonderationIndicateurForm() {
  const { register, getValues, formState: { errors } } = useFormContext<MetadataParametrageParametrePonderationIndicateurForm>();

  return {
    register,
    getValues,
    errors,
  };
}
