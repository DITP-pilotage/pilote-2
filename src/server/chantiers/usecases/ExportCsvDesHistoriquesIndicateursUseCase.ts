import {
  formaterDateHeureOuNonRenseignee,
  formaterNumériqueOuValeurNonRenseignee,
  NON_APPLICABLE,
  NON_RENSEIGNEE,
} from '@/server/infrastructure/export_csv/valeurs';
import { ProfilCode } from '@/server/domain/utilisateur/Utilisateur.interface';
import { OptionsExport } from '@/server/usecase/chantier/OptionsExport';
import { HistoriqueIndicateurPourExport } from '@/server/chantiers/domain/HistoriqueIndicateurPourExport';
import {
  masquerPourProfilDROMEtMailleNat,
  verifierOptionEstBarometreEtEstTerritorialise,
  verifierOptionMeteo,
  verifierOptionPerimetreIds,
  verifierOptionStatut,
} from '@/server/chantiers/domain/ChantierPourExport';
import { IndicateurRepository } from '@/server/chantiers/domain/ports/IndicateurRepository';
import { verifierApplicabiliteMaille } from '@/server/chantiers/domain/IndicateurPourExport';

const presenterEnHistoriqueIndicateurExportContrat = (historiqueIndicateurPourExport: HistoriqueIndicateurPourExport): string[] => {
  return [
    historiqueIndicateurPourExport.maille === 'NAT' ? '1 - NAT' : historiqueIndicateurPourExport.maille === 'REG' ? '2 - REG' : historiqueIndicateurPourExport.maille === 'DEPT' ? '3 - DEPT' : NON_RENSEIGNEE,
    historiqueIndicateurPourExport.régionNom || NON_APPLICABLE,
    historiqueIndicateurPourExport.départementNom || NON_APPLICABLE,
    historiqueIndicateurPourExport.départementNom && historiqueIndicateurPourExport.codeInsee ? `${historiqueIndicateurPourExport.codeInsee === '2A' ? '20A' : historiqueIndicateurPourExport.codeInsee === '2B' ? '20B' : historiqueIndicateurPourExport.codeInsee?.padStart(2, '0')} - ${historiqueIndicateurPourExport.départementNom}` : NON_APPLICABLE,
    historiqueIndicateurPourExport.chantierNom || NON_RENSEIGNEE,
    historiqueIndicateurPourExport.chantierId || NON_RENSEIGNEE,
    historiqueIndicateurPourExport.nom || NON_APPLICABLE,
    formaterNumériqueOuValeurNonRenseignee(historiqueIndicateurPourExport.valeurInitiale, historiqueIndicateurPourExport.estApplicable),
    formaterDateHeureOuNonRenseignee(historiqueIndicateurPourExport.dateValeurInitiale, historiqueIndicateurPourExport.estApplicable),
    formaterNumériqueOuValeurNonRenseignee(historiqueIndicateurPourExport.valeurCibleAnnuelle, historiqueIndicateurPourExport.estApplicable),
    formaterDateHeureOuNonRenseignee(historiqueIndicateurPourExport.dateValeurCibleAnnuelle, historiqueIndicateurPourExport.estApplicable),
    formaterNumériqueOuValeurNonRenseignee(historiqueIndicateurPourExport.valeurCible, historiqueIndicateurPourExport.estApplicable),
    formaterDateHeureOuNonRenseignee(historiqueIndicateurPourExport.dateValeurCible, historiqueIndicateurPourExport.estApplicable),
    formaterNumériqueOuValeurNonRenseignee(historiqueIndicateurPourExport.valeurActuelle, historiqueIndicateurPourExport.estApplicable),
    formaterDateHeureOuNonRenseignee(historiqueIndicateurPourExport.dateValeurActuelle, historiqueIndicateurPourExport.estApplicable),
  ];
};

interface Dependencies {
  indicateurRepository: IndicateurRepository
}

export class ExportCsvDesHistoriquesIndicateursUseCase {

  public static readonly NOMS_COLONNES = (): string[] => {
    return [
      'Maille',
      'Région',
      'Département',
      'Code INSEE - Nom du département',
      'Chantier',
      'Chantier Id',
      'Indicateur',
      'Valeur initiale',
      'Date valeur initiale',
      'Valeur cible année en cours',
      'Date valeur cible année en cours',
      "Valeur cible à fin d'échéance",
      "Date valeur cible à fin d'échéance 2026",
      'Valeur actuelle',
      'Date valeur actuelle',
    ];
  };

  private indicateurRepository: IndicateurRepository;

  constructor({ indicateurRepository }: Dependencies) {
    this.indicateurRepository = indicateurRepository;
  }

  public async *run({ chantierIds, territoireCodes, profil, indicateurChunkSize, optionsExport, jalon }: { chantierIds: string[], territoireCodes: string[], profil: ProfilCode, indicateurChunkSize: number, optionsExport: OptionsExport, jalon: number }): AsyncGenerator<string[][]> {
    for (let i = 0; i < chantierIds.length; i += indicateurChunkSize) {
      const partialChantierIds = chantierIds.slice(i, i + indicateurChunkSize);

      const input = partialChantierIds.map(id => this.indicateurRepository.récupérerHistoriquePourExports(id, territoireCodes, jalon).then(listeIndicateurTerritoireExport =>
        (listeIndicateurTerritoireExport || []).reduce((acc, historiqueIndicateursPourExport) => {
          if (
            historiqueIndicateursPourExport &&
              !masquerPourProfilDROMEtMailleNat(profil, historiqueIndicateursPourExport.périmètreIds, historiqueIndicateursPourExport.maille)
              && verifierApplicabiliteMaille(historiqueIndicateursPourExport.maillesApplicables, historiqueIndicateursPourExport.maille)
              && verifierOptionPerimetreIds(optionsExport, historiqueIndicateursPourExport.périmètreIds)
              && verifierOptionEstBarometreEtEstTerritorialise(optionsExport, historiqueIndicateursPourExport.chantierEstBaromètre, historiqueIndicateursPourExport.chantierEstTerritorialise)
              && verifierOptionStatut(optionsExport, historiqueIndicateursPourExport.chantierStatut)
              && verifierOptionMeteo(optionsExport, historiqueIndicateursPourExport.météo)
          ) {
            return [...acc, presenterEnHistoriqueIndicateurExportContrat(historiqueIndicateursPourExport)];
          }
          return acc;
        }, [] as string[][]),
      ));

      yield await Promise.all(input).then(result => result.flat());
    }
  }
}
