export interface Avancement {
  minimum: number | null,
  médiane: number | null,
  moyenne: number | null,
  maximum: number | null,
}

export default interface ChantierAvancements {
  annuel: Avancement | null,
  global: Avancement | null,
}
