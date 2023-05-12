/* eslint-disable @typescript-eslint/dot-notation */
import { dependencies } from '@/server/infrastructure/Dependencies';
import { Habilitations } from '@/server/domain/utilisateur/habilitation/Habilitation.interface';
import { formaterMétéo, NON, NON_APPLICABLE, OUI } from '@/server/infrastructure/export_csv/valeurs';
import { ChantierPourExport } from '@/server/usecase/chantier/ExportCsvDesChantiersSansFiltreUseCase.interface';
import { libellésTypesCommentaire } from '@/client/constants/libellésCommentaire';
import { libellésTypesObjectif } from '@/client/constants/libellésObjectif';
import { libellésTypesDécisionStratégique } from '@/client/constants/libellésDécisionStratégique';

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
    libellésTypesDécisionStratégique['suivi_des_decisions'],
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

  public async run(habilitations: Habilitations): Promise<string[][]> {
    const chantiersPourExports = await this.chantierRepository.récupérerPourExports(habilitations);
    return chantiersPourExports.map(c => this.transformer(c));
  }

  // eslint-disable-next-line sonarjs/cognitive-complexity
  private transformer(chantierPourExport: ChantierPourExport): string[] {
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
      chantierPourExport.tauxDAvancementNational?.toString() || NON_APPLICABLE,
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
