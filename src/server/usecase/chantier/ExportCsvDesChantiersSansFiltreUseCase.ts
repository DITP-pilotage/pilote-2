/* eslint-disable @typescript-eslint/dot-notation */
import { dependencies } from '@/server/infrastructure/Dependencies';
import { Habilitations } from '@/server/domain/utilisateur/habilitation/Habilitation.interface';
import { formaterMétéo, NON, NON_APPLICABLE, OUI } from '@/server/infrastructure/export_csv/valeurs';
import { ChantierPourExport } from '@/server/usecase/chantier/ExportCsvDesChantiersSansFiltreUseCase.interface';
import { libellésTypesCommentaire } from '@/client/constants/libellésCommentaire';
import { libellésTypesObjectif } from '@/client/constants/libellésObjectif';
import { libellésTypesDécisionStratégique } from '@/client/constants/libellésDécisionStratégique';
import { Profil } from '@/server/domain/utilisateur/Utilisateur.interface';
import Habilitation from '@/server/domain/utilisateur/habilitation/Habilitation';
import configuration from '@/server/infrastructure/Configuration';

export class ExportCsvDesChantiersSansFiltreUseCase {
  public static readonly NOMS_COLONNES = [
    'Maille',
    'Région',
    'Département',
    'Ministère',
    'Chantier',
    'Chantier du baromètre',
    'Chantier territorialisé',
    'Taux d\'avancement départemental',
    'Taux d\'avancement régional',
    'Taux d\'avancement national',
    'Météo',
    'Synthèse des résultats',
    libellésTypesObjectif['notreAmbition'],
    libellésTypesObjectif['déjàFait'],
    libellésTypesObjectif['àFaire'],
    libellésTypesDécisionStratégique['suiviDesDécisionsStratégiques'],
    libellésTypesCommentaire['autresRésultatsObtenusNonCorrélésAuxIndicateurs'],
    libellésTypesCommentaire['risquesEtFreinsÀLever'],
    libellésTypesCommentaire['solutionsEtActionsÀVenir'],
    libellésTypesCommentaire['exemplesConcretsDeRéussite'],
    libellésTypesCommentaire['commentairesSurLesDonnées'],
    libellésTypesCommentaire['autresRésultatsObtenus'],
  ];

  constructor(
    private readonly chantierRepository = dependencies.getChantierRepository(),
  ) {}

  public async* run(habilitations: Habilitations, profil: Profil): AsyncGenerator<string[][]> {
    const h = new Habilitation(habilitations);
    const chantierIdsLecture = h.récupérerListeChantiersIdsAccessiblesEnLecture();
    const territoireCodesLecture = h.récupérerListeTerritoireCodesAccessiblesEnLecture();

    const chunkSize = configuration.exportCsvChantierIdChunkSize;
    for (let i = 0; i < chantierIdsLecture.length; i += chunkSize) {
      const partialChantierIds = chantierIdsLecture.slice(i, i + chunkSize);
      const partialResult = await this.chantierRepository.récupérerPourExports(partialChantierIds, territoireCodesLecture);
      yield partialResult
        .filter(c => !this.masquerChantierPourProfilDROM(profil, c))
        .map(c => this.transformer(c, profil));
    }
  }

  private masquerPourProfilDROM(profil: Profil, périmètreIds : string[]) {
    return profil == 'DROM' && !périmètreIds.includes('PER-018');
  }

  private masquerChantierPourProfilDROM(profil: Profil, chantier : ChantierPourExport) {
    return this.masquerPourProfilDROM(profil, chantier.périmètreIds) && chantier.maille === 'NAT';
  }

  // eslint-disable-next-line sonarjs/cognitive-complexity
  private transformer(chantierPourExport: ChantierPourExport, profil: Profil): string[] {
    return [
      chantierPourExport.maille || NON_APPLICABLE,
      chantierPourExport.régionNom || NON_APPLICABLE,
      chantierPourExport.départementNom || NON_APPLICABLE,
      chantierPourExport.ministèreNom || NON_APPLICABLE,
      chantierPourExport.nom || NON_APPLICABLE,
      chantierPourExport.estBaromètre ? OUI : NON,
      chantierPourExport.estTerritorialisé ? OUI : NON,
      chantierPourExport.tauxDAvancementDépartemental?.toString() || NON_APPLICABLE,
      chantierPourExport.tauxDAvancementRégional?.toString() || NON_APPLICABLE,
      this.masquerPourProfilDROM(profil, chantierPourExport.périmètreIds)
        ?  NON_APPLICABLE
        : chantierPourExport.tauxDAvancementNational?.toString() || NON_APPLICABLE,
      formaterMétéo(chantierPourExport.météo),
      chantierPourExport.synthèseDesRésultats || NON_APPLICABLE,
      chantierPourExport.objNotreAmbition || NON_APPLICABLE,
      chantierPourExport.objDéjàFait || NON_APPLICABLE,
      chantierPourExport.objÀFaire || NON_APPLICABLE,
      chantierPourExport.decStratSuiviDesDécisions || NON_APPLICABLE,
      chantierPourExport.commAutresRésultatsNonCorrélésAuxIndicateurs || NON_APPLICABLE,
      chantierPourExport.commFreinsÀLever || NON_APPLICABLE,
      chantierPourExport.commActionsÀVenir || NON_APPLICABLE,
      chantierPourExport.commActionsÀValoriser || NON_APPLICABLE,
      chantierPourExport.commCommentairesSurLesDonnées || NON_APPLICABLE,
      chantierPourExport.commAutresRésultats || NON_APPLICABLE,
    ];
  }
}
