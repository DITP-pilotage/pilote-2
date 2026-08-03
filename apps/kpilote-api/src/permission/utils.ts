export const sortByOrder = <T>(items: T[], order: readonly T[]): T[] =>
  [...items].sort((a, b) => order.indexOf(a) - order.indexOf(b))
