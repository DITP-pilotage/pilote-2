import { parseAsBoolean, parseAsInteger, useQueryState } from "nuqs";
import { FunctionComponent } from "react";
import { clsxm } from "@/utils/clsxm";
import { sauvegarderFiltres } from "@/client/stores/useFiltresStoreNew/useFiltresStoreNew";

interface RemontéeAlerteProps {
  nombre: number | null;
  libellé: string;
  nomCritère: string;
  estActivée: boolean;
}

const RemontéeAlerte: FunctionComponent<RemontéeAlerteProps> = ({
  nombre,
  libellé,
  nomCritère,
  estActivée,
}) => {
  const [filtreAlerte, setFiltreAlerte] = useQueryState(
    nomCritère,
    parseAsBoolean.withDefault(false).withOptions({
      shallow: false,
      clearOnDefault: true,
      history: "push",
    }),
  );
  const [, setPagination] = useQueryState(
    "pageIndex",
    parseAsInteger.withDefault(1).withOptions({
      shallow: false,
    }),
  );

  return (
    <button
      className={clsxm(
        "flex flex-col items-start w-full h-full bg-white border border-dsfr-grey-625 rounded-lg shadow-[0_2px_6px_0_#00001229] fr-p-3v fr-p-md-3w",
        estActivée && "border-warning",
      )}
      disabled={nombre === null}
      onClick={() => {
        setPagination(1);
        sauvegarderFiltres({ [nomCritère]: !filtreAlerte });
        setFiltreAlerte(!filtreAlerte);
      }}
    >
      <span className="fr-h1 fr-mb-0 text-warning">
        {nombre ?? "-"} {filtreAlerte}
      </span>
      <span className="fr-mb-0 texte-gauche text-xs text-dsfr-grey-50 md:text-base">{libellé}</span>
    </button>
  );
};

export default RemontéeAlerte;
