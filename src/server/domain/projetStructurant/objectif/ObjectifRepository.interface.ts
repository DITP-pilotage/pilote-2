import ObjectifProjetStructurant from './Objectif.interface';

export default interface ObjectifProjetStructurantRepository {
  récupérerLePlusRécent(projetStructurantId: string): Promise<ObjectifProjetStructurant>
}
