import Chantier from '@/server/domain/chantier/Chantier.interface';

export default interface ChantierRepository {
  add(chantier: Chantier): Promise<void>;
  getById(id: string, zone_nom: string): Promise<Chantier>;
}
