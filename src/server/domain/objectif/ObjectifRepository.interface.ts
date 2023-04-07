import Objectif, { Objectifs } from './Objectif.interface';

export default interface ObjectifRepository {
  récupérerLePlusRécentPourChaqueType(chantierId: string): Promise<Objectifs>
  récupérerHistoriqueDUnObjectif(chantierId: string): Promise<Objectif[]>
}
