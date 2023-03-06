
import { faker } from '@faker-js/faker/locale/fr';
import Chantier from '@/server/domain/chantier/Chantier.interface';
import ChantierRepository, { InfosChantier } from '@/server/domain/chantier/ChantierRepository.interface';
import ChantierFixture from '@/fixtures/ChantierFixture';
import { CodeInsee } from '@/server/domain/territoire/Territoire.interface';
import CommentairesFixture from '@/fixtures/CommentairesFixture';

export default class ChantierRandomRepository implements ChantierRepository {
  private readonly valeursFixes: Partial<Chantier>[] | undefined;

  constructor(valeursFixes?: Partial<Chantier>[]) {
    this.valeursFixes = valeursFixes;
  }

  async getById(id: string): Promise<Chantier> {
    return ChantierFixture.générer({ id, ...this.valeursFixes?.[0] });
  }

  async getListe(): Promise<Chantier[]> {
    if (!this.valeursFixes) {
      return [];
    }
    return ChantierFixture.générerPlusieurs(this.valeursFixes.length, this.valeursFixes);
  }

  async getInfosChantier(_chantierId: string, _maille: string, _codeInsee: CodeInsee): Promise<InfosChantier> {
    return {
      // TODO fixture SynthèseDesRésultats
      synthèseDesRésultats: {
        contenu: faker.lorem.words(150),
        date: faker.date.past().toLocaleDateString('fr-FR'),
        auteur: faker.name.fullName(),
      },
      météo: 'SOLEIL',
      commentaires: CommentairesFixture.générer(),
    };
  }
}
