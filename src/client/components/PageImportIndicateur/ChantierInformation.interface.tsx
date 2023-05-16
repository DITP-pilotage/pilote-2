import Chantier from '@/server/domain/chantier/Chantier.interface';

export interface ChantierInformations {
  id: Chantier['id'],
  nom: Chantier['nom']
}
