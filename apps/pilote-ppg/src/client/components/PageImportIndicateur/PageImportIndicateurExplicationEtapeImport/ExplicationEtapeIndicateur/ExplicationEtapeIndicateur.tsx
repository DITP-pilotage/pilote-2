import { FunctionComponent } from "react";
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
          "relative flex items-center justify-center w-8 h-8 text-white bg-primary rounded-full mb-2 font-bold text-h4 md:text-h4-md font-bold",
          "before:absolute before:block before:h-2 before:content-[''] before:bg-primary before:rounded-full before:left-6 before:w-8",
          "after:absolute after:block after:h-2 after:content-[''] after:bg-primary after:rounded-full after:left-16 after:w-2",
        )}
      >
        {numéro}
      </span>
      <h3 className="text-h6 md:text-h6-md mb-2">{titre}</h3>
      <p className="fr-mb-0 fr-text--sm">{texte}</p>
    </div>
  );
};

export default ExplicationEtapeIndicateur;
