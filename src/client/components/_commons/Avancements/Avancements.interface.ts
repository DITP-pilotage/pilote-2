export type AvancementsStatistiques = {
  global: {
    moyenne: number | null,
    médiane: number | null | undefined,
    minimum: number | null | undefined,
    maximum: number | null | undefined
  },
  annuel: {
    moyenne: number | null,
  }
} | null;

export default interface AvancementsProps {
  avancements: AvancementsStatistiques
}
