export const pluralize = ({
  count,
  singular,
  plural,
}: {
  count: number
  singular: string
  plural: string
}): string => (count > 1 ? plural : singular)
