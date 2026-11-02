import tailwindColors from "../../../tailwind.colors.js";

function toLongHex(value: string): string {
  const shortHex = /^#([0-9a-f])([0-9a-f])([0-9a-f])$/i.exec(value);
  const longHex = shortHex
    ? `#${shortHex[1]}${shortHex[1]}${shortHex[2]}${shortHex[2]}${shortHex[3]}${shortHex[3]}`
    : value;
  return longHex.startsWith("#") ? longHex.toUpperCase() : longHex;
}

const COLORS = new Map<string, string>(
  [
    ["white", "#FFFFFF"],
    ["black", "#000000"],
    ...Object.entries(tailwindColors),
  ].map(([nom, valeur]) => [nom, toLongHex(valeur)]),
);

export function color(nom: string): string {
  if (nom.startsWith("#")) return nom;
  const valeur = COLORS.get(nom);
  if (!valeur) throw new Error(`Couleur Tailwind inconnue : ${nom}`);
  return valeur;
}

export function findColor(nom: string): string | null {
  if (nom.startsWith("#")) return nom;
  return COLORS.get(nom) ?? null;
}
