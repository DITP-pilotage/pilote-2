import ObjectifProjetStructurant, { TypeObjectifProjetStructurant } from './Objectif.interface';

export default interface ObjectifProjetStructurantRepository {
  récupérerLePlusRécent(projetStructurantId: string): Promise<ObjectifProjetStructurant>
  récupérerHistorique(projetStructurantId: string, type: TypeObjectifProjetStructurant): Promise<ObjectifProjetStructurant[]>
  créer(projetStructurantId: string, id: string, contenu: string, auteur: string, type: TypeObjectifProjetStructurant, date: Date): Promise<ObjectifProjetStructurant>
}
