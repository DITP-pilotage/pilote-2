import { FunctionComponent } from "react";
import clsx from "clsx";
import { Infobulle } from "@/components/shared/Infobulle";
import TitreInfobulleConteneur from "@/components/_commons/TitreInfobulleConteneur/TitreInfobulleConteneur";

export const TitreRubrique: FunctionComponent<{
  rubriqueNom: string;
  rubriqueDescription: string | null;
  nombreIndicateurRubrique: number;
  classNameTitre?: string;
}> = ({
  rubriqueNom,
  rubriqueDescription,
  nombreIndicateurRubrique,
  classNameTitre,
}) => {
  return (
    <TitreInfobulleConteneur>
      <h2 className={clsx("text-lg md:ml-0", classNameTitre)}>
        {`${rubriqueNom} (${nombreIndicateurRubrique})`}
      </h2>
      {rubriqueDescription ? (
        <Infobulle>{rubriqueDescription}</Infobulle>
      ) : null}
    </TitreInfobulleConteneur>
  );
};
