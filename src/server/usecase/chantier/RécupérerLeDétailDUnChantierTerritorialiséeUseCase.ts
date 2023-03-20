import { Maille } from '@/server/domain/maille/Maille.interface';
import { CodeInsee } from '@/server/domain/territoire/Territoire.interface';
import SynthèseDesRésultatsRepository
  from '@/server/domain/synthèseDesRésultats/SynthèseDesRésultatsRepository.interface';
import ChantierRepository, { InfosChantier } from '@/server/domain/chantier/ChantierRepository.interface';
import CommentaireRepository from '@/server/domain/commentaire/CommentaireRepository.interface';
import { dependencies } from '@/server/infrastructure/Dependencies';

export class RécupérerLeDétailDUnChantierTerritorialiséeUseCase {
  constructor(
    private readonly chantierRepository: ChantierRepository = dependencies.getChantierRepository(),
    private readonly synthèseDesRésultatsRepository: SynthèseDesRésultatsRepository = dependencies.getSynthèseDesRésultatsRepository(),
    private readonly commentaireRepository: CommentaireRepository = dependencies.getCommentaireRepository(),
  ) {}
  
  async run(chantierId: string, maille: Maille, codeInsee: CodeInsee): Promise<InfosChantier> {
    const infosChantier: InfosChantier = {
      synthèseDesRésultats: await this.synthèseDesRésultatsRepository.récupérerLaPlusRécenteParChantierIdEtTerritoire(chantierId, maille, codeInsee),
      météo: await this.chantierRepository.récupérerMétéoParChantierIdEtTerritoire(chantierId, maille, codeInsee) ?? 'NON_RENSEIGNEE',
      commentaires: await this.commentaireRepository.findNewestByChantierIdAndTerritoire(chantierId, maille, codeInsee),
    };

    return infosChantier;
  }
}
