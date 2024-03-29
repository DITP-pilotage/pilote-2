import Chantier from '@/server/domain/chantier/Chantier.interface';
import { Maille } from '@/server/domain/maille/Maille.interface';
import Objectif, { typesObjectif } from '@/server/domain/chantier/objectif/Objectif.interface';
import ObjectifProjetStructurant, { TypeObjectifProjetStructurant } from '@/server/domain/projetStructurant/objectif/Objectif.interface';
import ProjetStructurant from '@/server/domain/projetStructurant/ProjetStructurant.interface';

export interface ObjectifsProps {
  objectifs: (Objectif | ObjectifProjetStructurant)[] | null
  réformeId: Chantier['id'] | ProjetStructurant['id']
  maille: Maille
  nomTerritoire: string
  typesObjectif: typeof typesObjectif | TypeObjectifProjetStructurant[]
  modeÉcriture?: boolean
  estInteractif?: boolean 
}
