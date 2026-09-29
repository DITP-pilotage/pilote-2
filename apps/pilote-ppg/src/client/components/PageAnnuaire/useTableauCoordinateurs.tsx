import { useMemo } from "react";
import { parseAsStringLiteral, useQueryState } from "nuqs";
import { filterFnOneOf } from "@/components/shared/DataTable/filterFns";
import type { AnnuaireCoordinateurs } from "@/server/annuaire/queries/ListerCoordinateursAnnuaireQuery";
import { BadgeNiveau } from "./cellules/BadgeNiveau";
import { BlocPersonne } from "./cellules/BlocPersonne";
import { CelluleTerritoire } from "./cellules/CelluleTerritoire";
import { ListePersonnes, ListeTerritoires } from "./cellules/Listes";
import { tableauAnnuaire } from "./featuresAnnuaire";
import {
  clePersonne,
  cleTerritoire,
  type FiltreAvecGroupes,
  type LigneCoordinateur,
  filtreTerritoires,
  lignesCoordinateurs,
} from "./lignesAnnuaire";
import { tuileAnnuaire } from "./tuileAnnuaire";

export const REGROUPEMENTS_COORDINATEURS = [
  { value: "territoire", label: "Territoire" },
  { value: "coordinateur", label: "Coordinateur" },
] as const;

export type RegroupementCoordinateurs =
  (typeof REGROUPEMENTS_COORDINATEURS)[number]["value"];

const VALEURS_REGROUPEMENT = REGROUPEMENTS_COORDINATEURS.map(
  (regroupement) => regroupement.value,
);
const REGROUPEMENT_PAR_DEFAUT: RegroupementCoordinateurs = "territoire";

const COLONNES_VISIBLES: Record<RegroupementCoordinateurs, string[]> = {
  territoire: ["territoire", "niveau", "coordinateurs"],
  coordinateur: ["coordinateur", "territoires"],
};
const COLONNES = [
  "territoire",
  "niveau",
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
  ligne.personne.prenom,
  ligne.personne.nom,
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
          cell: ({ row }) => (
            <CelluleTerritoire territoire={row.original.territoire} />
          ),
        }),
        columnHelper.display({
          id: "niveau",
          header: "Niveau",
          cell: ({ row }) => (
            <BadgeNiveau maille={row.original.territoire.maille} />
          ),
        }),
        columnHelper.display({
          id: "coordinateurs",
          header: "Coordinateurs et adresses e-mail",
          cell: ({ row }) => (
            <ListePersonnes
              personnes={row.subRows.map(
                (sousLigne) => sousLigne.original.personne,
              )}
            />
          ),
        }),
        columnHelper.accessor((ligne) => clePersonne(ligne.personne), {
          id: "coordinateur",
          header: "Coordinateur et adresse e-mail",
          enableSorting: true,
          cell: ({ row }) => <BlocPersonne personne={row.original.personne} />,
        }),
        columnHelper.display({
          id: "territoires",
          header: "Territoires",
          cell: ({ row }) => (
            <ListeTerritoires
              territoires={row.subRows.map(
                (sousLigne) => sousLigne.original.territoire,
              )}
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
        : `${row.original.personne.prenom} ${row.original.personne.nom}`,
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
