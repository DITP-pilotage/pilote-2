import {
  aggregationFn_extent,
  aggregationFn_sum,
  columnFilteringFeature,
  columnGroupingFeature,
  columnVisibilityFeature,
  constructAggregationFn,
  createExpandedRowModel,
  createFilteredRowModel,
  createGroupedRowModel,
  createPaginatedRowModel,
  ExpandedState,
  globalFilteringFeature,
  GroupingState,
  rowAggregationFeature,
  rowExpandingFeature,
  rowPaginationFeature,
  rowSortingFeature,
  tableFeatures,
} from "@tanstack/react-table";
import { ChangeEvent, useMemo, useState } from "react";
import { parseAsBoolean, parseAsStringLiteral, useQueryState } from "nuqs";
import TableauRéformesAvancement from "@/components/PageAccueil/TableauRéformes/Avancement/TableauRéformesAvancement";
import TableauRéformesMétéo from "@/components/PageAccueil/TableauRéformes/Météo/TableauRéformesMétéo";
import { calculerMoyenne } from "@/client/utils/statistiques/statistiques";
import TypologiesPictos from "@/components/PageAccueil/PageChantiers/TableauChantiers/TypologiesPictos/TypologiesPictos";
import { BadgeTendance } from "@/components/PageAccueil/PageChantiers/TableauChantiers/Tendance/BadgeTendance";
import TableauChantiersEcart from "@/components/PageAccueil/PageChantiers/TableauChantiers/Écart/TableauChantiersÉcart";
import { Ministère } from "@/shared/ministere/Ministere.interface";
import { Infobulle } from "@/components/shared/Infobulle";
import infobulles from "@/client/constants/infobulles";
import { IconeMinistere } from "@/client/utils/mapperIconeMinistereVersIcone";
import { Icone } from "@/components/_commons/Icone";
import { ArrowSLineIcon } from "@/components/_commons/Icones/ArrowSLineIcon";
import { ArrowSLine2Icon } from "@/components/_commons/Icones/ArrowSLine2Icon";
import { clsxm } from "@/utils/clsxm";
import {
  type AppFeatures,
  createDataTableHook,
} from "@/components/shared/DataTable/createDataTableHook";
import { TRI_CHANTIERS_PAR_DEFAUT } from "@/server/chantiers/app/contrats/TriChantiers";
import { LIBELLES_TRI_CHANTIERS } from "./libellesTriChantiers";
import TableauChantiersProps, {
  DonnéesTableauChantiers,
} from "./TableauChantiers.interface";
import TableauChantiersTuileChantier from "./Tuile/Chantier/TableauChantiersTuileChantier";
import TableauChantiersTuileMinistère from "./Tuile/Ministère/TableauChantiersTuileMinistère";

const features = tableFeatures({
  columnFilteringFeature,
  globalFilteringFeature,
  rowSortingFeature,
  columnGroupingFeature,
  rowAggregationFeature,
  rowExpandingFeature,
  rowPaginationFeature,
  columnVisibilityFeature,
  aggregationFns: {
    extent: aggregationFn_extent,
    sum: aggregationFn_sum,
  },
  filteredRowModel: createFilteredRowModel(),
  groupedRowModel: createGroupedRowModel(),
  expandedRowModel: createExpandedRowModel(),
  paginatedRowModel: createPaginatedRowModel(),
});

const accueilChantiers = createDataTableHook(features);
const reactTableColonnesHelper =
  accueilChantiers.createColumnHelper<DonnéesTableauChantiers>();

const moyenneAvancementDesChantiers = constructAggregationFn<
  AppFeatures<typeof features>,
  DonnéesTableauChantiers,
  number | null,
  number | null
>({
  aggregate: ({ rows }) =>
    calculerMoyenne(rows.map((chantierRow) => chantierRow.original.avancement)),
});

