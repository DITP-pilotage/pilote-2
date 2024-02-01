import { formaterDateHeure, formaterMétéo, NON, NON_APPLICABLE, OUI } from '@/server/infrastructure/export_csv/valeurs';
import { ProfilCode } from '@/server/domain/utilisateur/Utilisateur.interface';
import {
  IndicateurPourExport,
} from '@/server/usecase/chantier/indicateur/ExportCsvDesIndicateursSansFiltreUseCase.interface';
import Habilitation from '@/server/domain/utilisateur/habilitation/Habilitation';
import { Configuration } from '@/server/infrastructure/Configuration';
import IndicateurRepository from '@/server/domain/indicateur/IndicateurRepository.interface';
import ChantierRepository from '@/server/domain/chantier/ChantierRepository.interface';

export default class ExportCsvDesIndicateursSansFiltreUseCase {

  public static readonly NOMS_COLONNES = [
    'Maille',
    'Région',
    'Département',
    'Ministère',
    'Chantier',
    'Chantier Id',
    'Chantier du baromètre',
    'Taux d\'avancement à la cible (chantier)',
    'Météo',
    'Indicateur',
    'Valeur initiale',
    'Date valeur initiale',
    'Valeur actuelle',
    'Date valeur actuelle',
    'Valeur cible annuelle',
    'Date valeur cible annuelle',
    'Taux d\'avancement annuel',
    'Valeur cible',
    'Date valeur cible',
    'Taux d\'avancement à la cible (indicateur)',
  ];

  constructor(
    private readonly _chantierRepository: ChantierRepository,
    private readonly _indicateurRepository: IndicateurRepository,
    private readonly _config: Configuration,
  ) {}

  public async* run(habilitation: Habilitation, profil: ProfilCode): AsyncGenerator<string[][]> {
    const chantierIdsLecture = await this._chantierRepository.récupérerChantierIdsEnLectureOrdonnésParNom(habilitation);
    const territoireCodesLecture = habilitation.récupérerListeTerritoireCodesAccessiblesEnLecture();

    const chunkSize = this._config.exportCsvIndicateursChunkSize;
    for (let i = 0; i < chantierIdsLecture.length; i += chunkSize) {
      const partialChantierIds = chantierIdsLecture.slice(i, i + chunkSize);
      const indicateursPourExports = await this._indicateurRepository.récupérerPourExports(partialChantierIds, territoireCodesLecture);
      yield indicateursPourExports
        .filter(ind => !this.masquerIndicateurPourProfilDROM(profil, ind))
        .map(ind => this.transformer(ind));
    }
  }

  private masquerIndicateurPourProfilDROM(profil: ProfilCode, indicateur : IndicateurPourExport) {
    return profil == 'DROM' && !indicateur.périmètreIds.includes('PER-018') && indicateur.maille === 'NAT';
  }

  private transformer(indicateurPourExport: IndicateurPourExport): string[] {
    return [
      indicateurPourExport.maille || NON_APPLICABLE,
      indicateurPourExport.régionNom || NON_APPLICABLE,
      indicateurPourExport.départementNom || NON_APPLICABLE,
      indicateurPourExport.chantierMinistèreNom || NON_APPLICABLE,
      indicateurPourExport.chantierNom || NON_APPLICABLE,
      indicateurPourExport.chantierId || NON_APPLICABLE,
      indicateurPourExport.chantierEstBaromètre ? OUI : NON,
      indicateurPourExport.chantierAvancementGlobal?.toString() || NON_APPLICABLE,
      formaterMétéo(indicateurPourExport.météo),
      indicateurPourExport.nom || NON_APPLICABLE,
      indicateurPourExport.valeurInitiale?.toString() || NON_APPLICABLE,
      formaterDateHeure(indicateurPourExport.dateValeurInitiale),
      indicateurPourExport.valeurActuelle?.toString() || NON_APPLICABLE,
      formaterDateHeure(indicateurPourExport.dateValeurActuelle),
      indicateurPourExport.valeurCibleAnnuelle?.toString() || NON_APPLICABLE,
      formaterDateHeure(indicateurPourExport.dateValeurCibleAnnuelle),
      indicateurPourExport.avancementAnnuel?.toString() || NON_APPLICABLE,
      indicateurPourExport.valeurCible?.toString() || NON_APPLICABLE,
      formaterDateHeure(indicateurPourExport.dateValeurCible),
      indicateurPourExport.avancementGlobal?.toString() || NON_APPLICABLE,
    ];
  }
}
