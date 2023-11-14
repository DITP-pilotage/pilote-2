import { dependencies } from '@/server/infrastructure/Dependencies';
import {
  MetadataParametrageIndicateurRepository,
} from '@/server/parametrage-indicateur/domain/port/MetadataParametrageIndicateurRepository';
import {
  MetadataParametrageIndicateurForm,
} from '@/server/parametrage-indicateur/domain/MetadataParametrageIndicateurInputForm';
import {
  HistorisationModificationRepository,
} from '@/server/domain/historisationModification/HistorisationModificationRepository';
import { HistorisationModification } from '@/server/domain/historisationModification/HistorisationModification';

export default class CreerUneMetadataIndicateurUseCase {
  constructor(
    private readonly metadataParametrageIndicateurRepository: MetadataParametrageIndicateurRepository = dependencies.getMetadataParametrageIndicateurRepository(),
    private readonly historisationModificationRepository: HistorisationModificationRepository = dependencies.getHistorisationModificationRepository(),
  ) {}

  async run(inputs: MetadataParametrageIndicateurForm) {
    const result = await this.metadataParametrageIndicateurRepository.creer(inputs);
    const historisationModification = HistorisationModification.creerHistorisationModificationCreation({
      tableModifieId: 'metadata_indicateurs',
      nouvelleValeur: result,
    });
    await this.historisationModificationRepository.sauvegarderModificationCreation(historisationModification);
    return result;
  }
}
