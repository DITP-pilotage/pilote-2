import DécisionsStratégiques from '@/server/domain/décisionsStratégiques/DécisionsStratégiques.interface';
import DécisionsStratégiquesRepository from '@/server/domain/décisionsStratégiques/DécisionsStratégiquesRepository.interface';
import { dependencies } from '@/server/infrastructure/Dependencies';

export default class RécupérerDécisionsStratégiquesLePlusRécentUseCase {
  constructor(
    private readonly décisionsStratégiquesRepository: DécisionsStratégiquesRepository = dependencies.getDécisionsStratégiquesRepository(),
  ) {}

  async run(chantierId: string): Promise<DécisionsStratégiques> {
    return this.décisionsStratégiquesRepository.récupérerLePlusRécent(chantierId);
  }
}
