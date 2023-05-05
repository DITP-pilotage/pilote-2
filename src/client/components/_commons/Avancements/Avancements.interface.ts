export type AvancementsStatistiques = {
  global: {
    moyenne: number | null,
    médiane: number | null,
    minimum: number | null,
    maximum: number | null
  },
  annuel: {
    moyenne: number | null,
  }
} | null;

export default interface AvancementsProps {
  avancements: AvancementsStatistiques
}
