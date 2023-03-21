import Chantier from '@/server/domain/chantier/Chantier.interface';

export interface ChantierInformation {
  id: Chantier['id'],
  nom: Chantier['nom']
  axe: Chantier['axe']
  ppg: Chantier['ppg']
}
