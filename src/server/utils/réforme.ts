import { TypeDeRéforme } from '@/components/PageAccueil/SélecteurTypeDeRéforme/SélecteurTypeDeRéforme.interface';
import Chantier from '@/server/domain/chantier/Chantier.interface';
import ProjetStructurant from '@/server/domain/projetStructurant/ProjetStructurant.interface';

export function déterminerLeTypeDeRéforme(réformeId: Chantier['id'] | ProjetStructurant['id']): TypeDeRéforme {
  return réformeId.startsWith('CH') ? 'chantier' : 'projet structurant';
}
