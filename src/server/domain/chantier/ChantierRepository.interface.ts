import Chantier from '@/server/domain/chantier/Chantier.interface';

export default interface ChantierRepository {
  add(chantier: Chantier): Promise<void>;
  getListe(): Promise<Chantier[]>;
}
