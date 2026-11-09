import {
  PERSON_REFERENCE_PATTERN,
  normalizePersonId,
  personReference,
} from "@/shared/personne/personReference";

/**
 * Les personnes du monde des evals (PIL-1860). Albert ne voit jamais leur nom :
 * les outils lui donnent `@[personne:<id>]`, et l'interface affiche le nom à
 * la place. Les noms ne servent qu'au rapport, pour qu'une réponse se lise.
 *
 * Identifiants fixes, comme les chantiers : un cas se rejoue à la main, et un
 * cas attend une référence précise. Certains contiennent « -14 », « 15 » ou
 * « 2 » derrière une lettre, comme les écarts du monde territorial : un
 * contrôle qui lirait un écart dans une référence se trompe ici, pas en
 * production.
 */
export type EvalPerson = {
  id: string;
  prenom: string;
  nom: string;
  email: string;
};

export const PERSONNES = {
  /** Le compte DITP des evals, auteur de ce que le monde sème sans auteur. */
  agentDitp: {
    id: "5d0c9e2a-7b31-4c8e-a1f4-0e6b2d9c3a71",
    prenom: "Agathe",
    nom: "Delorme",
    email: "agathe.delorme@pilote.test",
  },
  /** Le compte du coordinateur territorial de Bretagne. */
  coordinateurBretagne: {
    id: "8a3e1f60-2c4d-4b9a-b7e5-6f0d1c2e9b48",
    prenom: "Loïc",
    nom: "Le Bihan",
    email: "loic.le-bihan@pilote.test",
  },
  directriceUrgences: {
    id: "c7e2ab1f-14d0-4f3a-15e3-2b8c0a4d6e13",
    prenom: "Claire",
    nom: "Morvan",
    email: "claire.morvan@pilote.test",
  },
  directeurUrgences: {
    id: "e41b7c2d-9a65-4e08-b315-7d2f6c1a0b94",
    prenom: "Bertrand",
    nom: "Aubry",
    email: "bertrand.aubry@pilote.test",
  },
  responsableLocalBretagne: {
    id: "1f6d3a9e-5c27-4b14-8e02-a9c4b7e5d316",
    prenom: "Yann",
    nom: "Le Goff",
    email: "yann.le-goff@pilote.test",
  },
  coordinatriceTerritorialeBretagne: {
    id: "9b2e4c71-d3a8-4f65-a0c9-3e7b1d5f2a80",
    prenom: "Nolwenn",
    nom: "Kerjean",
    email: "nolwenn.kerjean@pilote.test",
  },
  auteurSynthese: {
    id: "a6c1e8f3-4b2d-4a97-9c15-d0e3b6a2f7c4",
    prenom: "Erwan",
    nom: "Tanguy",
    email: "erwan.tanguy@pilote.test",
  },
  modificatriceSynthese: {
    id: "3d8f0b5c-6e14-4c2a-b9d7-1a5e8c3f0d62",
    prenom: "Sophie",
    nom: "Bernard",
    email: "sophie.bernard@pilote.test",
  },
  auteurCommentaire: {
    id: "f2a7d4e1-0c58-4b36-8a2f-b5e9c1d7a043",
    prenom: "Gwenaël",
    nom: "Riou",
    email: "gwenael.riou@pilote.test",
  },
  responsableDonnees: {
    id: "6e9c2b4a-a1f7-4d53-9e08-c4b2a6d9e115",
    prenom: "Marc",
    nom: "Rivière",
    email: "marc.riviere@pilote.test",
  },
  responsableLocalPaysDeLaLoire: {
    id: "b4d1f9a2-3e6c-4a8b-8d27-e0c5a3b1f986",
    prenom: "Hélène",
    nom: "Guérin",
    email: "helene.guerin@pilote.test",
  },
} satisfies Record<string, EvalPerson>;

/**
 * Un responsable des données sans compte : `get_indicateurs` ne renvoie que
 * les responsables dont l'adresse a un compte, celui-ci n'est jamais citable.
 */
export const EMAIL_SANS_COMPTE = "responsable.sans-compte@pilote.test";

export const referenceDe = (personne: EvalPerson): string =>
  personReference(personne.id);

const NOMS = new Map(
  Object.values(PERSONNES).map((personne) => [
    personne.id,
    `${personne.prenom} ${personne.nom}`,
  ]),
);

/**
 * Le texte du rapport : chaque référence suivie du nom qu'afficherait
 * l'interface, ou de « inconnue » pour une référence qu'aucune personne du
 * monde ne porte.
 */
export function avecNoms(text: string): string {
  return text.replace(
    PERSON_REFERENCE_PATTERN,
    (reference, id: string) =>
      `${reference} (${NOMS.get(normalizePersonId(id)) ?? "inconnue"})`,
  );
}
