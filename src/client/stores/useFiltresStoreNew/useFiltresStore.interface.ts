export default interface FiltresStore {
  filtresActifs: {}
  actions: {
    désactiverUnFiltre: (id: string, catégorieDeFiltre: {}) => void
  }
}
