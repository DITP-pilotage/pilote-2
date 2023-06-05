export const typesDécisionStratégique = ['suiviDesDécisionsStratégiques'] as const;
export type TypeDécisionStratégique = typeof typesDécisionStratégique[number];

type DécisionStratégique = {
  id: string
  contenu: string
  date: string
  auteur: string
  type: TypeDécisionStratégique
} | null;

export default DécisionStratégique;
