import { Maille } from '@/server/domain/maille/Maille.interface';
import { CodeInsee } from '@/server/domain/territoire/Territoire.interface';
import SynthèseDesRésultats from './SynthèseDesRésultats.interface';

export default interface SynthèseDesRésultatsRepository {
  récupérerLaPlusRécenteParChantierIdEtTerritoire(chantierId: string, maille: Maille, codeInsee: CodeInsee): Promise<SynthèseDesRésultats>
}
