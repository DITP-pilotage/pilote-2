import { faker } from '@faker-js/faker';
import FixtureInterface from '@/fixtures/Fixture.interface';
import { Commentaires, DétailsCommentaire } from '@/server/domain/chantier/Commentaire.interface';

class CommentairesFixture implements FixtureInterface<Commentaires> {

  private générerCommentaire(): DétailsCommentaire {
    return {
      contenu: faker.lorem.words(50),
      date: faker.date.past().toLocaleDateString('fr-FR'),
      auteur: faker.lorem.words(2),
    };
  }

  générer(valeursFixes?: Partial<Commentaires>): Commentaires {
    return {
      freinsÀLever: this.générerCommentaire(),
      actionsÀVenir: this.générerCommentaire(),
      actionsÀValoriser: null,
      autresRésultatsObtenus: this.générerCommentaire(),
      ...valeursFixes,
    };
  }

  générerPlusieurs(quantité: number, valeursFixes: Partial<Commentaires>[] = []): Commentaires[] {
    return Array.from({ length: quantité })
      .map((_, index) => this.générer(valeursFixes[index]));
  }
}

const commentairesFixture = new CommentairesFixture();
export default commentairesFixture;
