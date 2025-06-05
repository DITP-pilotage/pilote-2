import {
  formaterMétéoOuNonRenseigne,
  formaterNumériqueOuValeurManquante,
  NON,
  NON_APPLICABLE,
  NON_RENSEIGNEE,
  OUI,
} from '@/server/infrastructure/export_csv/valeurs';
import { libellésTypesCommentaire } from '@/client/constants/libellésCommentaire';
import { libellésTypesObjectif } from '@/client/constants/libellésObjectif';
import { libellésTypesDécisionStratégique } from '@/client/constants/libellésDécisionStratégique';
import { ProfilCode, profilsTerritoriaux } from '@/server/domain/utilisateur/Utilisateur.interface';
import { OptionsExport } from '@/server/usecase/chantier/OptionsExport';
import { ProfilEnum } from '@/server/app/enum/profil.enum';
import { ChantierRepository } from '@/server/chantiers/domain/ports/ChantierRepository';
import {
  ChantierPourExport,
  masquerPourProfilDROM,
  masquerPourProfilDROMEtMailleNat,
  verifierOptionChantiersSignales,
  verifierOptionEstBarometreEtEstTerritorialise,
  verifierOptionMeteo,
  verifierOptionPerimetreIds,
  verifierOptionStatut,
} from '@/server/chantiers/domain/ChantierPourExport';

const presenterEnChantierExportContrat = (chantierPourExport: ChantierPourExport, profilCode: ProfilCode): string[] => {
  const donneesCommunes = [
    chantierPourExport.maille === 'NAT' ? '1 - NAT' : chantierPourExport.maille === 'REG' ? '2 - REG' : chantierPourExport.maille === 'DEPT' ? '3 - DEPT' : NON_APPLICABLE,
    chantierPourExport.régionNom || NON_APPLICABLE,
    chantierPourExport.départementNom || NON_APPLICABLE,
    chantierPourExport.départementNom && chantierPourExport.codeInsee ? `${chantierPourExport.codeInsee === '2A' ? '20A' : chantierPourExport.codeInsee === '2B' ? '20B' : chantierPourExport.codeInsee?.padStart(2, '0')} - ${chantierPourExport.départementNom}` : NON_APPLICABLE,
    chantierPourExport.ministèreNom || NON_RENSEIGNEE,
    chantierPourExport.axe || NON_RENSEIGNEE,
    chantierPourExport.nom || NON_RENSEIGNEE,
    chantierPourExport.id || NON_RENSEIGNEE,
    chantierPourExport.estBaromètre ? OUI : NON,
    chantierPourExport.estTerritorialisé ? OUI : NON,
    chantierPourExport.directeursProjet?.join(' ') || NON_RENSEIGNEE,
    chantierPourExport.directeursProjetMails?.join(' ') || NON_RENSEIGNEE,
    chantierPourExport.responsablesLocaux?.join(' ') || NON_RENSEIGNEE,
    chantierPourExport.responsablesLocauxMails?.join(' ') || NON_RENSEIGNEE,
    formaterNumériqueOuValeurManquante(chantierPourExport.tauxDAvancementAnnuel, true),
    formaterNumériqueOuValeurManquante(chantierPourExport.tauxDAvancementDépartemental, true),
    formaterNumériqueOuValeurManquante(chantierPourExport.tauxDAvancementRégional, true),
    masquerPourProfilDROM(profilCode, chantierPourExport.périmètreIds)
      ?  NON_APPLICABLE
      : formaterNumériqueOuValeurManquante(chantierPourExport.tauxDAvancementNational, true),
    formaterMétéoOuNonRenseigne(chantierPourExport.météo, true),
    chantierPourExport.synthèseDesRésultats || NON_RENSEIGNEE,
    chantierPourExport.objNotreAmbition || NON_RENSEIGNEE,
    chantierPourExport.objDéjàFait || NON_RENSEIGNEE,
    chantierPourExport.objÀFaire || NON_RENSEIGNEE,
  ];

  const donneesCommentairesNationaux = [
    chantierPourExport.decStratSuiviDesDécisions || NON_RENSEIGNEE,
    chantierPourExport.commAutresRésultatsNonCorrélésAuxIndicateurs || NON_RENSEIGNEE,
    chantierPourExport.commFreinsÀLever || NON_RENSEIGNEE,
    chantierPourExport.commActionsÀVenir || NON_RENSEIGNEE,
    chantierPourExport.commActionsÀValoriser || NON_RENSEIGNEE,
  ];

  const donneesCommentairesGeneraux = [
    chantierPourExport.commCommentairesSurLesDonnées || NON_RENSEIGNEE,
    chantierPourExport.commAutresRésultats || NON_RENSEIGNEE,
  ];

  const donneesProfil = profilsTerritoriaux.includes(profilCode) 
    ? [...donneesCommunes, ...donneesCommentairesGeneraux]  
    : [...donneesCommunes, ...donneesCommentairesNationaux, ...donneesCommentairesGeneraux];

  return profilCode === ProfilEnum.DITP_ADMIN ? [...donneesProfil, chantierPourExport.statut || NON_RENSEIGNEE] : donneesProfil;
};

