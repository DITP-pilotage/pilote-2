import Chantier from 'server/domain/chantier/chantier.interface';

export interface ChantierRepository {
  add(chantier: Chantier): Promise<void>;
  getListeChantiers(): Promise<Chantier[]>;
}
