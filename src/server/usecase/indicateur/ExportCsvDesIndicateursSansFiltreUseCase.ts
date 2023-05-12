import { dependencies } from '@/server/infrastructure/Dependencies';
import { Habilitations } from '@/server/domain/utilisateur/habilitation/Habilitation.interface';
import { formaterDateHeure, formaterMétéo, NON, NON_APPLICABLE, OUI } from '@/server/infrastructure/export_csv/valeurs';
import { IndicateurPourExport } from '@/server/usecase/indicateur/ExportCsvDesIndicateursSansFiltreUseCase.interface';

export default class ExportCsvDesIndicateursSansFiltreUseCase {

  public static readonly NOMS_COLONNES = [
    'Maille',
    'Région',
    'Département',
    'Ministère',
    'Chantier',
    'Chantier du baromètre',
    'Taux d\'avancement (chantier)',
    'Météo',
    'Indicateur',
    'Valeur initiale',
    'Date valeur initiale',
    'Valeur actuelle',
    'Date valeur actuelle',
    'Valeur cible',
    'Date valeur cible',
    'Taux d\'avancement (indicateur)',
  ];

  constructor(
    private readonly indicateurRepository = dependencies.getIndicateurRepository(),
  ) {}

  public async run(habilitations: Habilitations): Promise<string[][]> {
    const indicateursPourExports = await this.indicateurRepository.récupérerPourExports(habilitations);
    return indicateursPourExports.map(ind => this.transformer(ind));
  }

  private transformer(indicateurPourExport: IndicateurPourExport): string[] {
    return [
      indicateurPourExport.maille || NON_APPLICABLE,
      indicateurPourExport.régionNom || NON_APPLICABLE,
      indicateurPourExport.départementNom || NON_APPLICABLE,
      indicateurPourExport.chantierMinistèreNom || NON_APPLICABLE,
      indicateurPourExport.chantierNom || NON_APPLICABLE,
      indicateurPourExport.chantierEstBaromètre ? OUI : NON,
      indicateurPourExport.chantierAvancementGlobal?.toString() || NON_APPLICABLE,
      formaterMétéo(indicateurPourExport.météo),
      indicateurPourExport.nom || NON_APPLICABLE,
      indicateurPourExport.valeurInitiale?.toString() || NON_APPLICABLE,
      formaterDateHeure(indicateurPourExport.dateValeurInitiale),
      indicateurPourExport.valeurActuelle?.toString() || NON_APPLICABLE,
      formaterDateHeure(indicateurPourExport.dateValeurActuelle),
      indicateurPourExport.valeurCible?.toString() || NON_APPLICABLE,
      formaterDateHeure(indicateurPourExport.dateValeurCible),
      indicateurPourExport.avancementGlobal?.toString() || NON_APPLICABLE,
    ];
  }
}
