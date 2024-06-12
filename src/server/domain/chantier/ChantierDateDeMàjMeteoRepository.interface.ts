import Chantier, { ChantierDateMajMeteo } from '@/server/domain/chantier/Chantier.interface';
import { Territoire } from '@/server/domain/territoire/Territoire.interface';

export default interface ChantierDateDeMàjMeteoRepository {
  récupérerDateDeMiseÀJourMeteo(chantierIds: string[], territoireCodes: string[]): Promise<Record<Chantier['id'], Record<Territoire['code'], ChantierDateMajMeteo>>>
}
