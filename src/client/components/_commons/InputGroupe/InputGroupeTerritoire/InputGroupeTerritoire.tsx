import { FunctionComponent } from 'react';
import InputGroupe from '@/client/components/_commons/InputGroupe/InputGroupe';
import {
  InputGroupeOptionsGroupées,
} from '@/client/components/_commons/InputGroupe/InputGroupe.interface';
import { actionsTerritoiresStore } from '@/stores/useTerritoiresStore/useTerritoiresStore';

interface InputGroupeTerritoireProps {
  changementValeurSelectionneeCallback: (territoireCodeSelectionne: string) => void
  territoireCodeSelectionneParDefaut: string
  options: InputGroupeOptionsGroupées
}

const InputGroupeTerritoire: FunctionComponent<InputGroupeTerritoireProps> = ({
  territoireCodeSelectionneParDefaut,
  changementValeurSelectionneeCallback,
  options,
}) => {
  const { récupérerDétailsSurUnTerritoire } = actionsTerritoiresStore();
  const territoireSélectionné = récupérerDétailsSurUnTerritoire(territoireCodeSelectionneParDefaut);

  return (
    <InputGroupe
      changementValeurSelectionneeCallback={changementValeurSelectionneeCallback}
      label='Territoire'
      libelle={territoireSélectionné.nomAffiché}
      optionsGroupées={options}
      valeurSelectionneeParDefaut={territoireCodeSelectionneParDefaut}
    />
  );
};

export default InputGroupeTerritoire;
