import { FunctionComponent } from "react";
import Titre from "@/components/_commons/Titre/Titre";
import { clsxm } from "@/utils/clsxm";

interface ExplicationEtapeIndicateurProps {
  numéro: number;
  titre: string;
  texte: string;
  etapeCourante: number;
}

const ExplicationEtapeIndicateur: FunctionComponent<
  ExplicationEtapeIndicateurProps
> = ({ titre, texte, numéro, etapeCourante }) => {
  return (
    <div
      className={clsxm(
        "h-full bg-white border border-dsfr-grey-900 fr-p-3w",
        etapeCourante === numéro && "border-primary",
      )}
    >
      <span
        className={clsxm(
          "relative flex items-center justify-center w-8 h-8 text-white bg-primary rounded-full fr-mb-1w fr-text--bold fr-h4",
          "before:absolute before:block before:h-2 before:content-[''] before:bg-primary before:rounded-full before:left-6 before:w-8",
          "after:absolute after:block after:h-2 after:content-[''] after:bg-primary after:rounded-full after:left-16 after:w-2",
        )}
      >
        {numéro}
      </span>
      <Titre baliseHtml="h3" className="fr-h6 fr-mb-1w">
        {titre}
      </Titre>
      <p className="fr-mb-0 fr-text--sm">{texte}</p>
    </div>
  );
};

export default ExplicationEtapeIndicateur;
