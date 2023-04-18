import DécisionStratégique, { TypeDécisionStratégique } from './DécisionStratégique.interface';

export default interface DécisionStratégiqueRepository {
  récupérerLaPlusRécente(chantierId: string): Promise<DécisionStratégique>
  récupérerHistorique(chantierId: string): Promise<DécisionStratégique[]>
  créer(chantierId: string, id: string, contenu: string, type: TypeDécisionStratégique, auteur: string, date: Date): Promise<DécisionStratégique>
}
