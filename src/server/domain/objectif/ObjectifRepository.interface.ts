import Objectif from './Objectif.interface';

export default interface ObjectifRepository {
  récupérerLePlusRécent(chantierId: string): Promise<Objectif>
}
