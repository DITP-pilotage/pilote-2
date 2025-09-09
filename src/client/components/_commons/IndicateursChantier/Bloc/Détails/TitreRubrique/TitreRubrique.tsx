import { FunctionComponent } from "react";
import clsx from "clsx";
import Infobulle from "@/components/_commons/Infobulle/Infobulle";
import Titre from "@/components/_commons/Titre/Titre";
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
      <Titre
        baliseHtml="h2"
        className={clsx("fr-text--lg fr-ml-md-0", classNameTitre)}
      >
        {`${rubriqueNom} (${nombreIndicateurRubrique})`}
      </Titre>
      {rubriqueDescription ? (
        <Infobulle classNameBouton="fr-pb-2w">{rubriqueDescription}</Infobulle>
      ) : null}
    </TitreInfobulleConteneur>
  );
};
