import { dependencies } from '@/server/infrastructure/Dependencies';
import DécisionStratégiqueRepository from '@/server/domain/décisionStratégique/DécisionStratégiqueRepository.interface';
import DécisionStratégique from '@/server/domain/décisionStratégique/DécisionStratégique.interface';

export default class RécupérerDécisionStratégiqueLaPlusRécenteUseCase {
  constructor(
    private readonly décisionStratégiqueRepository: DécisionStratégiqueRepository = dependencies.getDécisionStratégiqueRepository(),
  ) {}

  async run(chantierId: string): Promise<DécisionStratégique> {
    return this.décisionStratégiqueRepository.récupérerLaPlusRécente(chantierId);
  }
}
