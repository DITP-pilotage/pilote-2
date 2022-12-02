import PérimètreMinistériel from 'server/domain/périmètreMinistériel/périmètreMinistériel.interface';

interface FiltresActifs {
  périmètresMinistériels: Array<PérimètreMinistériel['id']>
}

export default interface FiltresStore {
  filtresActifs: FiltresActifs
  activerUnFiltre: (id: PérimètreMinistériel['id'], catégorieDeFiltre: keyof FiltresActifs) => void
  désactiverUnFiltre: (id: PérimètreMinistériel['id'], catégorieDeFiltre: keyof FiltresActifs) => void
}
