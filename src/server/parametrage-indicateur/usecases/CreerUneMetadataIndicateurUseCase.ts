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
import { MetadataParametrageIndicateur } from '@/server/parametrage-indicateur/domain/MetadataParametrageIndicateur';

export default class CreerUneMetadataIndicateurUseCase {
  constructor(
    private readonly metadataParametrageIndicateurRepository: MetadataParametrageIndicateurRepository,
    private readonly historisationModificationRepository: HistorisationModificationRepository,
  ) {}

  async run(utilisateurNom: string, inputs: MetadataParametrageIndicateurForm) {
    const metadataParametrageIndicateurNouveau = MetadataParametrageIndicateur.creerMetadataParametrageIndicateur({
      ...inputs,
      chantierNom: 'Non défini en création',
    });

    const result = await this.metadataParametrageIndicateurRepository.creer(metadataParametrageIndicateurNouveau);
    const historisationModification = HistorisationModification.creerHistorisationCreation({
      utilisateurNom,
      tableModifieId: 'metadata_indicateurs',
      nouvelleValeur: result,
    });
    const historisationParametrageModification = HistorisationModification.creerHistorisationCreation({
      utilisateurNom,
      tableModifieId: 'metadata_parametrages_indicateurs',
      nouvelleValeur: result,
    });
    const historisationComplementaireModification = HistorisationModification.creerHistorisationCreation({
      utilisateurNom,
      tableModifieId: 'metadata_indicateurs_complementaire',
      nouvelleValeur: result,
    });
    await this.historisationModificationRepository.sauvegarderModificationHistorisation(historisationModification);
    await this.historisationModificationRepository.sauvegarderModificationHistorisation(historisationParametrageModification);
    await this.historisationModificationRepository.sauvegarderModificationHistorisation(historisationComplementaireModification);
    return result;
  }
}
