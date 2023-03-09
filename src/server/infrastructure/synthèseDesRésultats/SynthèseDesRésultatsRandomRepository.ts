import SynthèseDesRésultatsRepository from '@/server/domain/synthèseDesRésultats/SynthèseDesRésultatsRepository.interface';
import { Maille } from '@/server/domain/maille/Maille.interface';
import { CodeInsee } from '@/server/domain/territoire/Territoire.interface';
import { DétailsCommentaire } from '@/server/domain/chantier/Commentaire.interface';

export default class SynthèseDesRésultatsRandomRepository implements SynthèseDesRésultatsRepository {
  récupérerLaPlusRécenteParChantierIdEtTerritoire(_chantierId: string, _maille: Maille, _codeInsee: CodeInsee): Promise<DétailsCommentaire> {
    throw new Error('Not Implemented');
  }
}
