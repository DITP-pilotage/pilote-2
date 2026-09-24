import { useMemo, useState } from "react";
import {
  aggregationFn_max,
  columnFilteringFeature,
  columnGroupingFeature,
  createColumnHelper,
  createFilteredRowModel,
  createGroupedRowModel,
  createSortedRowModel,
  filterFn_arrIncludes,
  filterFn_equalsString,
  globalFilteringFeature,
  rowAggregationFeature,
  rowExpandingFeature,
  rowSortingFeature,
  sortFn_basic,
  tableFeatures,
  useTable,
  type ExpandedState,
  type Row,
} from "@tanstack/react-table";
import { type $Enums } from "@prisma/client";
import type { IndicateurNonAJour } from "@/server/suivi-indicateurs/domain/IndicateursAMettreAJour";

export const featuresIndicateursNonAJour = tableFeatures({
  columnFilteringFeature,
  globalFilteringFeature,
  rowSortingFeature,
  columnGroupingFeature,
  rowAggregationFeature,
  rowExpandingFeature,
  filteredRowModel: createFilteredRowModel(),
  groupedRowModel: createGroupedRowModel(),
  sortedRowModel: createSortedRowModel(),
});

export type LigneIndicateurNonAJour = Row<
  typeof featuresIndicateursNonAJour,
  IndicateurNonAJour
>;

const normaliser = (texte: string) =>
  texte.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

const columnHelper = createColumnHelper<
  typeof featuresIndicateursNonAJour,
  IndicateurNonAJour
>();

const colonnes = columnHelper.columns([
  columnHelper.accessor("chantierId", {
    id: "chantier",
    filterFn: filterFn_equalsString,
  }),
  columnHelper.accessor("nom", { id: "nom" }),
  columnHelper.accessor("mailles", {
    id: "mailles",
    filterFn: filterFn_arrIncludes,
    enableGlobalFilter: false,
  }),
  columnHelper.accessor(
    (indicateur) => indicateur.retardMaxJours ?? undefined,
    {
      id: "retard",
      aggregationFn: aggregationFn_max,
      sortFn: sortFn_basic,
      sortUndefined: "last",
      enableGlobalFilter: false,
    },
  ),
]);

export const useTableauIndicateursNonAJour = (
  indicateurs: IndicateurNonAJour[],
) => {
  const [recherche, setRecherche] = useState("");
  const [chantierFiltre, setChantierFiltre] = useState<string | null>(null);
  const [mailleFiltre, setMailleFiltre] = useState<$Enums.Maille | null>(null);
  const [expanded, setExpanded] = useState<ExpandedState>({});

  const columnFilters = useMemo(
    () => [
      ...(chantierFiltre ? [{ id: "chantier", value: chantierFiltre }] : []),
      ...(mailleFiltre ? [{ id: "mailles", value: [mailleFiltre] }] : []),
    ],
    [chantierFiltre, mailleFiltre],
  );

  const optionsChantiers = useMemo(
    () =>
      [
        ...new Map(
          indicateurs.map((indicateur) => [
            indicateur.chantierId,
            indicateur.chantierNom,
          ]),
        ),
      ]
        .map(([id, nom]) => ({ id, nom }))
        .sort((gauche, droite) => gauche.nom.localeCompare(droite.nom)),
    [indicateurs],
  );

  const tableau = useTable({
    features: featuresIndicateursNonAJour,
    data: indicateurs,
    columns: colonnes,
    getRowId: (indicateur) => indicateur.indicateurId,
    state: {
      globalFilter: recherche,
      columnFilters,
      grouping: ["chantier"],
      sorting: [{ id: "retard", desc: true }],
      expanded,
    },
    globalFilterFn: (
      row: LigneIndicateurNonAJour,
      _columnId: string,
      texteRecherche: string,
    ) =>
      normaliser(`${row.original.indicateurId} ${row.original.nom}`).includes(
        normaliser(texteRecherche),
      ),
    onExpandedChange: setExpanded,
    getRowCanExpand: (row) => !row.getIsGrouped(),
    autoResetExpanded: false,
  });

  return {
    tableau,
    recherche,
    setRecherche,
    chantierFiltre,
    setChantierFiltre,
    mailleFiltre,
    setMailleFiltre,
    optionsChantiers,
  };
};
