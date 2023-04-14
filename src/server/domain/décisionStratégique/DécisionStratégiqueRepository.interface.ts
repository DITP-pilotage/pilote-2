import DécisionStratégique from './DécisionStratégique.interface';

export default interface DécisionStratégiqueRepository {
  récupérerLePlusRécent(chantierId: string): Promise<DécisionStratégique>
  créer(chantierId: string, id: string, contenu: string, type: DécisionStratégique['type'], auteur: string, date: Date): Promise<DécisionStratégique>
}
