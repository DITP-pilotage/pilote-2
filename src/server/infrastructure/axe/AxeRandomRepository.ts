import AxeRepositoryInterface from '@/server/domain/axe/AxeRepository.interface';
import AxeFixture from '@/fixtures/AxeFixture';
import Axe from '@/server/domain/axe/Axe.interface';

export default class AxeRandomRepository implements AxeRepositoryInterface {
  private readonly valeursFixes: Partial<Axe>[] | undefined;

  constructor(valeursFixes?: Partial<Axe>[]) {
    this.valeursFixes = valeursFixes;
  }
  
  async getListe(): Promise<Axe[]> {
    if (!this.valeursFixes) {
      return [];
    }
    return AxeFixture.générerPlusieurs(this.valeursFixes.length, this.valeursFixes);
  }
}
