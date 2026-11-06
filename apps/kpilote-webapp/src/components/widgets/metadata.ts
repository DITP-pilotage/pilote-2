import { type IndividuMetadata } from '@pilote/kpilote-shared/individu'

// Valeur de jointure d'un individu avec une entité visuelle du widget : la
// propriété `joinKey` du widget (ex. `codeInsee`) lue dans `Individu.metadata`.
// Seules les chaînes non vides sont retenues.
export const parseJoinValue = ({
  metadata,
  joinKey,
}: {
  metadata: IndividuMetadata
  joinKey: string
}): string | null => {
  const valeur = metadata?.[joinKey]
  return typeof valeur === 'string' && valeur.length > 0 ? valeur : null
}
