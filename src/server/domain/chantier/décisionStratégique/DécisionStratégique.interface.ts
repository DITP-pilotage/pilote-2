export const typesDécisionStratégique = [
  "suiviDesDécisionsStratégiques",
] as const;
export type TypeDécisionStratégique = (typeof typesDécisionStratégique)[number];

type DécisionStratégique = {
  id: string;
  contenu: string;
  date: string;
  auteur: string;
  type: TypeDécisionStratégique;
} | null;

export type DécisionStratégiqueV2 = {
  chantierId: string;
  id: string;
  contenu: string;
  type: TypeDécisionStratégique;
  auteur_id: string;
  date: Date;
};

export default DécisionStratégique;
