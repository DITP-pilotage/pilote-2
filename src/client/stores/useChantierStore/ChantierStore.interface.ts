export default interface ChantierStore {
  id: number,  
  nom: string,
  axe: string,
  ppg: string,
  ministere: string
}

export interface ChantierState {
  chantiers: ChantierStore[],
  setChantiers: (chantiers: ChantierStore[]) => void
}