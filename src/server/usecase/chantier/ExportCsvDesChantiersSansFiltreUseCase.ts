/* eslint-disable @typescript-eslint/dot-notation */
import { formaterMétéo, NON, NON_APPLICABLE, OUI } from '@/server/infrastructure/export_csv/valeurs';
import { ChantierPourExport } from '@/server/usecase/chantier/ExportCsvDesChantiersSansFiltreUseCase.interface';
import { libellésTypesCommentaire } from '@/client/constants/libellésCommentaire';
import { libellésTypesObjectif } from '@/client/constants/libellésObjectif';
import { libellésTypesDécisionStratégique } from '@/client/constants/libellésDécisionStratégique';
import { ProfilCode } from '@/server/domain/utilisateur/Utilisateur.interface';
import Habilitation from '@/server/domain/utilisateur/habilitation/Habilitation';
import { Configuration } from '@/server/infrastructure/Configuration';
import ChantierRepository from '@/server/domain/chantier/ChantierRepository.interface';

export class ExportCsvDesChantiersSansFiltreUseCase {
  public static readonly NOMS_COLONNES = [
    'Maille',
    'Région',
    'Département',
    'Ministère',
    'Chantier',
    'Chantier Id',
    'Chantier du baromètre',
    'Chantier territorialisé',
    'Taux d\'avancement départemental',
    'Taux d\'avancement régional',
    'Taux d\'avancement national',
    'Météo',
    'Responsable local',
    'Contact responsable local',
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
    private readonly _chantierRepository: ChantierRepository,
    private readonly _config: Configuration,
  ) {}

  public async* run(habilitation: Habilitation, profil: ProfilCode): AsyncGenerator<string[][]> {
    const chantierIdsLecture = await this._chantierRepository.récupérerChantierIdsEnLectureOrdonnésParNom(habilitation);
    const territoireCodesLecture = habilitation.récupérerListeTerritoireCodesAccessiblesEnLecture();

    const chunkSize = this._config.exportCsvChantiersChunkSize;
    for (let i = 0; i < chantierIdsLecture.length; i += chunkSize) {
      const partialChantierIds = chantierIdsLecture.slice(i, i + chunkSize);
      const partialResult = await this._chantierRepository.récupérerPourExports(partialChantierIds, territoireCodesLecture);
      yield partialResult
        .filter(c => !this.masquerChantierPourProfilDROM(profil, c))
        .map(c => this.transformer(c, profil));
    }
  }

  private masquerPourProfilDROM(profil: ProfilCode, périmètreIds : string[]) {
    return profil == 'DROM' && !périmètreIds.includes('PER-018');
  }

  private masquerChantierPourProfilDROM(profil: ProfilCode, chantier : ChantierPourExport) {
    return this.masquerPourProfilDROM(profil, chantier.périmètreIds) && chantier.maille === 'NAT';
  }

  // eslint-disable-next-line sonarjs/cognitive-complexity
  private transformer(chantierPourExport: ChantierPourExport, profil: ProfilCode): string[] {
    return [
      chantierPourExport.maille || NON_APPLICABLE,
      chantierPourExport.régionNom || NON_APPLICABLE,
      chantierPourExport.départementNom || NON_APPLICABLE,
      chantierPourExport.ministèreNom || NON_APPLICABLE,
      chantierPourExport.nom || NON_APPLICABLE,
      chantierPourExport.id || NON_APPLICABLE,
      chantierPourExport.estBaromètre ? OUI : NON,
      chantierPourExport.estTerritorialisé ? OUI : NON,
      chantierPourExport.tauxDAvancementDépartemental?.toString() || NON_APPLICABLE,
      chantierPourExport.tauxDAvancementRégional?.toString() || NON_APPLICABLE,
      this.masquerPourProfilDROM(profil, chantierPourExport.périmètreIds)
        ?  NON_APPLICABLE
        : chantierPourExport.tauxDAvancementNational?.toString() || NON_APPLICABLE,
      formaterMétéo(chantierPourExport.météo),
      chantierPourExport.responsablesLocaux?.join(' ') || NON_APPLICABLE,
      chantierPourExport.responsablesLocauxMails?.join(' ') || NON_APPLICABLE,
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
