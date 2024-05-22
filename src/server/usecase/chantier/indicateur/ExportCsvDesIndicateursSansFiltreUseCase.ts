import {
  formaterDateHeure,
  formaterMétéo,
  formaterNumérique,
  NON,
  NON_APPLICABLE,
  OUI,
} from '@/server/infrastructure/export_csv/valeurs';
import { ProfilCode } from '@/server/domain/utilisateur/Utilisateur.interface';
import {
  IndicateurPourExport,
} from '@/server/usecase/chantier/indicateur/ExportCsvDesIndicateursSansFiltreUseCase.interface';
import Habilitation from '@/server/domain/utilisateur/habilitation/Habilitation';
import IndicateurRepository from '@/server/domain/indicateur/IndicateurRepository.interface';
import ChantierRepository from '@/server/domain/chantier/ChantierRepository.interface';
import { OptionsExport } from '@/server/usecase/chantier/OptionsExport';

const verifierOptionPerimetreIds = (optionsExport: OptionsExport, perimetreIds: string[]) => {
  return optionsExport.perimetreIds.length > 0 ? optionsExport.perimetreIds.some(perimetreId => perimetreIds.includes(perimetreId)) : true;
};
const verifierOptionEstBarometre = (optionsExport: OptionsExport, estBaromètre: boolean | null) => {
  return optionsExport.estBarometre ? !!estBaromètre : true;
};
const verifierOptionEstTerritorialise = (optionsExport: OptionsExport, estTerritorialise: boolean | null) => {
  return optionsExport.estTerritorialise ? !!estTerritorialise : true;
};
const verifierOptionStatut = (optionsExport: OptionsExport, chantierStatut: string | null) => {
  return chantierStatut ? optionsExport.listeStatuts.length > 0 ? optionsExport.listeStatuts.includes(chantierStatut) : true : true;
};

export default class ExportCsvDesIndicateursSansFiltreUseCase {

  public static readonly NOMS_COLONNES = [
    'Maille',
    'Région',
    'Département',
    'Ministère',
    'Axe',
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
  ) {}

  public async *run({ habilitation, profil, indicateurChunkSize, optionsExport }: { habilitation: Habilitation, profil: ProfilCode, indicateurChunkSize: number, optionsExport: OptionsExport }): AsyncGenerator<string[][]> {
    const chantierIdsLecture = await this._chantierRepository.récupérerChantierIdsEnLectureOrdonnésParNomAvecOptions(habilitation, optionsExport);
    const territoireCodesLecture = habilitation.récupérerListeTerritoireCodesAccessiblesEnLecture();

    for (let i = 0; i < chantierIdsLecture.length; i += indicateurChunkSize) {
      const partialChantierIds = chantierIdsLecture.slice(i, i + indicateurChunkSize);
      const indicateursPourExports = await this._indicateurRepository.récupérerPourExports(partialChantierIds, territoireCodesLecture);
      yield indicateursPourExports
        .filter(ind => !this.masquerIndicateurPourProfilDROM(profil, ind) && verifierOptionPerimetreIds(optionsExport, ind.périmètreIds) && verifierOptionEstBarometre(optionsExport, ind.chantierEstBaromètre) && verifierOptionEstTerritorialise(optionsExport, ind.chantierEstTerritorialise) && verifierOptionStatut(optionsExport, ind.chantierStatut))
        .map(ind => this.transformer(ind));
    }
  }

  private masquerIndicateurPourProfilDROM(profil: ProfilCode, indicateur : IndicateurPourExport) {
    return profil === 'DROM' && !indicateur.périmètreIds.includes('PER-018') && indicateur.maille === 'NAT';
  }

  private transformer(indicateurPourExport: IndicateurPourExport): string[] {
    return [
      indicateurPourExport.maille || NON_APPLICABLE,
      indicateurPourExport.régionNom || NON_APPLICABLE,
      indicateurPourExport.départementNom || NON_APPLICABLE,
      indicateurPourExport.chantierMinistèreNom || NON_APPLICABLE,
      indicateurPourExport.axe || NON_APPLICABLE,
      indicateurPourExport.chantierNom || NON_APPLICABLE,
      indicateurPourExport.chantierId || NON_APPLICABLE,
      indicateurPourExport.chantierEstBaromètre ? OUI : NON,
      formaterNumérique(indicateurPourExport.chantierAvancementGlobal),
      formaterMétéo(indicateurPourExport.météo),
      indicateurPourExport.nom || NON_APPLICABLE,
      formaterNumérique(indicateurPourExport.valeurInitiale),
      formaterDateHeure(indicateurPourExport.dateValeurInitiale),
      formaterNumérique(indicateurPourExport.valeurActuelle),
      formaterDateHeure(indicateurPourExport.dateValeurActuelle),
      formaterNumérique(indicateurPourExport.valeurCibleAnnuelle),
      formaterDateHeure(indicateurPourExport.dateValeurCibleAnnuelle),
      formaterNumérique(indicateurPourExport.avancementAnnuel),
      formaterNumérique(indicateurPourExport.valeurCible),
      formaterDateHeure(indicateurPourExport.dateValeurCible),
      formaterNumérique(indicateurPourExport.avancementGlobal),
    ];
  }
}
