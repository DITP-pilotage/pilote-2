import PérimètreMinistériel from './PérimètreMinistériel.interface';

export default interface PérimètreMinistérielRepository {
  récupérer(id: string): Promise<PérimètreMinistériel>
}
