import { PerimetreMinisteriel  } from './PerimetreMinisteriel.interface';

export interface PerimetreMinisterielRepository {
  récupérerTous(): Promise<PerimetreMinisteriel[]>
}
