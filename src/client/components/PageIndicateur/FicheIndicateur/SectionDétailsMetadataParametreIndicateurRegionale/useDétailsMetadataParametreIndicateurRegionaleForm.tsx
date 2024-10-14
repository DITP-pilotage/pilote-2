import { useFormContext, UseFormWatch } from 'react-hook-form';

export type MetadataParametrageParametreIndicateurRegionaleForm = {
  viRegFrom: string;
  viRegOp: string;
  vaRegFrom: string;
  vaRegOp: string;
  vcRegFrom: string;
  vcRegOp: string;
};

function activerWatchSurSelecteur(watch: UseFormWatch<MetadataParametrageParametreIndicateurRegionaleForm>) {
  watch('viRegFrom');
  watch('viRegOp');
  watch('vaRegFrom');
  watch('vaRegOp');
  watch('vcRegFrom');
  watch('vcRegOp');
}

export default function useDétailsMetadataParametreIndicateurRegionaleForm() {
  const { register, watch, getValues, setValue, formState: { errors } } = useFormContext<MetadataParametrageParametreIndicateurRegionaleForm>();

  activerWatchSurSelecteur(watch);

  return {
    register,
    getValues,
    errors,
    setValue,
  };
}
