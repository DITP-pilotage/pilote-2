import { dependencies } from '@/server/infrastructure/Dependencies';
import {
  MetadataParametrageIndicateurRepository,
} from '@/server/parametrage-indicateur/domain/port/MetadataParametrageIndicateurRepository';
import { MetadataParametrageIndicateur } from '@/server/parametrage-indicateur/domain/MetadataParametrageIndicateur';

export default class RécupérerMetadataIndicateurIdentifiantGénéréUseCase {
  constructor(
    private readonly metadataParametrageIndicateurRepository: MetadataParametrageIndicateurRepository = dependencies.getMetadataParametrageIndicateurRepository(),
  ) {}

  async run(): Promise<string> {
    const listeMetadataParametrageIndicateur: MetadataParametrageIndicateur[] = await this.metadataParametrageIndicateurRepository.recupererListeMetadataParametrageIndicateurParChantierIds([]);
    const sortedListeMetadataParametrageIndicateur = listeMetadataParametrageIndicateur.sort((metadataParametrageIndicateur1, metadataParametrageIndicateur2) => metadataParametrageIndicateur1.indicId.localeCompare(metadataParametrageIndicateur2.indicId));
    // eslint-disable-next-line unicorn/no-array-reduce
    const identifiants = new Set(sortedListeMetadataParametrageIndicateur.map(li => Number(li.indicId.split('-')[1])));
    let currentId = 0;
    while (identifiants.has(currentId)) {
      currentId++;
    }
    return `IND-${currentId.toString().padStart(3, '0')}`;
  }
}
