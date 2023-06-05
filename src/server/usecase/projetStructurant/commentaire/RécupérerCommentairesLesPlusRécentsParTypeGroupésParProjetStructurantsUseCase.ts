import CommentaireProjetStructurantRepository from '@/server/domain/projetStructurant/commentaire/CommentaireRepository.interface';
import ProjetStructurant from '@/server/domain/projetStructurant/ProjetStructurant.interface';
import { dependencies } from '@/server/infrastructure/Dependencies';

export default class RécupérerCommentairesLesPlusRécentsParTypeGroupésParProjetStructurantsUseCase {
  constructor(
    private readonly commentaireRepository: CommentaireProjetStructurantRepository = dependencies.getCommentaireProjetStructurantRepository(),
  ) {}

  async run(projetStructurantIds: ProjetStructurant['id'][]) {
    return this.commentaireRepository.récupérerLesPlusRécentsGroupésParProjetsStructurants(projetStructurantIds);
  }
}
