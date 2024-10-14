import { useFormContext, UseFormWatch } from 'react-hook-form';

export type MetadataParametrageParametreIndicateurDepartementaleForm = {
  viDeptFrom: string;
  viDeptOp: string;
  vaDeptFrom: string;
  vaDeptOp: string;
  vcDeptFrom: string;
  vcDeptOp: string;
};

function activerWatchSurSelecteur(watch: UseFormWatch<MetadataParametrageParametreIndicateurDepartementaleForm>) {
  watch('viDeptFrom');
  watch('viDeptOp');
  watch('vaDeptFrom');
  watch('vaDeptOp');
  watch('vcDeptFrom');
  watch('vcDeptOp');
}

export default function useDétailsMetadataParametreIndicateurDepartementaleForm() {
  const { register, watch, getValues, setValue, formState: { errors } } = useFormContext<MetadataParametrageParametreIndicateurDepartementaleForm>();

  activerWatchSurSelecteur(watch);

  return {
    register,
    getValues,
    errors,
    setValue,
  };
}
