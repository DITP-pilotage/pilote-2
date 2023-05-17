import ProjetStructurant from './ProjetStructurant.interface';

export default interface ProjetStructurantRepository {
  récupérer(id: string): Promise<ProjetStructurant>;
  récupérerListe(): Promise<ProjetStructurant[]>;
}
