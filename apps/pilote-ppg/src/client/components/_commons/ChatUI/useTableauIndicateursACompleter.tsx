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
import { Badge, type BadgeVariant } from "@/components/shared/Badge";
import {
  type ColonneDetail,
  colonnesDetail,
  libelleChantier,
  libelleIndicateur,
  libelleTerritoire,
  lignesDetail,
  type LigneDetail,
} from "@/components/_commons/ChatUI/detailIndicateursACompleter";
import { createDataTableHook } from "@/components/shared/DataTable/createDataTableHook";
import { filterFnOneOf } from "@/components/shared/DataTable/filterFns";
import type { FilterDescriptor } from "@/components/shared/DataTable/types";
import type { DetailIndicateursACompleter } from "@/server/albert/tools/getIndicateursACompleter";
import type {
  LibelleMaille,
  LibelleMotif,
} from "@/server/albert/tools/indicateursACompleter";

const VARIANTES_MOTIF: Record<LibelleMotif, BadgeVariant> = {
  "VA non à jour": "warning",
  "VI manquante": "info",
  "VC manquante": "default",
};

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

export const pluriel = (
  nombre: number,
  singulier: string,
  plurielLibelle: string,
) => `${nombre} ${nombre > 1 ? plurielLibelle : singulier}`;

const nombreDistincts = (
  lignes: LigneDetail[],
  cle: (ligne: LigneDetail) => string,
) => new Set(lignes.map(cle)).size;

/** Le libellé d'une ligne de groupe : des nombres distincts, jamais de somme entre motifs ou mailles. */
export const libelleGroupe = ({
  colonne,
  lignes,
  avecChantier,
}: {
  colonne: string;
  lignes: LigneDetail[];
  avecChantier: boolean;
}): { libelle: string; details: string[] } => {
  const [premiere] = lignes;
  const indicateurs = pluriel(
    nombreDistincts(lignes, (ligne) => ligne.indicateur_id),
    "indicateur",
    "indicateurs",
  );
  const territoires = pluriel(
    nombreDistincts(lignes, (ligne) => ligne.territoire_code),
    "territoire",
    "territoires",
  );
  const chantiers = pluriel(
    nombreDistincts(lignes, (ligne) => ligne.chantier_id),
    "chantier",
    "chantiers",
  );
  if (colonne === "chantier")
    return {
      libelle: libelleChantier(premiere),
      details: [indicateurs, territoires],
    };
  if (colonne === "indicateur")
    return {
      libelle: libelleIndicateur(premiere),
      details: avecChantier
        ? [premiere.chantier_id, territoires]
        : [territoires],
    };
  if (colonne === "territoire")
    return {
      libelle: libelleTerritoire(premiere),
      details: [indicateurs, chantiers],
    };
  return { libelle: premiere.motif, details: [indicateurs, territoires] };
};

const optionsDistinctes = (valeurs: { value: string; label: string }[]) => [
  ...new Map(valeurs.map((option) => [option.value, option])).values(),
];

const filtre = (
  label: string,
  options: { value: string; label: string }[],
): FilterDescriptor | undefined =>
  options.length > 1 ? { type: "multiselect", label, options } : undefined;

const MAILLES_ORDONNEES: LibelleMaille[] = [
  "nationale",
  "régionale",
  "départementale",
];

const GROUPES_MAILLE: Record<LibelleMaille, string> = {
  nationale: "National",
  régionale: "Régions",
  départementale: "Départements",
};

const filtreTerritoires = (
  lignes: LigneDetail[],
): FilterDescriptor | undefined => {
  const options = optionsDistinctes(
    lignes.map((ligne) => ({
      value: ligne.territoire_code,
      label: libelleTerritoire(ligne),
    })),
  ).sort((gauche, droite) => gauche.label.localeCompare(droite.label, "fr"));
  if (options.length <= 1) return undefined;
  const mailleParCode = new Map(
    lignes.map((ligne) => [ligne.territoire_code, ligne.maille]),
  );
  return {
    type: "multiselect",
    label: "Territoire",
    options,
    groups: MAILLES_ORDONNEES.map((maille) => ({
      label: GROUPES_MAILLE[maille],
      values: options
        .filter((option) => mailleParCode.get(option.value) === maille)
        .map((option) => option.value),
    })).filter((groupe) => groupe.values.length > 0),
  };
};

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

const Cellule = ({
  colonne,
  ligne,
}: {
  colonne: ColonneDetail;
  ligne: LigneDetail;
}) => {
  if (colonne.id === "motif")
    return (
      <Badge
        className="normal-case"
        size="sm"
        variant={VARIANTES_MOTIF[ligne.motif]}
      >
        {ligne.motif}
      </Badge>
    );
  // Le chantier n'a pas de colonne dans le tableau : son code précède l'indicateur.
  if (colonne.id === "indicateur")
    return (
      <span
        className="block truncate"
        title={`${libelleChantier(ligne)} · ${libelleIndicateur(ligne)}`}
      >
        <span className="text-dsfr-mention-grey">{ligne.chantier_id}</span>{" "}
        {libelleIndicateur(ligne)}
      </span>
    );
  if (colonne.id === "territoire")
    return (
      <span className="block truncate" title={colonne.valeur(ligne)}>
        {colonne.valeur(ligne)}
      </span>
    );
  return colonne.valeur(ligne);
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
      chantier: filtre(
        "Chantier",
        optionsDistinctes(
          lignes.map((ligne) => ({
            value: ligne.chantier_id,
            label: libelleChantier(ligne),
          })),
        ),
      ),
      territoire: filtreTerritoires(lignes),
      motif: filtre(
        "Motif",
        optionsDistinctes(
          lignes.map((ligne) => ({ value: ligne.motif, label: ligne.motif })),
        ),
      ),
    };
    return columnHelper.columns(
      colonnesDetail({ motifs }).map((colonne) =>
        columnHelper.accessor(IDENTIFIANTS[colonne.id] ?? colonne.valeur, {
          id: colonne.id,
          header: colonne.titreCourt ?? colonne.titre,
          cell: ({ row }) => <Cellule colonne={colonne} ligne={row.original} />,
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

export type TableDetail = ReturnType<
  typeof useTableauIndicateursACompleter
>["table"];
