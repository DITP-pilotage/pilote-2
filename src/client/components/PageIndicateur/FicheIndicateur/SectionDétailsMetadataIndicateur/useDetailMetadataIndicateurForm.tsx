import { useFormContext, UseFormWatch } from 'react-hook-form';
export interface MetadataParametrageIndicateurForm {
  indicParentIndic: string;
  indicParentCh: string;
  indicNom: string;
  indicDescr: string;
  indicIsPerseverant: string;
  indicIsPhare: string;
  indicType: string;
  indicSource: string;
  indicSourceUrl: string;
  indicMethodeCalcul: string;
  indicUnite: string;
  indicSchema: string;
  chantierNom: string;
}

function activerWatchSurSelecteur(watch: UseFormWatch<MetadataParametrageIndicateurForm>) {
  watch('indicIsPerseverant');
  watch('indicIsPhare');
  watch('indicType');
  watch('indicSchema');
}

export default function useDetailMetadataIndicateurForm() {
  const { register, watch, getValues, formState: { errors } } = useFormContext<MetadataParametrageIndicateurForm>();

  activerWatchSurSelecteur(watch);

  return {
    register,
    getValues,
    errors,
  };
}
