import { faker } from '@faker-js/faker/locale/fr';
import { Commentaires } from '@/server/domain/commentaire/Commentaire.interface';

export default class CommentaireBuilder {
  private _freinsÀLever: Commentaires['freinsÀLever'];

  private _actionsÀVenir: Commentaires['actionsÀVenir'];

  private _actionsÀValoriser: Commentaires['actionsÀValoriser'];

  private _autresRésultatsObtenus: Commentaires['autresRésultatsObtenus'];

  constructor() {
    this._freinsÀLever = faker.helpers.arrayElement([null, this._générerUnCommentaire()]);
    this._actionsÀVenir = faker.helpers.arrayElement([null, this._générerUnCommentaire()]);
    this._actionsÀValoriser = faker.helpers.arrayElement([null, this._générerUnCommentaire()]);
    this._autresRésultatsObtenus = faker.helpers.arrayElement([null, this._générerUnCommentaire()]);
  }

  private _générerUnCommentaire() {
    return {
      contenu: faker.lorem.paragraph(),
      date: faker.date.recent(10, '2023-02-01T00:00:00.000Z').toISOString(),
      auteur: faker.helpers.arrayElement(['', faker.name.fullName()]),
    };
  }

  avecFreinsÀLever(freinsÀLever: typeof this._freinsÀLever): CommentaireBuilder {
    this._freinsÀLever = freinsÀLever;
    return this;
  }

  avecActionsÀVenir(actionsÀVenir: typeof this._actionsÀVenir): CommentaireBuilder {
    this._actionsÀVenir = actionsÀVenir;
    return this;
  }

  avecActionsÀValoriser(actionsÀValoriser: typeof this._actionsÀValoriser): CommentaireBuilder {
    this._actionsÀValoriser = actionsÀValoriser;
    return this;
  }

  avecAutresRésultatsObtenus(autresRésultatsObtenus: typeof this._autresRésultatsObtenus): CommentaireBuilder {
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
