import PérimètreMinistériel from '@/server/domain/périmètreMinistériel/PérimètreMinistériel.interface';

export default interface PérimètreMinistérielRepository {
  add(périmètre: PérimètreMinistériel): Promise<void>;
  getListe(): Promise<PérimètreMinistériel[]>;
}
