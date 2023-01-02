import PérimètreMinistériel from '@/server/domain/périmètreMinistériel/PérimètreMinistériel.interface';

export default interface FiltresChantiersProps {
  estOuvert: boolean,
  setEstOuvert: (state: boolean) => void,
  périmètresMinistériels: PérimètreMinistériel[]
}
