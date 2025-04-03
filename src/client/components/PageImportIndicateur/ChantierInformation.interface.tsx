import Chantier from '@/server/chantiers/domain/Chantier.interface';

export interface ChantierInformations {
  id: Chantier['id']
  nom: Chantier['nom']
  estUnChantierDROM?: boolean
}
