import { dependencies } from '@/server/infrastructure/Dependencies';
import PérimètreMinistérielRepository from '@/server/domain/périmètreMinistériel/PérimètreMinistérielRepository.interface';
import PérimètreMinistériel from '@/server/domain/périmètreMinistériel/PérimètreMinistériel.interface';

export default class RécupérerPérimètresMinistérielsUseCase {
  constructor(
    private readonly périmètreMinistérielRepository: PérimètreMinistérielRepository = dependencies.getPérimètreMinistérielRepository(),
  ) {}

  async run(périmètresMinistérielsIds?: PérimètreMinistériel['id'][]): Promise<PérimètreMinistériel[]> {
    if (périmètresMinistérielsIds)
      return this.périmètreMinistérielRepository.récupérerListe(périmètresMinistérielsIds);

    return this.périmètreMinistérielRepository.récupérerTous();
  }
}
