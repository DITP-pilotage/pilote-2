import { dependencies } from '@/server/infrastructure/Dependencies';
import {
  MetadataParametrageIndicateurRepository,
} from '@/server/parametrage-indicateur/domain/port/MetadataParametrageIndicateurRepository';
import {
  MetadataParametrageIndicateurForm,
} from '@/server/parametrage-indicateur/domain/MetadataParametrageIndicateurInputForm';
import { HistorisationModification } from '@/server/domain/historisationModification/HistorisationModification';
import { MetadataParametrageIndicateur } from '@/server/parametrage-indicateur/domain/MetadataParametrageIndicateur';
import {
  HistorisationModificationRepository,
} from '@/server/domain/historisationModification/HistorisationModificationRepository';

export default class ModifierUneMetadataIndicateurUseCase {
  constructor(
    private readonly metadataParametrageIndicateurRepository: MetadataParametrageIndicateurRepository = dependencies.getMetadataParametrageIndicateurRepository(),
    private readonly historisationModificationRepository: HistorisationModificationRepository = dependencies.getHistorisationModificationRepository(),
  ) {}

  async run(utilisateurNom: string, inputs: MetadataParametrageIndicateurForm) {
    const metadataParametrageIndicateurAncien = await this.metadataParametrageIndicateurRepository.recupererMetadataParametrageIndicateurParIndicId(inputs.indicId);

    const metadataParametrageIndicateurNouveau = MetadataParametrageIndicateur.creerMetadataParametrageIndicateur({
      ...inputs,
      chantierNom: metadataParametrageIndicateurAncien.chantierNom,
    });

    const historisationModification = HistorisationModification.creerHistorisationModification({
      utilisateurNom,
      tableModifieId: 'metadata_indicateurs',
      ancienneValeur: metadataParametrageIndicateurAncien,
      nouvelleValeur: metadataParametrageIndicateurNouveau,
    });
    const historisationParametrageModification = HistorisationModification.creerHistorisationModification({
      utilisateurNom,
      tableModifieId: 'metadata_parametrages_indicateurs',
      ancienneValeur: metadataParametrageIndicateurAncien,
      nouvelleValeur: metadataParametrageIndicateurNouveau,
    });
    const historisationIndicateurComplementaireModification = HistorisationModification.creerHistorisationModification({
      utilisateurNom,
      tableModifieId: 'metadata_indicateurs_complementaire',
      ancienneValeur: metadataParametrageIndicateurAncien,
      nouvelleValeur: metadataParametrageIndicateurNouveau,
    });

    if (historisationModification.nouvelleValeur && Object.values(historisationModification.nouvelleValeur).some(Boolean)) {
      await this.historisationModificationRepository.sauvegarderModificationHistorisation(historisationModification);
    }
    if (historisationParametrageModification.nouvelleValeur && Object.values(historisationParametrageModification.nouvelleValeur).some(Boolean)) {
      await this.historisationModificationRepository.sauvegarderModificationHistorisation(historisationParametrageModification);
    }
    if (historisationIndicateurComplementaireModification.nouvelleValeur && Object.values(historisationIndicateurComplementaireModification.nouvelleValeur).some(Boolean)) {
      await this.historisationModificationRepository.sauvegarderModificationHistorisation(historisationIndicateurComplementaireModification);
    }

    return this.metadataParametrageIndicateurRepository.modifier(metadataParametrageIndicateurNouveau);
  }
}
