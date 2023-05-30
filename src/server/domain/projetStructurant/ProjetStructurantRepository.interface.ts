import { projet_structurant as ProjetStructurantPrisma } from '@prisma/client';

export default interface ProjetStructurantRepository {
  récupérer(id: string): Promise<ProjetStructurantPrisma>;
  récupérerListe(): Promise<ProjetStructurantPrisma[]>;
}
