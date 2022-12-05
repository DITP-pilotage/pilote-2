export default interface FixtureInterface<T> {
  générer(valeursFixes: Partial<T>): T
  générerPlusieurs(quantité: number, valeursFixes: Partial<T>[]): T[]
}
