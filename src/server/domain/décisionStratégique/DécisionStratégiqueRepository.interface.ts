import DécisionStratégique from './DécisionStratégique.interface';

export default interface DécisionStratégiqueRepository {
  récupérerLePlusRécent(chantierId: string): Promise<DécisionStratégique>
}
