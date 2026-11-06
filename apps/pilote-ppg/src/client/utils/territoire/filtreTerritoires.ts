import type { $Enums } from "@prisma/client";
import type { FilterOption } from "@/components/shared/DataTable/types";

export type FiltreTerritoires = {
  options: FilterOption[];
  groups: { label: string; values: string[] }[];
};

const GROUPES: { maille: $Enums.Maille; label: string }[] = [
  { maille: "NAT", label: "National" },
  { maille: "REG", label: "Régions" },
  { maille: "DEPT", label: "Départements" },
];

const collator = new Intl.Collator("fr", {
  sensitivity: "base",
  numeric: true,
});

/** Les options d'un filtre de territoires, par libellé, regroupées de la maille la plus large à la plus fine. */
export function filtreTerritoires(
  territoires: { code: string; libelle: string; maille: $Enums.Maille }[],
): FiltreTerritoires {
  const uniques = [
    ...new Map(
      territoires.map((territoire) => [territoire.code, territoire]),
    ).values(),
  ].sort(
    (gauche, droite) =>
      collator.compare(gauche.libelle, droite.libelle) ||
      collator.compare(gauche.code, droite.code),
  );
  return {
    options: uniques.map((territoire) => ({
      value: territoire.code,
      label: territoire.libelle,
    })),
    groups: GROUPES.map(({ maille, label }) => ({
      label,
      values: uniques
        .filter((territoire) => territoire.maille === maille)
        .map((territoire) => territoire.code),
    })).filter((groupe) => groupe.values.length > 0),
  };
}