interface Dependencies {
  chantierRepository: ChantierRepository;
}

export class ExportCsvDesChantiersUseCase {

  public static readonly NOMS_COLONNES = (jalon: number, profilCode: ProfilCode): string[] => {
    const colonnesCommunes = [
      'Maille',
      'Région',
      'Département',
      'Code INSEE - Nom du département',
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
      `Taux d'avancement à fin d'échéance ${jalon}`,
      "Taux d'avancement départemental à fin d'échéance 2026",
      "Taux d'avancement régional à fin d'échéance 2026",
      "Taux d'avancement national à fin d'échéance 2026",
      'Météo',
      'Synthèse des résultats',
      libellésTypesObjectif['notreAmbition'],
      libellésTypesObjectif['déjàFait'],
      libellésTypesObjectif['àFaire'],
    ];

    const colonnesCommentairesNationaux = [
      libellésTypesDécisionStratégique['suiviDesDécisionsStratégiques'],
      libellésTypesCommentaire['autresRésultatsObtenusNonCorrélésAuxIndicateurs'],
      libellésTypesCommentaire['risquesEtFreinsÀLever'],
      libellésTypesCommentaire['solutionsEtActionsÀVenir'],
      libellésTypesCommentaire['exemplesConcretsDeRéussite'],
    ];

    const colonnesCommentairesGeneraux = [
      libellésTypesCommentaire['commentairesSurLesDonnées'],
      libellésTypesCommentaire['autresRésultatsObtenus'],
    ];
  
    const colonnesProfil = profilsTerritoriaux.includes(profilCode) 
      ? [...colonnesCommunes, ...colonnesCommentairesGeneraux]  
      : [...colonnesCommunes, ...colonnesCommentairesNationaux, ...colonnesCommentairesGeneraux];
  
    return profilCode === ProfilEnum.DITP_ADMIN ? [...colonnesProfil, 'Statut'] : colonnesProfil;
  };

  private readonly chantierRepository: ChantierRepository;

  constructor({ chantierRepository } : Dependencies) {
    this.chantierRepository = chantierRepository;
  }

  public async* run({ chantierIds, territoireCodes, profil, chantierChunkSize, optionsExport, jalon }: { chantierIds: string[], territoireCodes: string[], profil: ProfilCode, chantierChunkSize: number, optionsExport: OptionsExport, jalon: number }): AsyncGenerator<string[][]> {
    for (let i = 0; i < chantierIds.length; i += chantierChunkSize) {
      const partialChantierIds = chantierIds.slice(i, i + chantierChunkSize);

      const input = partialChantierIds.map(id =>  this.chantierRepository.récupérerPourExports(id, territoireCodes, optionsExport, jalon).then(listerChantierTerritoireExport =>
        (listerChantierTerritoireExport || []).reduce((acc, chantierTerritoireExport) => {
          if (
            chantierTerritoireExport &&
            !masquerPourProfilDROMEtMailleNat(profil, chantierTerritoireExport.périmètreIds, chantierTerritoireExport.maille)
            && verifierOptionPerimetreIds(optionsExport, chantierTerritoireExport.périmètreIds)
            && verifierOptionEstBarometreEtEstTerritorialise(optionsExport, chantierTerritoireExport.estBaromètre)
            && verifierOptionStatut(optionsExport, chantierTerritoireExport.statut)
            && verifierOptionMeteo(optionsExport, chantierTerritoireExport.météo)
            && verifierOptionChantiersSignales(
              optionsExport, 
              chantierTerritoireExport.ecart,
              chantierTerritoireExport.tendance,
              chantierTerritoireExport.avancementTerritoire,
              chantierTerritoireExport.cibleAttendu,
              chantierTerritoireExport.aUnTauxAvancementDepartemental,
              chantierTerritoireExport.météo ?? 'NON_RENSEIGNEE',
              chantierTerritoireExport.aUnePropositionsValeurActuelle,
            )
          ) {
            return [...acc, presenterEnChantierExportContrat(chantierTerritoireExport, profil)];
          }
          return acc;
        }, [] as string[][]),
      ));

      yield await Promise.all(input).then(result => result.flat());
    }
  }
}
