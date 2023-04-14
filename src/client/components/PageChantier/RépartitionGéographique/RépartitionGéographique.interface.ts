import { Maille } from '@/server/domain/maille/Maille.interface';
import { CodeInsee } from '@/server/domain/territoire/Territoire.interface';
import {
  DonnéesTerritoriales,
} from '@/server/domain/chantierDonnéesTerritoriales/chantierDonnéesTerritoriales.interface';

export default interface CartesProps {
  données: Record<Maille, Record<CodeInsee, DonnéesTerritoriales>>,
}
