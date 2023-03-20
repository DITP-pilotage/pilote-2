export default interface AvancementsProps {
  avancements: {
    global: {
      moyenne: number | null,
      médiane: number | null,
      minimum: number | null,
      maximum: number | null
    },
    annuel: {
      moyenne: number | null,
    }
  }
}
