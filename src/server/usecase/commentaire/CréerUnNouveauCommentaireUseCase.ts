import { CommentaireÀCréer } from '@/server/domain/commentaire/Commentaire.interface';
import { LIMITE_CARACTÈRES_COMMENTAIRE } from '@/server/domain/commentaire/Commentaire.validator';
import CommentaireRepository from '@/server/domain/commentaire/CommentaireRepository.interface';
import { CommentaireParamsError } from '@/server/infrastructure/api/chantier/[chantierId]/commentaire';
import { dependencies } from '@/server/infrastructure/Dependencies';

export default class CréerUnNouveauCommentaireUseCase {
  constructor(
    private readonly commentaireRepository: CommentaireRepository = dependencies.getCommentaireRepository(),
  ) {}

  private _vérifierLeCommentaire(commentaire: CommentaireÀCréer) {  
    if (!commentaire.typeCommentaire || !commentaire.maille || !commentaire.codeInsee || !commentaire.contenu) {    
      throw new CommentaireParamsError('Le commentaire est imcomplet');
    }
  
    if (commentaire.contenu.length > LIMITE_CARACTÈRES_COMMENTAIRE) {
      throw new CommentaireParamsError('Le contenu du commentaire dépasse la limite de caractères');
    }
  }

  async run(chantierId: string, nouveauCommentaire: CommentaireÀCréer, utilisateurNom: string) {
    const date = new Date().toISOString();
    this._vérifierLeCommentaire(nouveauCommentaire); 
    return this.commentaireRepository.créerNouveauCommentaire(
      chantierId, 
      nouveauCommentaire.typeCommentaire,
      nouveauCommentaire.maille,
      nouveauCommentaire.codeInsee,
      { contenu: nouveauCommentaire.contenu, auteur: utilisateurNom, date },
    );
  }
}
