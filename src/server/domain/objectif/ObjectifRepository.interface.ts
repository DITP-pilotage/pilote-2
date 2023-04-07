import Objectif, { Objectifs, TypeObjectif } from './Objectif.interface';

export default interface ObjectifRepository {
  récupérerHistoriqueDUnObjectif(chantierId: string, type: TypeObjectif): Promise<Objectif[]>
  récupérerLesPlusRécentsParType(chantierId: string): Promise<Objectifs>
  créer(chantierId: string, id: string, contenu: string, auteur: string, type: TypeObjectif, date: Date): Promise<Objectif>;
}
