import DécisionsStratégiques from './DécisionsStratégiques.interface';

export default interface DécisionsStratégiquesRepository {
  récupérerLePlusRécent(chantierId: string): Promise<DécisionsStratégiques>
}
