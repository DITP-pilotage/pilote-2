import "@gouvfr/dsfr/dist/component/sidemenu/sidemenu.min.css";
import { parseAsInteger, parseAsString, useQueryState } from "nuqs";
import { FunctionComponent, useCallback } from "react";
import PérimètreMinistériel from "@/server/domain/périmètreMinistériel/PérimètreMinistériel.interface";
import Ministère from "@/server/domain/ministère/Ministère.interface";
import Icône from "@/components/_commons/Icône/Icône";
import { sauvegarderFiltres } from "@/stores/useFiltresStoreNew/useFiltresStoreNew";
import FiltresMinistèresStyled from "./FiltresMinistères.styled";

interface FiltresMinistèresProps {
  ministères: Ministère[];
}

const catégorieDeFiltre: "périmètresMinistériels" = "périmètresMinistériels";

const FiltresMinistères: FunctionComponent<FiltresMinistèresProps> = ({
  ministères,
}) => {
  const [perimetres, setPerimetres] = useQueryState(
    "perimetres",
    parseAsString.withDefault("").withOptions({
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

  const estDéroulé = useCallback(
    (ministère: Ministère) => {
      return ministère.périmètresMinistériels.some((périmètre) =>
        perimetres.split(",").filter(Boolean).includes(périmètre.id),
      );
    },
    [perimetres],
  );

  const auClicSurUnMinistèreCallback = useCallback(
    (ministère: Ministère) => {
      let arrPerimetreFiltre = perimetres.split(",").filter(Boolean);
      if (estDéroulé(ministère)) {
        ministère.périmètresMinistériels.forEach((périmètre) =>
          arrPerimetreFiltre.splice(
            arrPerimetreFiltre.indexOf(périmètre.id),
            1,
          ),
        );
      } else {
        ministère.périmètresMinistériels.forEach((périmètre) =>
          arrPerimetreFiltre.push(périmètre.id),
        );
      }
      setPagination(1);
      sauvegarderFiltres({ perimetres: arrPerimetreFiltre });
      return setPerimetres(arrPerimetreFiltre.join(","));
    },
    [estDéroulé, perimetres, setPagination, setPerimetres],
  );

  const auClicSurUnPérimètreCallback = useCallback(
    (périmètre: PérimètreMinistériel) => {
      let arrPerimetreFiltre = perimetres.split(",").filter(Boolean);

      if (perimetres.includes(périmètre.id)) {
        arrPerimetreFiltre.splice(arrPerimetreFiltre.indexOf(périmètre.id), 1);
      } else {
        arrPerimetreFiltre.push(périmètre.id);
      }
      setPagination(1);
      sauvegarderFiltres({ perimetres: arrPerimetreFiltre });
      return setPerimetres(arrPerimetreFiltre.join(","));
    },
    [perimetres, setPagination, setPerimetres],
  );

  return (
    <FiltresMinistèresStyled className="fr-form-group">
      <button
        aria-controls={`fr-sidemenu-item-${catégorieDeFiltre}`}
        aria-expanded="false"
        className="fr-sidemenu__btn fr-m-0 fr-text--sm"
        type="button"
      >
        Filtrer par ministères
      </button>
      <div className="fr-collapse" id={`fr-sidemenu-item-${catégorieDeFiltre}`}>
        <ul
          aria-label="Liste des filtres ministères"
          className="fr-p-0 fr-m-0 ministères-liste"
        >
          {ministères.map((ministère) => {
            return (
              <li className="" key={ministère.nom}>
                <button
                  className={`
                        fr-m-0 fr-p-1w fr-text--md tuile
                        ${estDéroulé(ministère) ? "ministère-déroulé actif" : ""}
                      `}
                  onClick={() => auClicSurUnMinistèreCallback(ministère)}
                  type="button"
                >
                  <div className="tuile-ministère-contenu">
                    <span className="icône text-lg">
                      {!!ministère.icône && <Icône id={ministère.icône} />}
                    </span>
                    <span>{ministère.nom}</span>
                  </div>
                </button>
                {ministère.périmètresMinistériels.length > 1 && (
                  <ul
                    className="fr-p-0 fr-m-0 fr-mb-1w périmètres-liste"
                    tabIndex={!estDéroulé(ministère) ? -1 : undefined}
                  >
                    {ministère.périmètresMinistériels.map((périmètre) => (
                      <li
                        className="fr-p-0 fr-my-1w fr-mr-0 fr-ml-4w"
                        key={périmètre.id}
                      >
                        <button
                          className={`
                                fr-m-0 fr-p-1w fr-text--md tuile
                                ${perimetres.includes(périmètre.id) ? "actif" : ""}
                              `}
                          onClick={() =>
                            auClicSurUnPérimètreCallback(périmètre)
                          }
                          tabIndex={!estDéroulé(ministère) ? -1 : undefined}
                          type="button"
                        >
                          {périmètre.nom}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </FiltresMinistèresStyled>
  );
};

export default FiltresMinistères;
