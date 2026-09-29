import { useMemo } from "react";
import { parseAsStringLiteral, useQueryState } from "nuqs";
import { filterFnOneOf } from "@/components/shared/DataTable/filterFns";
import type { AnnuaireCoordinateurs } from "@/server/annuaire/queries/ListerCoordinateursAnnuaireQuery";
import { BlocPersonne } from "./cellules/BlocPersonne";
import { CelluleTerritoire } from "./cellules/CelluleTerritoire";
import { ListePersonnes, ListeTerritoires } from "./cellules/Listes";
import { tableauAnnuaire } from "./featuresAnnuaire";
import {
  clePersonne,
  cleTerritoire,
  comparerPersonnes,
  comparerTerritoires,
  type FiltreAvecGroupes,
  type LigneCoordinateur,
  filtreTerritoires,
  lignesCoordinateurs,
  nomComplet,
} from "./lignesAnnuaire";
import { tuileAnnuaire } from "./tuileAnnuaire";

export const REGROUPEMENTS_COORDINATEURS = [
  {
    value: "territoire",
    label: "Territoire",
    aide: "Une ligne par territoire, avec tous ses coordinateurs.",
  },
  {
    value: "coordinateur",
    label: "Coordinateur",
    aide: "Une ligne par coordinateur, avec tous ses territoires.",
  },
] as const;

export type RegroupementCoordinateurs =
  (typeof REGROUPEMENTS_COORDINATEURS)[number]["value"];

const VALEURS_REGROUPEMENT = REGROUPEMENTS_COORDINATEURS.map(
  (regroupement) => regroupement.value,
);
const REGROUPEMENT_PAR_DEFAUT: RegroupementCoordinateurs = "territoire";

const COLONNES_VISIBLES: Record<RegroupementCoordinateurs, string[]> = {
  territoire: ["territoire", "coordinateurs"],
  coordinateur: ["coordinateur", "territoires"],
};
const COLONNES = [
  "territoire",
  "coordinateurs",
  "coordinateur",
  "territoires",
  "filtreTerritoire",
];

const visibilite = (regroupement: RegroupementCoordinateurs) =>
  Object.fromEntries(
    COLONNES.map((colonne) => [
      colonne,
      COLONNES_VISIBLES[regroupement].includes(colonne),
    ]),
  );

const champsRecherche = (ligne: LigneCoordinateur) => [
  ligne.territoire.nom,
  ligne.territoire.regionNom,
  nomComplet(ligne.personne),
  ligne.personne.email,
  ligne.personne.fonction ?? "",
];

const columnHelper = tableauAnnuaire.createColumnHelper<LigneCoordinateur>();

// Seules les lignes de groupe sont affichées : chaque `cell` lit `row.original`
// (première affectation du groupe) ou `row.subRows` (toutes ses affectations).
const useColonnes = (filtre: FiltreAvecGroupes) =>
  useMemo(
    () =>
      columnHelper.columns([
        columnHelper.accessor((ligne) => cleTerritoire(ligne.territoire), {
          id: "territoire",
          header: "Territoire",
          enableSorting: true,
          meta: { width: "32%" },
          sortFn: (ligneA, ligneB) =>
            comparerTerritoires(
              ligneA.original.territoire,
              ligneB.original.territoire,
            ),
          cell: ({ row }) => (
            <CelluleTerritoire territoire={row.original.territoire} />
          ),
        }),
        columnHelper.display({
          id: "coordinateurs",
          header: "Coordinateurs et adresses e-mail",
          meta: { width: "68%" },
          cell: ({ row }) => (
            <ListePersonnes
              personnes={row.subRows
                .map((sousLigne) => sousLigne.original.personne)
                .sort(comparerPersonnes)}
            />
          ),
        }),
        columnHelper.accessor((ligne) => clePersonne(ligne.personne), {
          id: "coordinateur",
          header: "Coordinateur et adresse e-mail",
          enableSorting: true,
          meta: { width: "36%" },
          sortFn: (ligneA, ligneB) =>
            comparerPersonnes(
              ligneA.original.personne,
              ligneB.original.personne,
            ),
          cell: ({ row }) => <BlocPersonne personne={row.original.personne} />,
        }),
        columnHelper.display({
          id: "territoires",
          header: "Territoires",
          meta: { width: "64%" },
          cell: ({ row }) => (
            <ListeTerritoires
              territoires={row.subRows
                .map((sousLigne) => sousLigne.original.territoire)
                .sort(comparerTerritoires)}
            />
          ),
        }),
        columnHelper.accessor((ligne) => ligne.territoire.code, {
          id: "filtreTerritoire",
          header: "Territoire",
          filterFn: filterFnOneOf,
          meta: {
            filter: {
              type: "multiselect",
              label: "Territoire",
              options: filtre.options,
              groups: filtre.groups,
            },
          },
        }),
      ]),
    [filtre],
  );

export const useTableauCoordinateurs = (
  donnees: AnnuaireCoordinateurs | undefined,
) => {
  const lignes = useMemo(
    () => (donnees ? lignesCoordinateurs(donnees) : []),
    [donnees],
  );
  const filtre = useMemo(
    () => filtreTerritoires(lignes.map((ligne) => ligne.territoire)),
    [lignes],
  );
  const [regroupement] = useQueryState(
    "groupement",
    parseAsStringLiteral(VALEURS_REGROUPEMENT).withDefault(
      REGROUPEMENT_PAR_DEFAUT,
    ),
  );

  const table = tableauAnnuaire.useDataTable({
    data: lignes,
    columns: useColonnes(filtre),
    rowHeader: regroupement,
    search: champsRecherche,
    tile: tuileAnnuaire,
    tileBreakpoint: "lg",
    tileLabel: (row) =>
      regroupement === "territoire"
        ? row.original.territoire.nom
        : nomComplet(row.original.personne),
    state: { columnVisibility: visibilite(regroupement) },
    urlState: {
      grouping: {
        param: "groupement",
        default: REGROUPEMENT_PAR_DEFAUT,
        values: VALEURS_REGROUPEMENT,
      },
      sorting: { default: [{ id: regroupement, desc: false }] },
      pagination: { pageSize: 20 },
      globalFilter: true,
      columnFilters: [{ param: "territoire", columnId: "filtreTerritoire" }],
      shallow: true,
      history: "replace",
    },
  });

  return { table, regroupement };
};
