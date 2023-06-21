import Chantier, { ChantierDatesDeMiseÀJour } from '@/server/domain/chantier/Chantier.interface';
import { Territoire } from '@/server/domain/territoire/Territoire.interface';

export default interface ChantierDatesDeMàjRepository {
  récupérerDatesDeMiseÀJour(chantierIds: string[], territoireCodes: string[]): Promise<Record<Chantier['id'], Record<Territoire['code'], ChantierDatesDeMiseÀJour>>>
}
