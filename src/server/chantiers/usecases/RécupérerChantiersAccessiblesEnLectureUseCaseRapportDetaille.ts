import { chantier as chantierPrisma } from '@prisma/client';
import ChantierRepository from '@/server/domain/chantier/ChantierRepository.interface';
import Habilitation from '@/server/domain/utilisateur/habilitation/Habilitation';
import TerritoireRepository from '@/server/domain/territoire/TerritoireRepository.interface';
import { parseChantier } from '@/server/infrastructure/accès_données/chantier/ChantierSQLParser';
import { groupBy } from '@/client/utils/arrays';
import { objectEntries } from '@/client/utils/objects/objects';
import { Habilitations } from '@/server/domain/utilisateur/habilitation/Habilitation.interface';
import ChantierDatesDeMàjRepository from '@/server/domain/chantier/ChantierDatesDeMàjRepository.interface';
import { ProfilCode } from '@/server/domain/utilisateur/Utilisateur.interface';
import { FiltreQueryParams } from '@/server/chantiers/app/contrats/FiltreQueryParams';
import { MailleChantierContrat } from '@/server/chantiers/app/contrats/ChantierAccueilContratNew';
import Ministère from '@/server/domain/ministère/Ministère.interface';
import Axe from '@/server/domain/axe/Axe.interface';
import {
  ChantierRapportDetailleContrat,
  presenterEnChantierRapportDetaille,
} from '@/server/chantiers/app/contrats/ChantierRapportDetailleContrat';

const masquerPourDROM = (sessionProfil: string, mailleChantier: MailleChantierContrat) => {
  return sessionProfil === 'DROM' && mailleChantier === 'nationale';
};
const appliquerFiltreDrom = (chantier: ChantierRapportDetailleContrat, sessionProfil: string, mailleChantier: MailleChantierContrat) => {
  return masquerPourDROM(sessionProfil, mailleChantier) ? chantier.périmètreIds.includes('PER-018') : true;
};

const appliquerFiltreTerritorialise = (chantier: ChantierRapportDetailleContrat, mailleChantier: MailleChantierContrat): boolean => {
  return mailleChantier !== 'nationale' ? chantier.estTerritorialisé || !!chantier.tauxAvancementDonnéeTerritorialisée[mailleChantier] || !!chantier.météoDonnéeTerritorialisée[mailleChantier] : true;
};

const appliquerFiltre = (mailleChantier: MailleChantierContrat, codeInsee: string, sessionProfil: ProfilCode) => {

  return (chantier: ChantierRapportDetailleContrat): boolean => {
    return !!chantier.mailles[mailleChantier][codeInsee].estApplicable
      && appliquerFiltreDrom(chantier, sessionProfil, mailleChantier)
      && appliquerFiltreTerritorialise(chantier, mailleChantier);
  };
};

export default class RécupérerChantiersAccessiblesEnLectureUseCase {
  constructor(
    private readonly chantierRepository: ChantierRepository,
    private readonly chantierDatesDeMàjRepository: ChantierDatesDeMàjRepository,
    private readonly territoireRepository: TerritoireRepository,
  ) {}

  async run(habilitations: Habilitations, profil: ProfilCode, territoireCode: string, maille: 'DEPT' | 'REG', mailleChantier: MailleChantierContrat, codeInseeSelectionne: string, ministères: Ministère[], axes: Axe[], filtres: FiltreQueryParams): Promise<ChantierRapportDetailleContrat[]> {
    const habilitation = new Habilitation(habilitations);
    const chantiersLecture = habilitation.récupérerListeChantiersIdsAccessiblesEnLecture();
    const territoiresLecture = habilitation.récupérerListeTerritoireCodesAccessiblesEnLecture();

    const filtresPourChantier: FiltreQueryParams = {
      perimetres: filtres.perimetres,
      axes: filtres.axes.map(filtre => axes.find(axe => axe.id === filtre)!.nom),
      statut: filtres.statut,
      estTerritorialise: filtres.estTerritorialise,
      estBarometre: filtres.estBarometre,
    };

    const [chantiersRowsMaille, territoires, chantiersRowsDatesDeMàj ] = await Promise.all([
      this.chantierRepository.récupérerLesEntréesDeTousLesChantiersHabilitésNew(chantiersLecture, territoiresLecture, profil, maille, filtresPourChantier),
      this.territoireRepository.récupérerTousNew(maille),
      this.chantierDatesDeMàjRepository.récupérerDatesDeMiseÀJour(chantiersLecture, territoiresLecture),
    ]);

    const chantiersGroupésParId = groupBy<chantierPrisma>(chantiersRowsMaille, chantier => chantier.id);
    let chantiers = objectEntries(chantiersGroupésParId).map(([_, listeChantiers]) => presenterEnChantierRapportDetaille(territoireCode)(parseChantier(listeChantiers, territoires, ministères, chantiersRowsDatesDeMàj)))
      .filter(appliquerFiltre(mailleChantier, codeInseeSelectionne, profil));

    if (profil === 'DROM') {
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
