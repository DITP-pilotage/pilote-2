import type { GroupingState } from "@tanstack/react-table";

export const TAILLES_DE_PAGE_CHANTIERS = [1, 3, 5, 10];
export const TAILLE_DE_PAGE_CHANTIERS_PAR_DEFAUT = 3;

// Référence stable : un nouveau tableau à chaque rendu fait recalculer le row
// model groupé, qui remet alors la page courante à 0.
export const REGROUPEMENT_PAR_CHANTIER: GroupingState = ["chantier"];

export const normaliserRecherche = (texte: string) =>
  texte
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();

export const correspondALaRecherche = (
  indicateur: { indicateurId: string; nom: string },
  recherche: string,
) =>
  normaliserRecherche(`${indicateur.indicateurId} ${indicateur.nom}`).includes(
    normaliserRecherche(recherche),
  );

export const extraireOptionsChantiers = (
  indicateurs: { chantierId: string; chantierNom: string }[],
) =>
  [
    ...new Map(
      indicateurs.map((indicateur) => [
        indicateur.chantierId,
        indicateur.chantierNom,
      ]),
    ),
  ]
    .map(([id, nom]) => ({ id, nom }))
    .sort((gauche, droite) => gauche.nom.localeCompare(droite.nom));
