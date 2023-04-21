import Objectif, { TypeObjectif } from './Objectif.interface';

export default interface ObjectifRepository {
  récupérerHistorique(chantierId: string, type: TypeObjectif): Promise<Objectif[]>
  récupérerLePlusRécent(chantierId: string, type: TypeObjectif): Promise<Objectif>
  créer(chantierId: string, id: string, contenu: string, auteur: string, type: TypeObjectif, date: Date): Promise<Objectif>;
}
