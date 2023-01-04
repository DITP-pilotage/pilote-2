import Chantier from '@/server/domain/chantier/Chantier.interface';

export default interface ChantierRepository {
  add(chantier: Chantier): Promise<void>;
  getById(id: string, codeInsee: string, maille: string): Promise<Chantier>;
}
