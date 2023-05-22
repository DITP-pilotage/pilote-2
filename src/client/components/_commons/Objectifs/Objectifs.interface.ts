import Chantier from '@/server/domain/chantier/Chantier.interface';
import { Maille } from '@/server/domain/maille/Maille.interface';
import Objectif from '@/server/domain/objectif/Objectif.interface';
import ProjetStructurant from '@/server/domain/projetStructurant/ProjetStructurant.interface';

export interface ObjectifsProps {
  objectifs: Objectif[] | null
  réformeId: Chantier['id'] | ProjetStructurant['id']
  maille: Maille
  modeÉcriture?: boolean
  estInteractif?: boolean 
}
