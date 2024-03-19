import { Commentaire } from '@/server/fiche-conducteur/domain/Commentaire';
import { CommentaireType } from '@/server/fiche-conducteur/domain/CommentaireType';

export class CommentaireBuilder {
  private type: CommentaireType = 'freins_a_lever';

  private contenu: string = 'un contenu pour une decision strategique';

  private date: string = '2022-05-01T00:00:00.000Z';

  withType(type: CommentaireType): CommentaireBuilder {
    this.type = type;
    return this;
  }

  withContenu(contenu: string): CommentaireBuilder {
    this.contenu = contenu;
    return this;
  }

  withDate(date: string) {
    this.date = date;
    return this;

  }

  build(): Commentaire {
    return Commentaire.creerCommentaire({
      date: this.date,
      type: this.type,
      contenu: this.contenu,
    });
  }
}
