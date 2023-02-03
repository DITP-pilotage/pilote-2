import PérimètreMinistériel from '@/server/domain/ministère/PérimètreMinistériel.interface';

export default interface Ministère {
  nom: string;
  périmètresMinistériels: PérimètreMinistériel[];
}
