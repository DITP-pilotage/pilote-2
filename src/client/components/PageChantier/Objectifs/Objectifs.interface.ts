import Chantier from '@/server/domain/chantier/Chantier.interface';
import { Maille } from '@/server/domain/maille/Maille.interface';
import Objectif from '@/server/domain/objectif/Objectif.interface';
import { CodeInsee } from '@/server/domain/territoire/Territoire.interface';

export interface ObjectifsPageChantierProps {
  objectifs: Objectif[] | null
  chantierId: Chantier['id']
  maille: Maille
  codeInsee: CodeInsee
  modeÉcriture?: boolean
  estInteractif?: boolean 
}
