import { faker } from '@faker-js/faker/locale/fr';
import { Commentaires, TypeCommentaire } from '@/server/domain/commentaire/Commentaire.interface';

export default class CommentaireBuilder {
  private _freinsÀLever: Commentaires['freinsÀLever'];

  private _actionsÀVenir: Commentaires['actionsÀVenir'];

  private _actionsÀValoriser: Commentaires['actionsÀValoriser'];

  private _autresRésultatsObtenus: Commentaires['autresRésultatsObtenus'];

  constructor() {
    this._freinsÀLever = faker.helpers.arrayElement([null, this._générerUnCommentaire('freinsÀLever')]);
    this._actionsÀVenir = faker.helpers.arrayElement([null, this._générerUnCommentaire('actionsÀVenir')]);
    this._actionsÀValoriser = faker.helpers.arrayElement([null, this._générerUnCommentaire('actionsÀValoriser')]);
    this._autresRésultatsObtenus = faker.helpers.arrayElement([null, this._générerUnCommentaire('autresRésultatsObtenus')]);
  }

  private _générerUnCommentaire(type: TypeCommentaire) {
    return {
      id: faker.datatype.uuid(),
      type: type,
      contenu: faker.lorem.paragraph(),
      date: faker.date.recent(10, '2023-02-01T00:00:00.000Z').toISOString(),
      auteur: faker.helpers.arrayElement(['', faker.name.fullName()]),
    };
  }

  avecFreinsÀLever(freinsÀLever: Commentaires['freinsÀLever']): CommentaireBuilder {
    this._freinsÀLever = freinsÀLever;
    return this;
  }

  avecActionsÀVenir(actionsÀVenir: Commentaires['actionsÀVenir']): CommentaireBuilder {
    this._actionsÀVenir = actionsÀVenir;
    return this;
  }

  avecActionsÀValoriser(actionsÀValoriser: Commentaires['actionsÀValoriser']): CommentaireBuilder {
    this._actionsÀValoriser = actionsÀValoriser;
    return this;
  }

  avecAutresRésultatsObtenus(autresRésultatsObtenus: Commentaires['autresRésultatsObtenus']): CommentaireBuilder {
    this._autresRésultatsObtenus = autresRésultatsObtenus;
    return this;
  }

  build(): Commentaires {
    return {
      freinsÀLever: this._freinsÀLever,
      actionsÀVenir: this._actionsÀVenir,
      actionsÀValoriser: this._actionsÀValoriser,
      autresRésultatsObtenus: this._autresRésultatsObtenus,
    };
  }
}
