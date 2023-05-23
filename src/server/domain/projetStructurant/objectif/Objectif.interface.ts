export const typeObjectifProjetStructurant = 'objectifs' as const;
export type TypeObjectifProjetStructurant = typeof typeObjectifProjetStructurant;

type ObjectifProjetStructurant = {
  id: string
  contenu: string
  date: string
  auteur: string
  type: TypeObjectifProjetStructurant
} | null;

export default ObjectifProjetStructurant;
