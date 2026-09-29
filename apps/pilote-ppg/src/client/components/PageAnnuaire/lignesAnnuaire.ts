import type { AnnuaireCoordinateurs } from "@/server/annuaire/queries/ListerCoordinateursAnnuaireQuery";
import type {
  AnnuaireResponsables,
  ChantierAnnuaire,
} from "@/server/annuaire/queries/ListerResponsablesAnnuaireQuery";
import type {
  PersonneAnnuaire,
  TerritoireAnnuaire,
} from "@/server/annuaire/queries/personnesAnnuaire";
import type { FilterOption } from "@/components/shared/DataTable/types";

export type LigneCoordinateur = {
  personne: PersonneAnnuaire;
  territoire: TerritoireAnnuaire;
};

export type LigneResponsable = LigneCoordinateur & {
  chantier: ChantierAnnuaire;
};

const indexerParId = (personnes: PersonneAnnuaire[]) =>
  new Map(personnes.map((personne) => [personne.id, personne]));

export function lignesCoordinateurs({
  personnes,
  affectations,
}: AnnuaireCoordinateurs): LigneCoordinateur[] {
  const personneParId = indexerParId(personnes);
  return affectations.flatMap((affectation) => {
    const personne = personneParId.get(affectation.personneId);
    return personne ? [{ personne, territoire: affectation.territoire }] : [];
  });
}

export function lignesResponsables({
  personnes,
  affectations,
}: AnnuaireResponsables): LigneResponsable[] {
  const personneParId = indexerParId(personnes);
  return affectations.flatMap((affectation) => {
    const personne = personneParId.get(affectation.personneId);
    return personne
      ? [
          {
            personne,
            chantier: affectation.chantier,
            territoire: affectation.territoire,
          },
        ]
      : [];
  });
}

// Clés de regroupement ET de tri : une valeur unique par groupe, dans l'ordre d'affichage voulu.
export const cleTerritoire = (territoire: TerritoireAnnuaire) =>
  `${territoire.maille === "REG" ? 0 : 1}|${territoire.nom}|${territoire.code}`;

export const clePersonne = (personne: PersonneAnnuaire) =>
  `${personne.nom} ${personne.prenom}|${personne.id}`;

export const cleCouple = (ligne: LigneResponsable) =>
  `${ligne.chantier.nom}|${ligne.chantier.id}|${cleTerritoire(ligne.territoire)}`;

export type FiltreAvecGroupes = {
  options: FilterOption[];
  groups: { label: string; values: string[] }[];
};

export function filtreTerritoires(
  territoires: TerritoireAnnuaire[],
): FiltreAvecGroupes {
  const uniques = [
    ...new Map(
      territoires.map((territoire) => [territoire.code, territoire]),
    ).values(),
  ].sort((gauche, droite) =>
    cleTerritoire(gauche).localeCompare(cleTerritoire(droite), "fr"),
  );
  return {
    options: uniques.map((territoire) => ({
      value: territoire.code,
      label: territoire.nom,
    })),
    groups: [
      {
        label: "Régions",
        values: uniques
          .filter((territoire) => territoire.maille === "REG")
          .map((territoire) => territoire.code),
      },
      {
        label: "Départements",
        values: uniques
          .filter((territoire) => territoire.maille === "DEPT")
          .map((territoire) => territoire.code),
      },
    ],
  };
}

export function filtreChantiers(chantiers: ChantierAnnuaire[]): FilterOption[] {
  return [
    ...new Map(chantiers.map((chantier) => [chantier.id, chantier])).values(),
  ]
    .sort((gauche, droite) => gauche.nom.localeCompare(droite.nom, "fr"))
    .map((chantier) => ({ value: chantier.id, label: chantier.nom }));
}
