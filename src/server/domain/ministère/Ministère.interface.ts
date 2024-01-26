import PérimètreMinistériel from '@/server/domain/périmètreMinistériel/PérimètreMinistériel.interface';

export default interface Ministère {
  id: string;
  acronyme: string;
  nom: string;
  périmètresMinistériels: PérimètreMinistériel[];
  icône: string | null;
}
