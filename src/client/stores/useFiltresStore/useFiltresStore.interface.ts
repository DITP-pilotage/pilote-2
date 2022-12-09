import PérimètreMinistériel from '@/server/domain/périmètreMinistériel/périmètreMinistériel.interface';

interface FiltresActifs {
  périmètresMinistériels: Array<PérimètreMinistériel['id']>
}

export default interface FiltresStore {
  filtresActifs: FiltresActifs
  actions: {
    activerUnFiltre: (id: PérimètreMinistériel['id'], catégorieDeFiltre: keyof FiltresActifs) => void
    désactiverUnFiltre: (id: PérimètreMinistériel['id'], catégorieDeFiltre: keyof FiltresActifs) => void
    estActif: (id: PérimètreMinistériel['id'], catégorieDeFiltre: keyof FiltresActifs) => boolean
    récupérerNombreFiltresActifsDUneCatégorie: ( catégorieDeFiltre: keyof FiltresActifs) => number
  }
}
