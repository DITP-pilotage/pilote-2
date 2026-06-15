import { FunctionComponent } from "react";
import clsx from "clsx";
import Titre from "@/components/_commons/Titre/Titre";
import TitreInfobulleConteneur from "@/components/_commons/TitreInfobulleConteneur/TitreInfobulleConteneur";

export const TitreRubrique: FunctionComponent<{
  rubriqueNom: string;
  nombreIndicateurRubrique: number;
  classNameTitre?: string;
}> = ({
  rubriqueNom,
  nombreIndicateurRubrique,
  classNameTitre,
}) => {
  return (
    <TitreInfobulleConteneur>
      <Titre
        baliseHtml="h2"
        className={clsx("fr-text--lg fr-ml-md-0", classNameTitre)}
      >
        {`${rubriqueNom} (${nombreIndicateurRubrique})`}
      </Titre>
    </TitreInfobulleConteneur>
  );
};
