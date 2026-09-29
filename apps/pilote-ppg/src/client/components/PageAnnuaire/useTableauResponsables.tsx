import { useMemo } from "react";
import { parseAsStringLiteral, useQueryState } from "nuqs";
import { filterFnOneOf } from "@/components/shared/DataTable/filterFns";
import type { FilterOption } from "@/components/shared/DataTable/types";
import type { AnnuaireResponsables } from "@/server/annuaire/queries/ListerResponsablesAnnuaireQuery";
import { BadgeNiveau } from "./cellules/BadgeNiveau";
import { BlocPersonne } from "./cellules/BlocPersonne";
import { CelluleTerritoire } from "./cellules/CelluleTerritoire";
import { ListeAffectations, ListePersonnes } from "./cellules/Listes";
import { tableauAnnuaire } from "./featuresAnnuaire";
import {
  cleCouple,
  clePersonne,
  comparerChantiersPuisTerritoires,
  comparerPersonnes,
  type FiltreAvecGroupes,
  filtreChantiers,
  filtreTerritoires,
  type LigneResponsable,
  lignesResponsables,
  nomComplet,
} from "./lignesAnnuaire";
import { tuileAnnuaire } from "./tuileAnnuaire";

export const REGROUPEMENTS_RESPONSABLES = [
  { value: "couple", label: "Chantier et territoire" },
  { value: "responsable", label: "Responsable" },
] as const;

export type RegroupementResponsables =
  (typeof REGROUPEMENTS_RESPONSABLES)[number]["value"];

const VALEURS_REGROUPEMENT = REGROUPEMENTS_RESPONSABLES.map(
  (regroupement) => regroupement.value,
);
const REGROUPEMENT_PAR_DEFAUT: RegroupementResponsables = "couple";

const COLONNES_VISIBLES: Record<RegroupementResponsables, string[]> = {
  couple: ["couple", "territoire", "niveau", "responsables"],
  responsable: ["responsable", "chantiersTerritoires"],
};
const COLONNES = [
  "couple",
  "territoire",
  "niveau",
  "responsables",
  "responsable",
  "chantiersTerritoires",
  "filtreTerritoire",
  "filtreChantier",
];

const visibilite = (regroupement: RegroupementResponsables) =>
  Object.fromEntries(
    COLONNES.map((colonne) => [
      colonne,
      COLONNES_VISIBLES[regroupement].includes(colonne),
    ]),
  );

const champsRecherche = (ligne: LigneResponsable) => [
  ligne.chantier.nom,
  ligne.territoire.nom,
  ligne.territoire.regionNom,
  nomComplet(ligne.personne),
  ligne.personne.email,
  ligne.personne.fonction ?? "",
];

const columnHelper = tableauAnnuaire.createColumnHelper<LigneResponsable>();

// Seules les lignes de groupe sont affichées : chaque `cell` lit `row.original`
// (première affectation du groupe) ou `row.subRows` (toutes ses affectations).
const useColonnes = (
  filtreTerritoire: FiltreAvecGroupes,
  optionsChantiers: FilterOption[],
) =>
  useMemo(
    () =>
      columnHelper.columns([
        columnHelper.accessor((ligne) => cleCouple(ligne), {
          id: "couple",
          header: "Chantier",
          enableSorting: true,
          sortFn: (ligneA, ligneB) =>
            comparerChantiersPuisTerritoires(ligneA.original, ligneB.original),
          cell: ({ row }) => (
            <span className="text-sm font-medium">
              {row.original.chantier.nom}
            </span>
          ),
        }),
        columnHelper.display({
          id: "territoire",
          header: "Territoire",
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
          id: "responsables",
          header: "Responsables et adresses e-mail",
          cell: ({ row }) => (
            <ListePersonnes
              personnes={row.subRows
                .map((sousLigne) => sousLigne.original.personne)
                .sort(comparerPersonnes)}
            />
          ),
        }),
        columnHelper.accessor((ligne) => clePersonne(ligne.personne), {
          id: "responsable",
          header: "Responsable et adresse e-mail",
          enableSorting: true,
          sortFn: (ligneA, ligneB) =>
            comparerPersonnes(
              ligneA.original.personne,
              ligneB.original.personne,
            ),
          cell: ({ row }) => <BlocPersonne personne={row.original.personne} />,
        }),
        columnHelper.display({
          id: "chantiersTerritoires",
          header: "Chantiers et territoires",
          cell: ({ row }) => (
            <ListeAffectations
              affectations={row.subRows
                .map((sousLigne) => sousLigne.original)
                .sort(comparerChantiersPuisTerritoires)}
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
              options: filtreTerritoire.options,
              groups: filtreTerritoire.groups,
            },
          },
        }),
        columnHelper.accessor((ligne) => ligne.chantier.id, {
          id: "filtreChantier",
          header: "Chantier",
          filterFn: filterFnOneOf,
          meta: {
            filter: {
              type: "multiselect",
              label: "Chantier",
              options: optionsChantiers,
            },
          },
        }),
      ]),
    [filtreTerritoire, optionsChantiers],
  );

export const useTableauResponsables = (
  donnees: AnnuaireResponsables | undefined,
) => {
  const lignes = useMemo(
    () => (donnees ? lignesResponsables(donnees) : []),
    [donnees],
  );
  const filtreTerritoire = useMemo(
    () => filtreTerritoires(lignes.map((ligne) => ligne.territoire)),
    [lignes],
  );
  const optionsChantiers = useMemo(
    () => filtreChantiers(lignes.map((ligne) => ligne.chantier)),
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
    columns: useColonnes(filtreTerritoire, optionsChantiers),
    rowHeader: regroupement,
    search: champsRecherche,
    tile: tuileAnnuaire,
    tileBreakpoint: "lg",
    tileLabel: (row) =>
      regroupement === "couple"
        ? `${row.original.chantier.nom} · ${row.original.territoire.nom}`
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
      columnFilters: [
        { param: "territoire", columnId: "filtreTerritoire" },
        { param: "chantier", columnId: "filtreChantier" },
      ],
      shallow: true,
      history: "replace",
    },
  });

  return { table, regroupement };
};
