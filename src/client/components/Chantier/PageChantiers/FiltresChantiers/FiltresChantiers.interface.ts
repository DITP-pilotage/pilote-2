import PérimètreMinistériel from '@/server/domain/périmètreMinistériel/périmètreMinistériel.interface';

export default interface FiltresChantiersProps {
  estOuvert: boolean,
  setEstOuvert: (state: boolean) => void,
  périmètresMinistériels: PérimètreMinistériel[]
}
