import Ppg from '@/server/domain/ppg/Ppg.interface';
import PpgFixture from '@/fixtures/PpgFixture';
import PpgRepository from '@/server/domain/ppg/PpgRepository.interface';

export default class PpgRandomRepository implements PpgRepository {
  private readonly valeursFixes: Partial<Ppg>[] | undefined;

  constructor(valeursFixes?: Partial<Ppg>[]) {
    this.valeursFixes = valeursFixes;
  }
  
  async getListe(): Promise<Ppg[]> {
    if (!this.valeursFixes) {
      return [];
    }
    return PpgFixture.générerPlusieurs(this.valeursFixes.length, this.valeursFixes);
  }
}
