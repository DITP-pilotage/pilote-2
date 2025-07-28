import PérimètreMinistériel from "./PérimètreMinistériel.interface";

export default interface PérimètreMinistérielRepository {
  récupérerTous(): Promise<PérimètreMinistériel[]>;
}
