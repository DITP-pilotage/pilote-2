// Les ids demandés qu'une requête n'a pas trouvés, sans doublon et triés, pour
// un message d'erreur stable.
export const findUnknown = ({
  requested,
  found,
}: {
  requested: ReadonlyArray<string>
  found: ReadonlyArray<string>
}): string[] => {
  const foundSet = new Set(found)
  return [...new Set(requested)].filter((id) => !foundSet.has(id)).sort()
}
