import PérimètreMinistériel from '@/server/domain/périmètreMinistériel/PérimètreMinistériel.interface';

export default interface Ministère {
  nom: string;
  périmètresMinistériels: PérimètreMinistériel[];
  icône: string | null;
}