export const useTableauChantiers = (
  données: TableauChantiersProps["données"],
  ministèresDisponibles: Ministère[],
  nombreTotalChantiersAvecAlertes: number,
  chantiersSontArchives: boolean,
  jalon: number,
  territoireCode: string,
) => {
  const [estGroupe] = useQueryState(
    "groupeParMinistere",
    parseAsBoolean.withDefault(false),
  );

  const regroupement: GroupingState =
    ministèresDisponibles.length > 1 && estGroupe ? ["porteur"] : [];

  const [expanded, setExpanded] = useState<ExpandedState>(true);

  const colonnesTableauChantiers = useMemo(
    () =>
      reactTableColonnesHelper.columns([
        reactTableColonnesHelper.accessor("porteur.nom", {
          header: "Porteur",
          id: "porteur",
          cell: (cellContext) => cellContext.getValue(),
          enableGrouping: true,
        }),
        reactTableColonnesHelper.accessor("nom", {
          header: "Chantiers",
          id: "nom",
          aggregatedCell: (aggregatedCellContext) => (
            <div className="flex gap-2 ">
              <div>
                <IconeMinistere
                  className="text-dsfr-blue-france-sun-113"
                  icone={aggregatedCellContext.row.original.porteur?.icône}
                />
              </div>
              <span className="font-bold">
                {aggregatedCellContext.row.original.porteur?.nom ?? ""}
              </span>
            </div>
          ),
          cell: (cellContext) =>
            cellContext.table.getColumn("porteur")?.getIsGrouped() ? (
              <div className="ml-10">
                <span>{cellContext.getValue()}</span>
              </div>
            ) : (
              <div className="flex gap-2">
                <div>
                  <IconeMinistere
                    className="text-dsfr-blue-france-sun-113"
                    icone={cellContext.row.original.porteur?.icône}
                  />
                </div>
                {cellContext.getValue()}
              </div>
            ),
          enableGrouping: false,
          meta: {
            width: "20rem",
          },
        }),
        reactTableColonnesHelper.accessor("typologie", {
          header: () => (
            <div className="flex align-center no-wrap">
              <span>Typologie</span>
              <Infobulle classNameBouton="infobulle-header-typologie">
                {infobulles.chantiers.listeDesChantiersHeaderTypologie}
              </Infobulle>
            </div>
          ),
          id: "typologie",
          cell: (cellContext) => (
            <TypologiesPictos typologies={cellContext.getValue()} />
          ),
          enableGrouping: false,
          meta: {
            width: "6.5rem",
          },
        }),
        reactTableColonnesHelper.accessor("météo", {
          header: () => (
            <div className="flex align-center no-wrap">
              <span>Météo</span>
              <Infobulle classNameBouton="infobulle-header-meteo">
                {infobulles.chantiers.listeDesChantiersHeaderMeteo}
              </Infobulle>
            </div>
          ),
          id: "météo",
          cell: (cellContext) => (
            <TableauRéformesMétéo
              chantiersSontArchives={chantiersSontArchives}
              dateDeMàjDonnéesQualitatives={
                cellContext.row.original.dateDeMàjDonnéesQualitatives
              }
              météo={cellContext.getValue()}
            />
          ),
          enableGlobalFilter: false,
          enableGrouping: false,
          meta: {
            width: "8rem",
          },
        }),
        reactTableColonnesHelper.accessor("tendance", {
          header: () => (
            <div className="flex align-center no-wrap">
              <span>Tendance</span>
              <Infobulle classNameBouton="infobulle-header-tendance">
                {infobulles.chantiers.listeDesChantiersHeaderTendance}
              </Infobulle>
            </div>
          ),
          id: "tendance",
          cell: (cellContext) => (
            <BadgeTendance
              estArchive={chantiersSontArchives}
              tendance={cellContext.getValue()}
            />
          ),
          enableGrouping: false,
          meta: {
            width: "9rem",
          },
        }),
        reactTableColonnesHelper.accessor("avancement", {
          header: () => (
            <div className="flex align-center no-wrap">
              <span className="whitespace-normal break-normal">
                {`Avancement ${jalon}`}
              </span>
              <Infobulle classNameBouton="infobulle-header-taux-avancement">
                {infobulles.chantiers.listeDesChantiersHeaderTauxAvancement}
              </Infobulle>
            </div>
          ),
          id: "avancement",
          cell: (cellContext) => (
            <TableauRéformesAvancement
              avancement={cellContext.getValue()}
              dateDeMàjDonnéesQuantitatives={
                cellContext.row.original.dateDeMàjDonnéesQuantitatives
              }
              estArchive={chantiersSontArchives}
            />
          ),
          enableGlobalFilter: false,
          enableGrouping: false,
          aggregationFn: moyenneAvancementDesChantiers,
          maxAggregationDepth: Infinity,
          aggregatedCell: (avancement) => (
            <TableauRéformesAvancement
              avancement={avancement.getValue() ?? null}
              estArchive={chantiersSontArchives}
            />
          ),
          meta: {
            width: "8rem",
          },
        }),
        reactTableColonnesHelper.accessor("écart", {
          header: () => (
            <div className="flex align-center no-wrap">
              <span>{`Écart ${jalon}`}</span>
              <Infobulle classNameBouton="infobulle-header-écart">
                {infobulles.chantiers.listeDesChantiersHeaderEcart}
              </Infobulle>
            </div>
          ),
          id: "écart",
          cell: (cellContext) => (
            <TableauChantiersEcart
              ecart={cellContext.getValue()}
              estArchive={chantiersSontArchives}
            />
          ),
          enableGrouping: false,
          aggregatedCell: () => null,
          meta: {
            width: "4.5rem",
          },
        }),
        reactTableColonnesHelper.display({
          id: "dérouler-groupe",
          header: () => <span className="sr-only">Déplier le groupe</span>,
          aggregatedCell: (aggregatedCellContext) => {
            const estDéroulé = aggregatedCellContext.row.getIsExpanded();
            const ministère =
              aggregatedCellContext.row.original.porteur?.nom ?? "";
            return (
              <button
                aria-expanded={estDéroulé}
                className={clsxm(
                  "after:absolute after:inset-0 after:content-['']",
                  chantiersSontArchives
                    ? "!text-dsfr-grey-925"
                    : "!text-primary",
                )}
                onClick={aggregatedCellContext.row.getToggleExpandedHandler()}
                type="button"
              >
                <span className="sr-only">
                  {`${estDéroulé ? "Replier" : "Déplier"} ${ministère}`}
                </span>
                <Icone
                  className="!text-current"
                  icone={estDéroulé ? ArrowSLineIcon : ArrowSLine2Icon}
                />
              </button>
            );
          },
          meta: {
            width: "3.5rem",
            label: "Déplier le groupe",
          },
        }),
      ]),
    [chantiersSontArchives, jalon],
  );

  const [mailleSelectionnee] = useQueryState(
    "maille",
    parseAsStringLiteral(["departementale", "regionale"]).withDefault(
      "departementale",
    ),
  );

  const table = accueilChantiers.useDataTable({
    data: données,
    columns: colonnesTableauChantiers,
    rowHeader: "nom",
    getRowHref: (row) => {
      const mailleRedirection =
        !row.original.maillesApplicables.includes("departementale") &&
        row.original.maillesApplicables.includes("regionale")
          ? "regionale"
          : mailleSelectionnee;
      return `/chantier/${row.original.id}/${territoireCode}?maille=${mailleRedirection}&jalon=${jalon}`;
    },
    tile: (row) =>
      row.getIsGrouped() ? (
        <button
          aria-expanded={row.getIsExpanded()}
          className="w-full text-left"
          onClick={row.getToggleExpandedHandler()}
          type="button"
        >
          <TableauChantiersTuileMinistère
            estArchive={chantiersSontArchives}
            estDéroulé={row.getIsExpanded()}
            ministère={{
              nom: row.original.porteur?.nom ?? "",
              icône: row.original.porteur?.icône ?? null,
              avancement: calculerMoyenne(
                row.getLeafRows().map((feuille) => feuille.original.avancement),
              ),
            }}
          />
        </button>
      ) : (
        <TableauChantiersTuileChantier
          afficherIcône={regroupement.length === 0}
          chantier={row.original}
          chantiersSontArchives={chantiersSontArchives}
        />
      ),
    tileBreakpoint: "lg",
    tileLabel: (row) => row.original.nom ?? "",
    manualPagination: true,
    manualSorting: true,
    enableSorting: false,
    manualFiltering: true,
    rowCount: nombreTotalChantiersAvecAlertes,
    autoResetExpanded: false,
    onExpandedChange: setExpanded,
    state: {
      grouping: regroupement,
      expanded,
      columnVisibility: {
        porteur: false,
        "dérouler-groupe": estGroupe,
      },
    },
    urlState: {
      sorting: {
        default: [TRI_CHANTIERS_PAR_DEFAUT],
        labels: LIBELLES_TRI_CHANTIERS,
      },
      pagination: { pageSize: 50 },
      globalFilter: true,
      shallow: false,
      history: "push",
      throttleMs: 200,
    },
  });

  return {
    table,
    changementDeLaRechercheCallback: (event: ChangeEvent<HTMLInputElement>) =>
      table.setGlobalFilter(event.target.value),
    valeurDeLaRecherche: table.store.state.globalFilter ?? "",
  };
};

export type ChantiersTable = ReturnType<typeof useTableauChantiers>["table"];
