import SynthèseDesRésultats from '@/server/domain/chantier/SynthèseDesRésultats.interface';
import { DétailsCommentaire } from '@/server/domain/chantier/Commentaire.interface';
import { Maille } from '@/server/domain/maille/Maille.interface';
import { CodeInsee } from '@/server/domain/territoire/Territoire.interface';

export default interface SynthèseDesRésultatsRepository {
  findNewestByChantierId(chantierId: string): Promise<SynthèseDesRésultats | null>
  findNewestByChantierIdAndTerritoire(chantierId: string, maille: Maille, codeInsee: CodeInsee): Promise<DétailsCommentaire | null>
}
