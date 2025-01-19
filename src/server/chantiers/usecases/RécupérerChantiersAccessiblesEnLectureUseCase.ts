import {
  chantier_identite as PrismaChantierIdentite,
  chantier_territoire as PrismaChantierTerritoire,
  chantier_territoire_jalon as PrismaChantierTerritoireJalon,
} from '@prisma/client';
import ChantierRepository from '@/server/domain/chantier/ChantierRepository.interface';
import Habilitation from '@/server/domain/utilisateur/habilitation/Habilitation';
import TerritoireRepository from '@/server/domain/territoire/TerritoireRepository.interface';
import { parseChantier } from '@/server/infrastructure/accès_données/chantier/ChantierSQLParser';
import { groupBy } from '@/client/utils/arrays';
import { objectEntries } from '@/client/utils/objects/objects';
import { Habilitations } from '@/server/domain/utilisateur/habilitation/Habilitation.interface';
import { ProfilCode } from '@/server/domain/utilisateur/Utilisateur.interface';
import { FiltreQueryParams, SortingParams } from '@/server/chantiers/app/contrats/FiltreQueryParams';
import {
  ChantierAccueilContrat,
  MailleChantierContrat,
  presenterEnChantierAccueilContrat,
} from '@/server/chantiers/app/contrats/ChantierAccueilContratNew';
import Ministère from '@/server/domain/ministère/Ministère.interface';
import Axe from '@/server/domain/axe/Axe.interface';
import { ProfilEnum } from '@/server/app/enum/profil.enum';

const masquerPourDROM = (sessionProfil: string, mailleChantier: MailleChantierContrat) => {
  return sessionProfil === ProfilEnum.DROM && mailleChantier === 'nationale';
};
const appliquerFiltreDrom = (chantier: ChantierAccueilContrat, sessionProfil: string, mailleChantier: MailleChantierContrat) => {
  return masquerPourDROM(sessionProfil, mailleChantier) ? chantier.périmètreIds.includes('PER-018') : true;
};

const appliquerFiltreTerritorialise = (chantier: ChantierAccueilContrat, mailleChantier: MailleChantierContrat): boolean => {
  return mailleChantier !== 'nationale' ? chantier.estTerritorialisé || !!chantier.tauxAvancementDonnéeTerritorialisée[mailleChantier] || !!chantier.météoDonnéeTerritorialisée[mailleChantier] : true;
};

const appliquerFiltre = (mailleChantier: MailleChantierContrat, territoireCode: string, sessionProfil: ProfilCode) => {
  return (chantier: ChantierAccueilContrat): boolean => {
    return !!chantier.mailles[mailleChantier][territoireCode].estApplicable
      && appliquerFiltreDrom(chantier, sessionProfil, mailleChantier)
      && appliquerFiltreTerritorialise(chantier, mailleChantier);
  };
};

export default class RécupérerChantiersAccessiblesEnLectureUseCase {
  constructor(
    private readonly chantierRepository: ChantierRepository,
    private readonly territoireRepository: TerritoireRepository,
  ) {}

  async run(habilitations: Habilitations, profil: ProfilCode, territoireCode: string, maille: 'DEPT' | 'REG', mailleChantier: MailleChantierContrat, ministères: Ministère[], axes: Axe[], filtres: FiltreQueryParams, sorting: SortingParams): Promise<ChantierAccueilContrat[]> {
    const habilitation = new Habilitation(habilitations);
    const chantiersLecture = habilitation.récupérerListeChantiersIdsAccessiblesEnLecture();
    const territoiresLecture = habilitation.récupérerListeTerritoireCodesAccessiblesEnLecture();

    const filtresPourChantier: FiltreQueryParams = {
      perimetres: filtres.perimetres,
      axes: filtres.axes.map(filtre => axes.find(axe => axe.id === filtre)!.nom),
      statut: filtres.statut,
      estTerritorialise: filtres.estTerritorialise,
      estBarometre: filtres.estBarometre,
      valeurDeLaRecherche: filtres.valeurDeLaRecherche,
    };

    const [chantiersRowsMaille, territoires ] = await Promise.all([
      this.chantierRepository.récupérerLesEntréesDeTousLesChantiersHabilitésNew(chantiersLecture, territoiresLecture, profil, filtresPourChantier, sorting),
      this.territoireRepository.récupérerTousNew(),
    ]);

    const init = chantiersRowsMaille.filter(chantier => chantier.territoire_code === territoireCode).reduce((acc, val) => {
      return {
        ...acc,
        [val.id]: [],
      };
    }, {});


    const chantiersGroupésParId = groupBy<(PrismaChantierTerritoire & { chantier_identite: PrismaChantierIdentite, chantier_territoire_jalon: PrismaChantierTerritoireJalon[] })>(chantiersRowsMaille, chantier => chantier.id, init);
    let chantiers = objectEntries(chantiersGroupésParId).map(([, listeChantiers]) => presenterEnChantierAccueilContrat(territoireCode)(parseChantier(listeChantiers, territoires, ministères)))
      .filter(appliquerFiltre(mailleChantier, territoireCode, profil));

    if (profil === ProfilEnum.DROM) {
      chantiers = chantiers.map(chantier => {
        if (!chantier.périmètreIds.includes('PER-018')) {
          chantier.mailles.nationale.FR.avancement.global = null;
          chantier.mailles.nationale.FR.avancement.annuel = null;
          chantier.mailles.nationale.FR.météo = 'NON_RENSEIGNEE';
        }

        return chantier;
      });
    }

    return chantiers;
  }
}
