/* eslint-disable @typescript-eslint/dot-notation */
import { formaterMétéo, formaterNumérique, NON, NON_APPLICABLE, OUI } from '@/server/infrastructure/export_csv/valeurs';
import { ChantierPourExport } from '@/server/usecase/chantier/ExportCsvDesChantiersSansFiltreUseCase.interface';
import { libellésTypesCommentaire } from '@/client/constants/libellésCommentaire';
import { libellésTypesObjectif } from '@/client/constants/libellésObjectif';
import { libellésTypesDécisionStratégique } from '@/client/constants/libellésDécisionStratégique';
import { ProfilCode } from '@/server/domain/utilisateur/Utilisateur.interface';
import Habilitation from '@/server/domain/utilisateur/habilitation/Habilitation';
import ChantierRepository from '@/server/domain/chantier/ChantierRepository.interface';
import { OptionsExport } from '@/server/usecase/chantier/OptionsExport';
import { ProfilEnum } from '@/server/app/enum/profil.enum';

const verifierOptionPerimetreIds = (optionsExport: OptionsExport, perimetreIds: string[]) => {
  return optionsExport.perimetreIds.length > 0 ? optionsExport.perimetreIds.some(perimetreId => perimetreIds.includes(perimetreId)) : true;
};

const verifierOptionEstBarometreEtEstTerritorialise = (optionsExport: OptionsExport, estBaromètre: boolean | null, estTerritorialisé: boolean | null) => {
  return optionsExport.estBarometre && optionsExport.estTerritorialise ? estBaromètre || estTerritorialisé : optionsExport.estBarometre ? !!estBaromètre : optionsExport.estTerritorialise ? !!estTerritorialisé : true;
};

const verifierOptionStatut = (optionsExport: OptionsExport, chantierStatut: string | null) => {
  return chantierStatut ? optionsExport.listeStatuts.length > 0 ? optionsExport.listeStatuts.includes(chantierStatut) : true : true;
};

export class ExportCsvDesChantiersUseCase {
  public static readonly NOMS_COLONNES = [
    'Maille',
    'Région',
    'Département',
    'Ministère',
    'Axe',
    'Chantier',
    'Chantier Id',
    'Chantier du baromètre',
    'Chantier territorialisé',
    'Directeur projet',
    'Contact directeur projet',
    'Responsable local',
    'Contact responsable local',
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
    private readonly _chantierRepository: ChantierRepository,
  ) {}

  public async* run({ habilitation, profil, chantierChunkSize, optionsExport }: { habilitation: Habilitation, profil: ProfilCode, chantierChunkSize: number, optionsExport: OptionsExport }): AsyncGenerator<string[][]> {
    const chantierIdsLecture = await this._chantierRepository.récupérerChantierIdsEnLectureOrdonnésParNomAvecOptions(habilitation, optionsExport);
    const territoireCodesLecture = habilitation.récupérerListeTerritoireCodesAccessiblesEnLecture();

    for (let i = 0; i < chantierIdsLecture.length; i += chantierChunkSize) {
      const partialChantierIds = chantierIdsLecture.slice(i, i + chantierChunkSize);
      const partialResult = await this._chantierRepository.récupérerPourExports(partialChantierIds, territoireCodesLecture);
      yield partialResult
        .filter(chantier => !this.masquerChantierPourProfilDROM(profil, chantier) && verifierOptionPerimetreIds(optionsExport, chantier.périmètreIds) && verifierOptionEstBarometreEtEstTerritorialise(optionsExport, chantier.estBaromètre, chantier.estTerritorialisé) && verifierOptionStatut(optionsExport, chantier.statut))
        .map(chantier => this.transformer(chantier, profil));
    }
  }

  private masquerPourProfilDROM(profil: ProfilCode, périmètreIds : string[]) {
    return profil == ProfilEnum.DROM && !périmètreIds.includes('PER-018');
  }

  private masquerChantierPourProfilDROM(profil: ProfilCode, chantier : ChantierPourExport) {
    return this.masquerPourProfilDROM(profil, chantier.périmètreIds) && chantier.maille === 'NAT';
  }

  // eslint-disable-next-line sonarjs/cognitive-complexity
  private transformer(chantierPourExport: ChantierPourExport, profil: ProfilCode): string[] {
    const donnees = [
      chantierPourExport.maille || NON_APPLICABLE,
      chantierPourExport.régionNom || NON_APPLICABLE,
      chantierPourExport.départementNom || NON_APPLICABLE,
      chantierPourExport.ministèreNom || NON_APPLICABLE,
      chantierPourExport.axe || NON_APPLICABLE,
      chantierPourExport.nom || NON_APPLICABLE,
      chantierPourExport.id || NON_APPLICABLE,
      chantierPourExport.estBaromètre ? OUI : NON,
      chantierPourExport.estTerritorialisé ? OUI : NON,
      chantierPourExport.directeursProjet?.join(' ') || NON_APPLICABLE,
      chantierPourExport.directeursProjetMails?.join(' ') || NON_APPLICABLE,      
      chantierPourExport.responsablesLocaux?.join(' ') || NON_APPLICABLE,
      chantierPourExport.responsablesLocauxMails?.join(' ') || NON_APPLICABLE,
      formaterNumérique(chantierPourExport.tauxDAvancementDépartemental),
      formaterNumérique(chantierPourExport.tauxDAvancementRégional),
      this.masquerPourProfilDROM(profil, chantierPourExport.périmètreIds)
        ?  NON_APPLICABLE
        : formaterNumérique(chantierPourExport.tauxDAvancementNational),
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
    return profil === ProfilEnum.DITP_ADMIN ? [...donnees, chantierPourExport.statut || NON_APPLICABLE] : donnees;
  }
}
