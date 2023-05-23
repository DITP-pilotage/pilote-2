import ObjectifProjetStructurant from './Objectif.interface';

export default interface ObjectifProjetStructurantRepository {
  récupérerLePlusRécent(projetStructurantId: string): Promise<ObjectifProjetStructurant>
  créer(projetStructurantId: string, id: string, contenu: string, auteur: string, date: Date): Promise<ObjectifProjetStructurant>
  récupérerHistorique(projetStructurantId: string): Promise<ObjectifProjetStructurant[]>
}
