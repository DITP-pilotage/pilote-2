import PérimètreMinistériel from '@/server/domain/périmètreMinistériel/PérimètreMinistériel.interface';

export default interface PérimètreMinistérielRepository {
  getListe(): Promise<PérimètreMinistériel[]>;
}
