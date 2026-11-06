import {
  columnFilteringFeature,
  columnGroupingFeature,
  createExpandedRowModel,
  createFilteredRowModel,
  createGroupedRowModel,
  globalFilteringFeature,
  rowExpandingFeature,
  tableFeatures,
} from "@tanstack/react-table";
import { useMemo, useState } from "react";
import { filtreTerritoires } from "@/client/utils/territoire/filtreTerritoires";
import { CelluleIndicateursACompleter } from "@/components/_commons/ChatUI/CelluleIndicateursACompleter";
import {
  colonnesDetail,
  libelleChantier,
  libelleTerritoire,
  lignesDetail,
  type LigneDetail,
} from "@/components/_commons/ChatUI/detailIndicateursACompleter";
import { createDataTableHook } from "@/components/shared/DataTable/createDataTableHook";
import { filterFnOneOf } from "@/components/shared/DataTable/filterFns";
import type {
  FilterDescriptor,
  FilterOption,
} from "@/components/shared/DataTable/types";
import type { DetailIndicateursACompleter } from "@/server/albert/tools/sortieIndicateursACompleter";

const tableauIndicateursACompleter = createDataTableHook(
  tableFeatures({
    columnFilteringFeature,
    globalFilteringFeature,
    columnGroupingFeature,
    rowExpandingFeature,
    filteredRowModel: createFilteredRowModel(),
    groupedRowModel: createGroupedRowModel(),
    expandedRowModel: createExpandedRowModel(),
  }),
);

const REGROUPEMENTS = [
  { value: "chantier_indicateur", label: "Chantier › Indicateur" },
  { value: "indicateur", label: "Indicateur" },
  { value: "territoire", label: "Territoire" },
  { value: "motif", label: "Motif" },
  { value: "aucun", label: "Aucun" },
] as const;

export type Regroupement = (typeof REGROUPEMENTS)[number]["value"];

const COLONNES_REGROUPEES: Record<Regroupement, string[]> = {
  chantier_indicateur: ["chantier", "indicateur"],
  indicateur: ["indicateur"],
  territoire: ["territoire"],
  motif: ["motif"],
  aucun: [],
};

const IDENTIFIANTS: Partial<Record<string, (ligne: LigneDetail) => string>> = {
  chantier: (ligne) => ligne.chantier_id,
  indicateur: (ligne) => ligne.indicateur_id,
  territoire: (ligne) => ligne.territoire_code,
  motif: (ligne) => ligne.motif,
};

const champsRecherche = (ligne: LigneDetail) => [
  ligne.chantier_id,
  ligne.chantier_nom,
  ligne.indicateur_id,
  ligne.indicateur_nom,
  ligne.territoire_code,
  ligne.territoire_nom ?? "",
];

const optionsDistinctes = (valeurs: FilterOption[]) => [
  ...new Map(valeurs.map((option) => [option.value, option])).values(),
];

const filtre = (
  label: string,
  {
    options,
    groups,
  }: {
    options: FilterOption[];
    groups?: { label: string; values: string[] }[];
  },
): FilterDescriptor | undefined =>
  options.length > 1
    ? { type: "multiselect", label, options, ...(groups && { groups }) }
    : undefined;

// Les autres colonnes passent à la ligne pour tenir dans la largeur du chat.
const COLONNES_COURTES = [
  "motif",
  "derniere_va",
  "mise_a_jour_attendue_depuis",
  "derniere_vc_connue",
];

// Tableau en largeur fixe, marges intérieures en sus : indicateur et territoire se partagent le reste.
const LARGEURS: Partial<Record<string, string>> = {
  motif: "6.5rem",
  derniere_va: "5rem",
  mise_a_jour_attendue_depuis: "5rem",
  derniere_vc_connue: "5.5rem",
};

const columnHelper =
  tableauIndicateursACompleter.createColumnHelper<LigneDetail>();

const useColonnes = ({
  motifs,
  lignes,
}: {
  motifs: DetailIndicateursACompleter["motifs"];
  lignes: LigneDetail[];
}) =>
  useMemo(() => {
    const filtres: Partial<Record<string, FilterDescriptor>> = {
      chantier: filtre("Chantier", {
        options: optionsDistinctes(
          lignes.map((ligne) => ({
            value: ligne.chantier_id,
            label: libelleChantier(ligne),
          })),
        ),
      }),
      territoire: filtre(
        "Territoire",
        filtreTerritoires(
          lignes.map((ligne) => ({
            code: ligne.territoire_code,
            libelle: libelleTerritoire(ligne),
            maille: ligne.maille,
          })),
        ),
      ),
      motif: filtre("Motif", {
        options: optionsDistinctes(
          lignes.map((ligne) => ({ value: ligne.motif, label: ligne.motif })),
        ),
      }),
    };
    return columnHelper.columns(
      colonnesDetail({ motifs }).map((colonne) =>
        columnHelper.accessor(IDENTIFIANTS[colonne.id] ?? colonne.valeur, {
          id: colonne.id,
          header: colonne.titreCourt ?? colonne.titre,
          cell: ({ row }) => (
            <CelluleIndicateursACompleter
              colonne={colonne}
              ligne={row.original}
            />
          ),
          filterFn: filterFnOneOf,
          meta: {
            filter: filtres[colonne.id],
            width: LARGEURS[colonne.id],
            cellClassName: COLONNES_COURTES.includes(colonne.id)
              ? "whitespace-nowrap"
              : undefined,
          },
        }),
      ),
    );
  }, [motifs, lignes]);

export const useTableauIndicateursACompleter = (
  detail: DetailIndicateursACompleter,
) => {
  const lignes = useMemo(() => lignesDetail(detail), [detail]);
  const chantierIds = useMemo(
    () => [...new Set(lignes.map((ligne) => ligne.chantier_id))],
    [lignes],
  );
  const plusieursChantiers = chantierIds.length > 1;
  const regroupements = REGROUPEMENTS.filter(
    (regroupement) =>
      plusieursChantiers || regroupement.value !== "chantier_indicateur",
  );
  const [regroupement, setRegroupement] = useState<Regroupement>(
    plusieursChantiers ? "chantier_indicateur" : "indicateur",
  );
  const colonnesRegroupees = COLONNES_REGROUPEES[regroupement];

  const table = tableauIndicateursACompleter.useDataTable({
    data: lignes,
    columns: useColonnes({ motifs: detail.motifs, lignes }),
    search: champsRecherche,
    // Les colonnes regroupées sont masquées : l'ordre des colonnes et des filtres ne bouge pas.
    groupedColumnMode: false,
    initialState: {
      expanded: Object.fromEntries(
        chantierIds.map((chantierId) => [`chantier:${chantierId}`, true]),
      ),
    },
    state: {
      grouping: colonnesRegroupees,
      columnVisibility: Object.fromEntries([
        ["chantier", false],
        ...colonnesRegroupees.map((colonne) => [colonne, false]),
      ]),
    },
  });

  return {
    table,
    regroupement,
    regroupements,
    setRegroupement,
    niveauxRegroupement: colonnesRegroupees.length,
    avecChantierDansGroupe: regroupement === "indicateur" && plusieursChantiers,
  };
};
