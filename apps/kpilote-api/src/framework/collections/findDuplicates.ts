import { countBy } from 'es-toolkit'

// Les valeurs présentes plus d'une fois, chacune une seule fois, dans l'ordre de
// leur première apparition.
export const findDuplicates = (values: ReadonlyArray<string>): string[] =>
  Object.entries(countBy(values, (value) => value))
    .filter(([, count]) => count > 1)
    .map(([value]) => value)
