import Chantier from '@/server/domain/chantier/Chantier.interface';
import { Maille } from '@/server/domain/maille/Maille.interface';
import Objectif, { typesObjectifChantier } from '@/server/domain/objectif/Objectif.interface';
import ObjectifProjetStructurant, { typeObjectifProjetStructurant, TypeObjectifProjetStructurant } from '@/server/domain/projetStructurant/objectif/Objectif.interface';
import ProjetStructurant from '@/server/domain/projetStructurant/ProjetStructurant.interface';

export const typesObjectif = [...typesObjectifChantier, typeObjectifProjetStructurant] as const;
export type TypeObjectif = typeof typesObjectif[number];

export interface ObjectifsProps {
  objectifs: (Objectif | ObjectifProjetStructurant)[] | null
  réformeId: Chantier['id'] | ProjetStructurant['id']
  maille: Maille
  nomTerritoire: string
  typesObjectif: typeof typesObjectifChantier | TypeObjectifProjetStructurant[]
  modeÉcriture?: boolean
  estInteractif?: boolean 
}
