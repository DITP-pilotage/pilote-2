import Chantier from '@/server/domain/chantier/Chantier.interface';
import ProjetStructurant from '@/server/domain/projetStructurant/ProjetStructurant.interface';

export function déterminerLeTypeDeRéforme(réformeId: Chantier['id'] | ProjetStructurant['id']) {
  return réformeId.startsWith('CH') ? 'chantier' : 'projetStructurant';
}
