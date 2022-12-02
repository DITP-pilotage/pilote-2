import PérimètreMinistériel from 'server/domain/périmètreMinistériel/périmètreMinistériel.interface';

export default interface SélecteurMultipleProps {
  libellé: string
  périmètresMinistériels: PérimètreMinistériel[]
}
