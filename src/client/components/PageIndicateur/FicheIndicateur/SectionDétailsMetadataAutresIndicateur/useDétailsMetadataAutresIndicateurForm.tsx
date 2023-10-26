import { useFormContext, UseFormWatch } from 'react-hook-form';
export interface MetadataParametrageAutresIndicateurForm {
  indicNomBaro: string;
  indicDescrBaro: string;
  indicIsBaro: string;
}

function activerWatchSurSelecteur(watch: UseFormWatch<MetadataParametrageAutresIndicateurForm>) {
  watch('indicIsBaro');
}

export default function useSectionDétailsMetadataAutresIndicateurForm() {
  const { register, watch, getValues, formState: { errors } } = useFormContext<MetadataParametrageAutresIndicateurForm>();

  activerWatchSurSelecteur(watch);

  return {
    register,
    getValues,
    errors,
  };
}
