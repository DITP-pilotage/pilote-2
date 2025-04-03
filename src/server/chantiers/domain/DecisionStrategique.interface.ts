export const typesDecisionStrategique = ['suiviDesDécisionsStratégiques'] as const;
export type TypeDecisionStrategique = typeof typesDecisionStrategique[number];

export type DecisionStrategique = {
  id: string
  contenu: string
  date: string
  auteur: string
  type: TypeDecisionStrategique
} | null;
