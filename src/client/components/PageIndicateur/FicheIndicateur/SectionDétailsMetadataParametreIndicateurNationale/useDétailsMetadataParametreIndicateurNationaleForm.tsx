import { useFormContext, UseFormWatch } from 'react-hook-form';

export type MetadataParametrageParametreIndicateurNationaleForm = {
  viNatFrom: string;
  viNatOp: string;
  vaNatFrom: string;
  vaNatOp: string;
  vcNatFrom: string;
  vcNatOp: string;
};

function activerWatchSurSelecteur(watch: UseFormWatch<MetadataParametrageParametreIndicateurNationaleForm>) {
  watch('viNatFrom');
  watch('viNatOp');
  watch('vaNatFrom');
  watch('vaNatOp');
  watch('vcNatFrom');
  watch('vcNatOp');
}

export default function useDétailsMetadataParametreIndicateurNationaleForm() {
  const { register, watch, getValues, setValue, formState: { errors } } = useFormContext<MetadataParametrageParametreIndicateurNationaleForm>();

  activerWatchSurSelecteur(watch);

  return {
    register,
    getValues,
    errors,
    setValue,
  };
}
