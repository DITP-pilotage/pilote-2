import { FunctionComponent } from "react";
import InputGroupe from "@/client/components/_commons/InputGroupe/InputGroupe";
import { InputGroupeOptionsGroupées } from "@/client/components/_commons/InputGroupe/InputGroupe.interface";
import { useTerritoireHabilitation } from "@/client/hooks/useTerritoireHabilitation";

interface InputGroupeTerritoireProps {
  changementValeurSelectionneeCallback: (
    territoireCodeSelectionne: string,
  ) => void;
  territoireCodeSelectionneParDefaut: string;
  options: InputGroupeOptionsGroupées;
  direction: "horizontal" | "vertical";
}

export const InputGroupeTerritoire: FunctionComponent<
  InputGroupeTerritoireProps
> = ({
  territoireCodeSelectionneParDefaut,
  changementValeurSelectionneeCallback,
  options,
  direction,
}) => {
  const { récupérerDétailsSurUnTerritoire } = useTerritoireHabilitation();

  const territoireSélectionné = récupérerDétailsSurUnTerritoire(
    territoireCodeSelectionneParDefaut,
  );

  return (
    <InputGroupe
      changementValeurSelectionneeCallback={
        changementValeurSelectionneeCallback
      }
      direction={direction}
      label="Territoire"
      libelle={territoireSélectionné.nomAffiché}
      optionsGroupées={options}
      valeurSelectionneeParDefaut={territoireCodeSelectionneParDefaut}
    />
  );
};
