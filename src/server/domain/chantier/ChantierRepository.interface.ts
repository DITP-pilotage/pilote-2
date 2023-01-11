import Chantier from '@/server/domain/chantier/Chantier.interface';

export default interface ChantierRepository {
  getById(id: string): Promise<Chantier>;
  getListe(): Promise<Chantier[]>;
}
