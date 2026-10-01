import couleursTailwind from "../../../tailwind.colors.js";

const COULEURS = new Map<string, string>([
  ["white", "#FFFFFF"],
  ["black", "#000000"],
  ...Object.entries(couleursTailwind),
]);

export function couleur(nom: string): string {
  if (nom.startsWith("#")) return nom;
  const valeur = COULEURS.get(nom);
  if (!valeur) throw new Error(`Couleur Tailwind inconnue : ${nom}`);
  return valeur;
}
