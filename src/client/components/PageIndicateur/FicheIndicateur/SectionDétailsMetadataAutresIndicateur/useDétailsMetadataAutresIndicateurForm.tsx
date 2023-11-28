import { useFormContext, UseFormWatch } from 'react-hook-form';

export interface MetadataParametrageAutresIndicateurForm {
  indicNomBaro: string;
  indicDescrBaro: string;
  indicIsBaro: string;
  indicIsPerseverant: string;
  indicIsPhare: string;
  indicSource: string;
  indicSourceUrl: string;
  indicMethodeCalcul: string;
}

function activerWatchSurSelecteur(watch: UseFormWatch<MetadataParametrageAutresIndicateurForm>) {
  watch('indicIsBaro');
  watch('indicIsPerseverant');
  watch('indicIsPhare');
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
