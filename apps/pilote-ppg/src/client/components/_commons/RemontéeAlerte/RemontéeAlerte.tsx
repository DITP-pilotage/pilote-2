import { FunctionComponent } from "react";
import { clsxm } from "@/utils/clsxm";

interface RemontéeAlerteProps {
  nombre: number | null;
  libellé: string;
  auClic?: () => void;
  estActivée: boolean;
}

const RemontéeAlerte: FunctionComponent<RemontéeAlerteProps> = ({
  nombre,
  libellé,
  auClic,
  estActivée,
}) => {
  return (
    <button
      className={clsxm(
        "flex flex-col items-start w-full h-full bg-white border border-dsfr-grey-900 rounded-lg shadow-[0_2px_6px_0_#00001229] fr-p-3v fr-p-md-3w",
        estActivée && "border-warning",
      )}
      disabled={!auClic || nombre === null}
      onClick={auClic}
    >
      <span className="fr-h1 fr-mb-0 text-warning">{nombre ?? "-"}</span>
      <span className="fr-mb-0 texte-gauche text-xs text-dsfr-grey-50 md:text-base">
        {libellé}
      </span>
    </button>
  );
};
export default RemontéeAlerte;
