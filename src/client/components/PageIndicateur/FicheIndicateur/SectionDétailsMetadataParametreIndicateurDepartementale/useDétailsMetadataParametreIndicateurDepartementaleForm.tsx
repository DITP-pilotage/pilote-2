import { useFormContext, UseFormWatch } from 'react-hook-form';

export interface MetadataParametrageParametreIndicateurDepartementaleForm {
  viDeptFrom: string;
  viDeptOp: string;
  vaDeptFrom: string;
  vaDeptOp: string;
  vcDeptFrom: string;
  vcDeptOp: string;
}

function activerWatchSurSelecteur(watch: UseFormWatch<MetadataParametrageParametreIndicateurDepartementaleForm>) {
  watch('viDeptFrom');
  watch('viDeptOp');
  watch('vaDeptFrom');
  watch('vaDeptOp');
  watch('vcDeptFrom');
  watch('vcDeptOp');
}

export default function useDétailsMetadataParametreIndicateurDepartementaleForm() {
  const { register, watch, getValues, formState: { errors } } = useFormContext<MetadataParametrageParametreIndicateurDepartementaleForm>();

  activerWatchSurSelecteur(watch);

  return {
    register,
    getValues,
    errors,
  };
}
