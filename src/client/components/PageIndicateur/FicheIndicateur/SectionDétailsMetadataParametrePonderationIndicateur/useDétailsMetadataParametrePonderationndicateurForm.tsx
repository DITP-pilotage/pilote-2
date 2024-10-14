import { useFormContext } from 'react-hook-form';

export type MetadataParametrageParametrePonderationIndicateurForm = {
  poidsPourcentDept: string;
  poidsPourcentReg: string;
  poidsPourcentNat: string;
};

export default function useDétailsMetadataParametrePonderationIndicateurForm() {
  const { register, getValues, formState: { errors }, setValue } = useFormContext<MetadataParametrageParametrePonderationIndicateurForm>();

  const setValuePonderation = (variable: keyof MetadataParametrageParametrePonderationIndicateurForm, valeur: string) => {
    setValue(variable, valeur);
  };

  return {
    register,
    getValues,
    errors,
    setValuePonderation,
  };
}
