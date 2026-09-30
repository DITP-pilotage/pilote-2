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

function joindrePersonnes<Affectation extends { personneId: string }>({
  personnes,
  affectations,
}: {
  personnes: PersonneAnnuaire[];
  affectations: Affectation[];
}) {
  const personneParId = new Map(
    personnes.map((personne) => [personne.id, personne]),
  );
  return affectations.flatMap(({ personneId, ...affectation }) => {
    const personne = personneParId.get(personneId);
    return personne ? [{ personne, ...affectation }] : [];
  });
}

export const lignesCoordinateurs = (
  annuaire: AnnuaireCoordinateurs,
): LigneCoordinateur[] => joindrePersonnes(annuaire);

export const lignesResponsables = (
  annuaire: AnnuaireResponsables,
): LigneResponsable[] => joindrePersonnes(annuaire);

// Identifiants de regroupement : le tri est porté par les `comparer*` (sortFn des colonnes).
export const cleTerritoire = (territoire: TerritoireAnnuaire) =>
  territoire.code;

export const clePersonne = (personne: PersonneAnnuaire) => personne.id;

export const cleCouple = (ligne: LigneResponsable) =>
  `${ligne.chantier.id}|${ligne.territoire.code}`;

const collator = new Intl.Collator("fr", {
  sensitivity: "base",
  numeric: true,
});

// Régions d'abord, puis départements, chacun par nom (sans tenir compte de la casse ni des accents).
export const comparerTerritoires = (
  gauche: TerritoireAnnuaire,
  droite: TerritoireAnnuaire,
) =>
  Number(gauche.maille !== "REG") - Number(droite.maille !== "REG") ||
  collator.compare(gauche.nom, droite.nom) ||
  collator.compare(gauche.code, droite.code);

export const comparerPersonnes = (
  gauche: PersonneAnnuaire,
  droite: PersonneAnnuaire,
) =>
  collator.compare(gauche.nom, droite.nom) ||
  collator.compare(gauche.prenom, droite.prenom) ||
  collator.compare(gauche.id, droite.id);

export const comparerChantiersPuisTerritoires = (
  gauche: { chantier: ChantierAnnuaire; territoire: TerritoireAnnuaire },
  droite: { chantier: ChantierAnnuaire; territoire: TerritoireAnnuaire },
) =>
  collator.compare(gauche.chantier.nom, droite.chantier.nom) ||
  collator.compare(gauche.chantier.id, droite.chantier.id) ||
  comparerTerritoires(gauche.territoire, droite.territoire);

export const pluriel = (
  nombre: number,
  singulier: string,
  plurielMot: string,
) => `${nombre} ${nombre > 1 ? plurielMot : singulier}`;

export const nomComplet = (personne: PersonneAnnuaire) =>
  `${personne.prenom} ${personne.nom}`;

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
  ].sort(comparerTerritoires);
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
    .sort((gauche, droite) => collator.compare(gauche.nom, droite.nom))
    .map((chantier) => ({
      value: chantier.id,
      label: `${chantier.id} - ${chantier.nom}`,
    }));
}
