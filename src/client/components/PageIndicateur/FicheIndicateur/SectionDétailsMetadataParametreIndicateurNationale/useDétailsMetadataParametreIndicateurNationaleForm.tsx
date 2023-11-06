import { useFormContext, UseFormWatch } from 'react-hook-form';

export interface MetadataParametrageParametreIndicateurNationaleForm {
  viNatFrom: string;
  viNatOp: string;
  vaNatFrom: string;
  vaNatOp: string;
  vcNatFrom: string;
  vcNatOp: string;
}

function activerWatchSurSelecteur(watch: UseFormWatch<MetadataParametrageParametreIndicateurNationaleForm>) {
  watch('viNatFrom');
  watch('viNatOp');
  watch('vaNatFrom');
  watch('vaNatOp');
  watch('vcNatFrom');
  watch('vcNatOp');
}

export default function useDétailsMetadataParametreIndicateurNationaleForm() {
  const { register, watch, getValues, formState: { errors } } = useFormContext<MetadataParametrageParametreIndicateurNationaleForm>();

  activerWatchSurSelecteur(watch);

  return {
    register,
    getValues,
    errors,
  };
}
