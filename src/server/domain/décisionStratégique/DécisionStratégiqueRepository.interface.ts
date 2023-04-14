import DécisionStratégique, { TypeDécisionStratégique } from './DécisionStratégique.interface';

export default interface DécisionStratégiqueRepository {
  récupérerLePlusRécent(chantierId: string): Promise<DécisionStratégique>
  récupérerLHistorique(chantierId: string): Promise<DécisionStratégique[]>
  créer(chantierId: string, id: string, contenu: string, type: TypeDécisionStratégique, auteur: string, date: Date): Promise<DécisionStratégique>
}
