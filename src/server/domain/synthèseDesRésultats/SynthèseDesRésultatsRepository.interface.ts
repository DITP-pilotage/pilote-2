import SynthèseDesRésultats from '@/server/domain/synthèseDesRésultats/SynthèseDesRésultats.interface';
import { Maille } from '@/server/domain/maille/Maille.interface';
import { CodeInsee } from '@/server/domain/territoire/Territoire.interface';
import { DétailsCommentaire } from '@/server/domain/chantier/Commentaire.interface';

export default interface SynthèseDesRésultatsRepository {
  findNewestByChantierId(chantierId: string): Promise<SynthèseDesRésultats | null>

  récupérerLaPlusRécenteParChantierIdEtTerritoire(chantierId: string, maille: Maille, codeInsee: CodeInsee): Promise<DétailsCommentaire>
}
