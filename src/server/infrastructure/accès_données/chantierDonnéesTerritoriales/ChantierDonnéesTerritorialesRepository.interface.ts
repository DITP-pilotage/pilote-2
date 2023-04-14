import { Maille } from '@/server/domain/maille/Maille.interface';
import { CodeInsee } from '@/server/domain/territoire/Territoire.interface';
import {
  ChantierDonnéesTerritoriales,
} from '@/server/domain/chantierDonnéesTerritoriales/chantierDonnéesTerritoriales.interface';

export default interface ChantierDonnéesTerritorialesRepository {
  récupérerTousLesAvancementsDUnChantier(chantierId: string): Promise<Record<Maille, Record<CodeInsee, ChantierDonnéesTerritoriales>>>
}
