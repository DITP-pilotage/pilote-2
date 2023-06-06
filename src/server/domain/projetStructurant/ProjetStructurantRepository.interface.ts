import { ProjetStructurantPrismaVersDomaine } from './ProjetStructurant.interface';

export default interface ProjetStructurantRepository {
  récupérer(id: string): Promise<ProjetStructurantPrismaVersDomaine>;
  récupérerListe(): Promise<ProjetStructurantPrismaVersDomaine[]>;
}
