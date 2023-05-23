import Chantier from '@/server/domain/chantier/Chantier.interface';
import Objectif, { TypeObjectifChantier } from './Objectif.interface';

export default interface ObjectifRepository {
  récupérerHistorique(chantierId: string, type: TypeObjectifChantier): Promise<Objectif[]>
  récupérerLePlusRécent(chantierId: string, type: TypeObjectifChantier): Promise<Objectif>
  créer(chantierId: string, id: string, contenu: string, auteur: string, type: TypeObjectifChantier, date: Date): Promise<Objectif>;
  récupérerLesPlusRécentsGroupésParChantier(chantiersIds: Chantier['id'][]): Promise<Record<Chantier['id'], Objectif[]>>
}
