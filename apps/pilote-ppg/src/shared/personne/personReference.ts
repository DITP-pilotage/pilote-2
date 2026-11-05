export type ResolvedPerson = {
  id: string;
  prenom: string;
  nom: string;
  email: string;
  service: string | null;
  fonction: string | null;
  estDesactive: boolean;
};

// Same tolerance as remarkChantierLinks: an openweight model does not stick
// to the ASCII hyphen inside identifiers.
const DASHES = "-‐‑‒–—−";
const DASH = `[${DASHES}]`;
const UUID = `[0-9a-f]{8}(?:${DASH}[0-9a-f]{4}){3}${DASH}[0-9a-f]{12}`;
const REFERENCE = `@\\[personne:(${UUID})\\]`;

export const PERSON_REFERENCE_PATTERN = new RegExp(REFERENCE, "gi");
const ONLY_REFERENCE_PATTERN = new RegExp(`^${REFERENCE}$`, "i");

export const personReference = (id: string): string => `@[personne:${id}]`;

export const normalizePersonId = (raw: string): string =>
  raw.replace(new RegExp(DASH, "g"), "-").toLowerCase();

export const isOnlyPersonReference = (text: string): string | null => {
  const match = ONLY_REFERENCE_PATTERN.exec(text.trim());
  return match ? normalizePersonId(match[1]) : null;
};

export const replacePersonReferences = (
  text: string,
  replace: (id: string) => string,
): string =>
  text.replace(PERSON_REFERENCE_PATTERN, (_reference, id: string) =>
    replace(normalizePersonId(id)),
  );

export const formatPerson = (
  person: ResolvedPerson | null | undefined,
): string => {
  if (!person) return "une personne";
  const nomComplet = `${person.prenom} ${person.nom}`;
  return person.estDesactive ? `${nomComplet} (désactivé)` : nomComplet;
};
