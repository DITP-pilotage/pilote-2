import tailwindColors from "../../../tailwind.colors.js";

const COLORS = new Map<string, string>([
  ["white", "#FFFFFF"],
  ["black", "#000000"],
  ...Object.entries(tailwindColors),
]);

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
