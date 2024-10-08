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
    'Taux d\'avancement à fin d\'échéance (chantier)',
    'Météo',
    'Indicateur',
    'Valeur initiale',
    'Date valeur initiale',
    'Valeur actuelle',
    'Date valeur actuelle',
    'Valeur cible année en cours',
    'Date valeur cible année en cours',
    'Taux d\'avancement de l\'année en cours',
    'Valeur cible à fin d\'échéance',
    'Date valeur cible à fin d\'échéance',
    'Taux d\'avancement à fin d\'échéance (indicateur)',
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
        .filter(ind => !this.masquerIndicateurPourProfilDROM(profil, ind) && verifierOptionPerimetreIds(optionsExport, ind.périmètreIds) && verifierOptionEstBarometreEtEstTerritorialise(optionsExport, ind.chantierEstBaromètre, ind.chantierEstTerritorialise) && verifierOptionStatut(optionsExport, ind.chantierStatut))
        .map(ind => this.transformer(ind, profil));
    }
  }

  private masquerIndicateurPourProfilDROM(profil: ProfilCode, indicateur : IndicateurPourExport) {
    return profil === ProfilEnum.DROM && !indicateur.périmètreIds.includes('PER-018') && indicateur.maille === 'NAT';
  }

  private transformer(indicateurPourExport: IndicateurPourExport, profil: string): string[] {
    const donnees = [
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

    return profil === ProfilEnum.DITP_ADMIN ? [...donnees, indicateurPourExport.chantierStatut || NON_APPLICABLE] : donnees;
  }
}
