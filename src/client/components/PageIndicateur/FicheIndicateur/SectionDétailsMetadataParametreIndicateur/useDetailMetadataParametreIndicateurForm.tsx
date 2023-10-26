import { useFormContext, UseFormWatch } from 'react-hook-form';
export interface MetadataParametrageParametreIndicateurForm {
  viDeptFrom: string;
  viDeptOp: string;
  vaDeptFrom: string;
  vaDeptOp: string;
  vcDeptFrom: string;
  vcDeptOp: string;
  viRegFrom: string;
  viRegOp: string;
  vaRegFrom: string;
  vaRegOp: string;
  vcRegFrom: string;
  vcRegOp: string;
  viNatFrom: string;
  viNatOp: string;
  vaNatFrom: string;
  vaNatOp: string;
  vcNatFrom: string;
  vcNatOp: string;
  paramVacaDecumulFrom: string;
  paramVacaPartitionDate: string;
  paramVacaOp: string;
  paramVacgDecumulFrom: string;
  paramVacgPartitionDate: string;
  paramVacgOp: string;
  poidsPourcentDept: number;
  poidsPourcentReg: number;
  poidsPourcentNat: number;
  tendance: string;
}

function activerWatchSurSelecteur(watch: UseFormWatch<MetadataParametrageParametreIndicateurForm>) {
  watch('viDeptFrom');
  watch('viDeptOp');
  watch('vaDeptFrom');
  watch('vaDeptOp');
  watch('vcDeptFrom');
  watch('vcDeptOp');
  watch('viRegFrom');
  watch('viRegOp');
  watch('vaRegFrom');
  watch('vaRegOp');
  watch('vcRegFrom');
  watch('vcRegOp');
  watch('viNatFrom');
  watch('viNatOp');
  watch('vaNatFrom');
  watch('vaNatOp');
  watch('vcNatFrom');
  watch('vcNatOp');
  watch('paramVacaDecumulFrom');
  watch('paramVacaPartitionDate');
  watch('paramVacaOp');
  watch('paramVacgDecumulFrom');
  watch('paramVacgPartitionDate');
  watch('paramVacgOp');
  watch('tendance');
}

export default function useDetailMetadataParametreIndicateurForm() {
  const { register, watch, getValues, formState: { errors } } = useFormContext<MetadataParametrageParametreIndicateurForm>();

  activerWatchSurSelecteur(watch);

  return {
    register,
    getValues,
    errors,
  };
}
