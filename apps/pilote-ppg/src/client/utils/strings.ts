import DOMPurify from "isomorphic-dompurify";

export function normaliserChaîneDeCaractères(chaîneDeCaractères: string) {
  return chaîneDeCaractères
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036F]/g, ""); // Enlève les diacritiques
}

/** Un texte en slug : minuscules sans accents, mots séparés par des tirets. */
export function slugifier({ texte }: { texte: string }) {
  return normaliserChaîneDeCaractères(texte)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function nettoyerUneChaîneDeCaractèresPourAffichageHTML(
  chaîneDeCaractères: string,
) {
  const chaîneDeCaractèresAvecBr = chaîneDeCaractères.replaceAll("\n", "<br/>");
  return DOMPurify.sanitize(chaîneDeCaractèresAvecBr);
}

export function commenceParUneVoyelle(chaîneDeCaractères: string) {
  const VOYELLES = ["a", "e", "i", "o", "u", "y"];
  return VOYELLES.includes(
    normaliserChaîneDeCaractères(chaîneDeCaractères).charAt(0),
  );
}
