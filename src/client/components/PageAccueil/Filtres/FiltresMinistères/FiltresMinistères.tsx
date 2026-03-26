import "@gouvfr/dsfr/dist/component/sidemenu/sidemenu.min.css";
import { parseAsInteger, parseAsString, useQueryState } from "nuqs";
import { FunctionComponent, useCallback } from "react";
import PérimètreMinistériel from "@/server/domain/périmètreMinistériel/PérimètreMinistériel.interface";
import Ministère from "@/server/domain/ministère/Ministère.interface";
import { sauvegarderFiltres } from "@/stores/useFiltresStoreNew/useFiltresStoreNew";
import { IconeMinistere } from "@/client/utils/mapperIconeMinistereVersIcone";
import { clsxm } from "@/utils/clsxm";

interface FiltresMinistèresProps {
  ministères: Ministère[];
}

const catégorieDeFiltre = "périmètresMinistériels" as const;

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
    <div className="fr-form-group">
      <button
        aria-controls={`fr-sidemenu-item-${catégorieDeFiltre}`}
        aria-expanded="false"
        className="fr-sidemenu__btn fr-m-0 fr-text--sm w-full text-left focus:-outline-offset-2"
        type="button"
      >
        Filtrer par ministères
      </button>
      <div className="fr-collapse" id={`fr-sidemenu-item-${catégorieDeFiltre}`}>
        <ul
          aria-label="Liste des filtres ministères"
          className="fr-p-0 fr-m-0 list-none overflow-y-auto"
        >
          {ministères.map((ministère) => (
            <li key={ministère.nom}>
              <button
                className={clsxm(
                  "fr-m-0 fr-p-1w fr-text--md rounded w-full text-left focus:-outline-offset-2",
                  estDéroulé(ministère) &&
                    "font-bold text-white bg-primary [&_svg]:text-white focus:outline-white hover:bg-dsfr-blue-france-sun-113-hover",
                )}
                onClick={() => auClicSurUnMinistèreCallback(ministère)}
                type="button"
              >
                <div className="grid grid-cols-[2rem_auto]">
                  <IconeMinistere
                    className={clsxm({
                      "text-dsfr-blue-france-sun-113": !estDéroulé(ministère),
                      "text-white": estDéroulé(ministère),
                    })}
                    icone={ministère.icône}
                  />
                  <span>{ministère.nom}</span>
                </div>
              </button>
              {ministère.périmètresMinistériels.length > 1 && (
                <ul
                  className={clsxm(
                    "fr-p-0 fr-m-0 fr-mb-1w list-none overflow-y-hidden transition-[max-height] duration-500 [transition-timing-function:cubic-bezier(0,1.05,0,1)] max-h-0",
                    estDéroulé(ministère) &&
                      "max-h-screen transition-[max-height] duration-[2s]",
                  )}
                  tabIndex={!estDéroulé(ministère) ? -1 : undefined}
                >
                  {ministère.périmètresMinistériels.map((périmètre) => (
                    <li className="p-0 my-2 mr-0 ml-8" key={périmètre.id}>
                      <button
                        className={clsxm(
                          "!m-0 p-2 fr-text--md rounded w-full text-left focus:-outline-offset-2",
                          perimetres.includes(périmètre.id) &&
                            "font-bold text-white bg-primary [&_svg]:text-white focus:outline-white hover:bg-dsfr-blue-france-sun-113-hover",
                        )}
                        onClick={() => auClicSurUnPérimètreCallback(périmètre)}
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
          ))}
        </ul>
      </div>
    </div>
  );
};

export default FiltresMinistères;
