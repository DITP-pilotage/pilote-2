export type TypeDécisionStratégique = 'suivi_des_decisions';

type DécisionStratégique = {
  id: string
  contenu: string
  date: string
  auteur: string
  type: TypeDécisionStratégique
} | null;

export default DécisionStratégique;
