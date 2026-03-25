import { Suspense, useCallback } from "react";
import { parseAsInteger, parseAsString, useQueryState } from "nuqs";
import {
  libellesMeteos,
  MeteoSaisissable,
} from "@/server/domain/météo/Météo.interface";
import { sauvegarderFiltres } from "@/client/stores/useFiltresStoreNew/useFiltresStoreNew";
import { MeteoPicto } from "@/components/_commons/Meteo/Picto/MeteoPicto";
import { RepartitionMeteoChantiersContrat } from "@/server/chantiers/app/contrats/RepartitionMeteoChantiersContrat";
import { clsxm } from "@/utils/clsxm";
import api from "@/server/infrastructure/api/trpc/api";
import Bloc from "@/components/_commons/Bloc/Bloc";
import Titre from "@/components/_commons/Titre/Titre";
import { Infobulle } from "@/components/_commons/Infobulle/Infobulle";
import TitreInfobulleConteneur from "@/components/_commons/TitreInfobulleConteneur/TitreInfobulleConteneur";
import INFOBULLE_CONTENUS from "@/client/constants/infobulles";

const meteosOrdonnees: MeteoSaisissable[] = [
  "SOLEIL",
  "COUVERT",
  "NUAGE",
  "ORAGE",
];

export const WidgetRepartitionMeteos = ({
  chantierIds,
  territoireCode,
}: {
  chantierIds: string[];
  territoireCode: string;
}) => {
  return (
    <section className="fr-mr-md-2w fr-mr-xl-0">
      <Bloc contenuClassesSupplémentaires="fr-py-2w fr-px-3w">
        <TitreInfobulleConteneur className="justify-between fr-mb-2w">
          <Titre
            baliseHtml="h2"
            className="fr-text--lg fr-mb-0 fr-py-1v"
            estInline
          >
            Répartition des météos renseignées
          </Titre>
          <Infobulle>{INFOBULLE_CONTENUS.chantiers.météos}</Infobulle>
        </TitreInfobulleConteneur>
        <Suspense>
          <RepartitionMeteosContenu
            chantierIds={chantierIds}
            territoireCode={territoireCode}
          />
        </Suspense>
      </Bloc>
    </section>
  );
};

const RepartitionMeteosContenu = ({
  chantierIds,
  territoireCode,
}: {
  chantierIds: string[];
  territoireCode: string;
}) => {
  const [repartition] =
    api.chantier.recupererRepartitionMeteos.useSuspenseQuery({
      chantierIds,
      territoireCode,
    });

  return <TuilesMeteos repartition={repartition} />;
};

const TuilesMeteos = ({
  repartition,
}: {
  repartition: RepartitionMeteoChantiersContrat;
}) => {
  const [meteos, setMeteos] = useQueryState(
    "meteos",
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

  const auClickCallback = useCallback(
    (meteo: MeteoSaisissable) => {
      let arrMeteoFiltre = meteos.split(",").filter(Boolean);
      if (meteos.includes(meteo)) {
        arrMeteoFiltre.splice(arrMeteoFiltre.indexOf(meteo), 1);
      } else {
        arrMeteoFiltre.push(meteo);
      }
      setPagination(1);
      sauvegarderFiltres({ meteos: arrMeteoFiltre });
      return setMeteos(arrMeteoFiltre.join(","));
    },
    [meteos, setMeteos, setPagination],
  );

  return (
    <ul className="flex flex-col gap-3 list-none p-0 m-0 max-w-[360px]">
      {meteosOrdonnees.map((meteo) => (
        <li key={meteo}>
          <button
            className={clsxm(
              "flex items-center gap-3 w-full py-4 px-5 border border-dsfr-moutarde-main-975 rounded-xl bg-white shadow-lg cursor-pointer transition-colors hover:border-dsfr-moutarde-main-850",
              {
                "border-dsfr-moutarde-main-925 bg-dsfr-moutarde-main-975":
                  meteos.includes(meteo),
              },
            )}
            onClick={() => {
              auClickCallback(meteo);
            }}
            title={libellesMeteos[meteo]}
            type="button"
          >
            <span className="text-[1.75rem] font-bold text-dsfr-moutarde-main-679 min-w-[2.5rem] text-center">
              {repartition[meteo]}
            </span>
            <MeteoPicto meteo={meteo} />
            <span className="text-sm text-[var(--text-action-high-grey)] leading-tight">
              {libellesMeteos[meteo]}
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
};
