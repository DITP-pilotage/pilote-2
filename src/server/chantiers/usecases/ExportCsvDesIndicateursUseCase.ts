import {
  formaterDateHeureOuNonRenseignee,
  formaterMétéoOuNonApplicable,
  formaterMétéoOuNonRenseigne,
  formaterNumériqueOuValeurManquante,
  formaterNumériqueOuValeurNonApplicable,
  formaterNumériqueOuValeurNonRenseignee,
  NON,
  NON_APPLICABLE,
  NON_RENSEIGNEE,
  OUI,
} from '@/server/infrastructure/export_csv/valeurs';
import { ProfilCode } from '@/server/domain/utilisateur/Utilisateur.interface';
import { OptionsExport } from '@/server/usecase/chantier/OptionsExport';
import { ProfilEnum } from '@/server/app/enum/profil.enum';
import { IndicateurPourExport } from '@/server/chantiers/domain/IndicateurPourExport';
import {
  masquerPourProfilDROMEtMailleNat,
  verifierOptionEstBarometreEtEstTerritorialise,
  verifierOptionMeteo,
  verifierOptionPerimetreIds,
  verifierOptionStatut,
} from '@/server/chantiers/domain/ChantierPourExport';
import { IndicateurRepository } from '@/server/chantiers/domain/ports/IndicateurRepository';

const presenterEnIndicateurExportContrat = (indicateurPourExport: IndicateurPourExport, profil: string): string[] => {
  const donnees = [
    indicateurPourExport.maille === 'NAT' ? '1 - NAT' : indicateurPourExport.maille === 'REG' ? '2 - REG' : indicateurPourExport.maille === 'DEPT' ? '3 - DEPT' : NON_RENSEIGNEE,
    indicateurPourExport.régionNom || NON_APPLICABLE,
    indicateurPourExport.départementNom || NON_APPLICABLE,
    indicateurPourExport.départementNom && indicateurPourExport.codeInsee ? `${indicateurPourExport.codeInsee === '2A' ? '20A' : indicateurPourExport.codeInsee === '2B' ? '20B' : indicateurPourExport.codeInsee?.padStart(2, '0')} - ${indicateurPourExport.départementNom}` : NON_APPLICABLE,
    indicateurPourExport.chantierMinistèreNom || NON_RENSEIGNEE,
    indicateurPourExport.axe || NON_RENSEIGNEE,
    indicateurPourExport.chantierNom || NON_RENSEIGNEE,
    indicateurPourExport.chantierId || NON_RENSEIGNEE,
    indicateurPourExport.chantierEstBaromètre ? OUI : NON,
    indicateurPourExport.chantierEstApplicable ? formaterNumériqueOuValeurManquante(indicateurPourExport.chantierAvancementGlobal) : formaterNumériqueOuValeurNonApplicable(indicateurPourExport.chantierAvancementGlobal),
    indicateurPourExport.chantierEstApplicable ? formaterNumériqueOuValeurManquante(indicateurPourExport.chantierAvancementAnnuel) : formaterNumériqueOuValeurNonApplicable(indicateurPourExport.chantierAvancementAnnuel),
    indicateurPourExport.chantierEstApplicable ? formaterMétéoOuNonRenseigne(indicateurPourExport.météo) : formaterMétéoOuNonApplicable(indicateurPourExport.météo),
    indicateurPourExport.nom || NON_APPLICABLE,
    formaterNumériqueOuValeurNonRenseignee(indicateurPourExport.valeurInitiale),
    formaterDateHeureOuNonRenseignee(indicateurPourExport.dateValeurInitiale),
    formaterNumériqueOuValeurNonRenseignee(indicateurPourExport.valeurActuelle),
    formaterDateHeureOuNonRenseignee(indicateurPourExport.dateValeurActuelle),
    formaterNumériqueOuValeurNonRenseignee(indicateurPourExport.valeurCibleAnnuelle),
    formaterDateHeureOuNonRenseignee(indicateurPourExport.dateValeurCibleAnnuelle),
    formaterNumériqueOuValeurManquante(indicateurPourExport.avancementAnnuel),
    formaterNumériqueOuValeurNonRenseignee(indicateurPourExport.valeurCible),
    formaterDateHeureOuNonRenseignee(indicateurPourExport.dateValeurCible),
    formaterNumériqueOuValeurManquante(indicateurPourExport.avancementGlobal),
  ];

  return profil === ProfilEnum.DITP_ADMIN ? [...donnees, indicateurPourExport.chantierStatut || NON_APPLICABLE] : donnees;
};

interface Dependencies {
  indicateurRepository: IndicateurRepository
}

export default class ExportCsvDesIndicateursUseCase {

  public static readonly NOMS_COLONNES = (jalon: number): string[] => [
    'Maille',
    'Région',
    'Département',
    'Code INSEE - Nom du département',
    'Ministère',
    'Axe',
    'Chantier',
    'Chantier Id',
    'Chantier du baromètre',
    "Taux d'avancement à fin d'échéance 2026 (chantier)",
    `Taux d'avancement à fin d'échéance ${jalon} (chantier)`,
    'Météo',
    'Indicateur',
    'Valeur initiale',
    'Date valeur initiale',
    'Valeur actuelle',
    'Date valeur actuelle',
    'Valeur cible année en cours',
    'Date valeur cible année en cours',
    `Taux d'avancement à fin d'échéance ${jalon} (indicateur)`,
    "Valeur cible à fin d'échéance",
    "Date valeur cible à fin d'échéance 2026",
    "Taux d'avancement à fin d'échéance 2026 (indicateur)",
  ];

  private indicateurRepository: IndicateurRepository;

  constructor({ indicateurRepository }: Dependencies) {
    this.indicateurRepository = indicateurRepository;
  }

  public async *run({ chantierIds, territoireCodes, profil, indicateurChunkSize, optionsExport, jalon }: { chantierIds: string[], territoireCodes: string[], profil: ProfilCode, indicateurChunkSize: number, optionsExport: OptionsExport, jalon: number }): AsyncGenerator<string[][]> {
    for (let i = 0; i < chantierIds.length; i += indicateurChunkSize) {
      const partialChantierIds = chantierIds.slice(i, i + indicateurChunkSize);

      const input = partialChantierIds.map(id => this.indicateurRepository.récupérerPourExports(id, territoireCodes, jalon).then(listeIndicateurTerritoireExport =>
        (listeIndicateurTerritoireExport || []).reduce((acc, indicateursPourExport) => {
          if (
            indicateursPourExport &&
              !masquerPourProfilDROMEtMailleNat(profil, indicateursPourExport.périmètreIds, indicateursPourExport.maille)
              && verifierOptionPerimetreIds(optionsExport, indicateursPourExport.périmètreIds)
              && verifierOptionEstBarometreEtEstTerritorialise(optionsExport, indicateursPourExport.chantierEstBaromètre, indicateursPourExport.chantierEstTerritorialise)
              && verifierOptionStatut(optionsExport, indicateursPourExport.chantierStatut)
              && verifierOptionMeteo(optionsExport, indicateursPourExport.météo)
          ) {
            return [...acc, presenterEnIndicateurExportContrat(indicateursPourExport, profil)];
          }
          return acc;
        }, [] as string[][]),
      ));

      yield await Promise.all(input).then(result => result.flat());
    }
  }
}
