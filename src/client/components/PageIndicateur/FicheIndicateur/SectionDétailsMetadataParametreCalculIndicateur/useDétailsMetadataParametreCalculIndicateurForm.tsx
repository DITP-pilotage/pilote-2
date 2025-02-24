import { useFormContext, UseFormWatch } from 'react-hook-form';

export type MetadataParametrageParametreCalculIndicateurForm = {
  paramVacaDecumulFrom: string;
  paramVacaPartitionDate: string;
  paramVacaOp: string;
  paramVacgDecumulFrom: string;
  paramVacgPartitionDate: string;
  paramVacgOp: string;
  tendance: string;
};

function activerWatchSurSelecteur(watch: UseFormWatch<MetadataParametrageParametreCalculIndicateurForm>) {
  watch('paramVacaDecumulFrom');
  watch('paramVacaPartitionDate');
  watch('paramVacaOp');
  watch('paramVacgDecumulFrom');
  watch('paramVacgPartitionDate');
  watch('paramVacgOp');
  watch('tendance');
}

export default function useDétailsMetadataParametreCalculIndicateurForm() {
  const { register, watch, getValues, formState: { errors }, setValue } = useFormContext<MetadataParametrageParametreCalculIndicateurForm>();

  activerWatchSurSelecteur(watch);

  return {
    register,
    getValues,
    errors,
    setValue,
  };
}
