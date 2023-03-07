import { Maille } from '@/server/domain/maille/Maille.interface';
import { CodeInsee } from '@/server/domain/territoire/Territoire.interface';
import SynthèseDesRésultatsRepository
  from '@/server/domain/synthèseDesRésultats/SynthèseDesRésultatsRepository.interface';
import ChantierRepository, { InfosChantier } from '@/server/domain/chantier/ChantierRepository.interface';
import CommentaireRepository from '@/server/domain/chantier/CommentaireRepository.interface';
import { DétailsCommentaire } from '@/server/domain/chantier/Commentaire.interface';
import { dependencies } from '@/server/infrastructure/Dependencies';

export class RécupérerLeDétailDUnChantierTerritorialiséeUseCase {
  constructor(
    private readonly chantierRepository: ChantierRepository = dependencies.getChantierRepository(),
    private readonly synthèseDesRésultatsRepository: SynthèseDesRésultatsRepository = dependencies.getSynthèseDesRésultatsRepository(),
    private readonly commentaireRepository: CommentaireRepository = dependencies.getCommentaireRepository(),
  ) {}
  
  private async _récupérerSynthèseDesRésultatsTerritorialisée(chantierId: string, maille: Maille, codeInsee: CodeInsee): Promise<DétailsCommentaire | null> {
    const synthèseDesRésultats = await this.synthèseDesRésultatsRepository.récupérerLaPlusRécenteParChantierIdEtTerritoire(chantierId, maille, codeInsee);

    if (synthèseDesRésultats.contenu === '' || synthèseDesRésultats.date === '') {
      return null;
    }

    return synthèseDesRésultats;
  }
  
  async run(chantierId: string, maille: Maille, codeInsee: CodeInsee): Promise<InfosChantier> {
    const infosChantier: InfosChantier = {
      synthèseDesRésultats: await this._récupérerSynthèseDesRésultatsTerritorialisée(chantierId, maille, codeInsee),
      météo: await this.chantierRepository.récupérerMétéoParChantierIdEtTerritoire(chantierId, maille, codeInsee) ?? 'NON_RENSEIGNEE',
      commentaires: await this.commentaireRepository.findNewestByChantierIdAndTerritoire(chantierId, maille, codeInsee),
    };

    return infosChantier;
  }
}
