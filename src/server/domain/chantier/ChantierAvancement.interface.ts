export interface Avancement {
  minimum: number,
  médiane: number,
  moyenne: number,
  maximum: number,
}

export default interface ChantierAvancements {
  annuel: Avancement | null,
  global: Avancement | null,
}
