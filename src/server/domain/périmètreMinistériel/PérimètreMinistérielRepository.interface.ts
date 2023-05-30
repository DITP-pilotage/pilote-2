import PérimètreMinistériel from './PérimètreMinistériel.interface';

export default interface PérimètreMinistérielRepository {
  récupérer(id: string): Promise<PérimètreMinistériel>
  récupérerListe(ids: string[]): Promise<PérimètreMinistériel[]>
  récupérerTous(): Promise<PérimètreMinistériel[]>
}
