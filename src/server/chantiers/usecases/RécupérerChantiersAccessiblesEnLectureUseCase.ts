import { ChantierRepository } from '@/server/chantiers/domain/ports/ChantierRepository';
import { Habilitation } from '@/server/gestion-utilisateur/domain/habilitation/Habilitation';
import { Habilitations } from '@/server/gestion-utilisateur/domain/habilitation/Habilitation.interface';
import { ProfilCode } from '@/server/domain/utilisateur/Utilisateur.interface';
import { FiltreQueryParams, SortingParams } from '@/server/chantiers/app/contrats/FiltreQueryParams';
import {
  ChantierAccueilContrat,
  MailleChantierContrat,
  presenterEnChantierAccueilContratNew,
} from '@/server/chantiers/app/contrats/ChantierAccueilContratNew';
import { Ministere } from '@/server/chantiers/domain/Ministere';
import { Axe } from '@/server/chantiers/domain/Axe';
import { ProfilEnum } from '@/server/app/enum/profil.enum';
import { PrismaChantier } from '@/server/chantiers/infrastructure/adapters/PrismaChantier';
import { TerritoireRepository } from '@/server/chantiers/domain/ports/TerritoireRepository';

const masquerPourDROM = (sessionProfil: string, mailleChantier: MailleChantierContrat) => {
  return sessionProfil === ProfilEnum.DROM && mailleChantier === 'nationale';
};
const appliquerFiltreDrom = (chantier: PrismaChantier, sessionProfil: string, mailleChantier: MailleChantierContrat) => {
  return masquerPourDROM(sessionProfil, mailleChantier) ? chantier.perimetre_ids.includes('PER-018') : true;
};

const appliquerFiltreTerritorialise = (chantier: PrismaChantier, mailleChantier: MailleChantierContrat): boolean => {
  return mailleChantier !== 'nationale'
    ? chantier.est_territorialise || (
      mailleChantier === 'departementale'
        ? !!chantier.possede_taux_avancement_departemental || !!chantier.possede_meteo_departemental
        : !!chantier.possede_taux_avancement_regional  || !!chantier.possede_meteo_regional
    )
    : true;
};

const appliquerFiltre = (mailleChantier: MailleChantierContrat, sessionProfil: ProfilCode) => {
  return (chantier: PrismaChantier): boolean => {
    return appliquerFiltreDrom(chantier, sessionProfil, mailleChantier)
      && appliquerFiltreTerritorialise(chantier, mailleChantier);
  };
};

const appliquerTri = (sorting: SortingParams, mailleChantier: MailleChantierContrat, territoireCode: string) => (chantierA: ChantierAccueilContrat, chantierB: ChantierAccueilContrat) => {
  switch (sorting.id) {
    case 'avancement': {
      const donneeTriA = chantierA.mailles[mailleChantier][territoireCode].avancement.global;
      const donneeTriB = chantierB.mailles[mailleChantier][territoireCode].avancement.global;

      if (donneeTriA === null) {
        return 1;
      } else if (donneeTriB === null) {
        return -1;
      } else {
        return sorting.desc
          ? donneeTriB - donneeTriA
          : donneeTriA - donneeTriB;
      }
    }
    case 'météo': {
      const orderMétéo = { 'SOLEIL': 1, 'COUVERT': 2, 'NUAGE': 3, 'ORAGE': 4, 'NON_RENSEIGNEE': null, 'NON_NECESSAIRE': null };
      const donneeTriA = orderMétéo[chantierA.mailles[mailleChantier][territoireCode].météo || 'NON_RENSEIGNEE'];
      const donneeTriB = orderMétéo[chantierB.mailles[mailleChantier][territoireCode].météo || 'NON_RENSEIGNEE'];

      if (donneeTriA === null) {
        return 1;
      } else if (donneeTriB === null) {
        return -1;
      } else {
        return sorting.desc
          ? donneeTriA - donneeTriB
          : donneeTriB - donneeTriA;
      }
    }
    case 'dateDeMàjDonnéesQuantitatives': {
      const donneeTriA = chantierA.mailles[mailleChantier][territoireCode].dateDeMàjDonnéesQuantitatives;
      const donneeTriB = chantierB.mailles[mailleChantier][territoireCode].dateDeMàjDonnéesQuantitatives;

      if (donneeTriA === null) {
        return 1;
      } else if (donneeTriB === null) {
        return -1;
      } else {
        return sorting.desc
          ? donneeTriB.localeCompare(donneeTriA)
          : donneeTriA.localeCompare(donneeTriB);
      }
    }
    case 'dateDeMàjDonnéesQualitatives': {
      const donneeTriA = chantierA.mailles[mailleChantier][territoireCode].dateDeMàjDonnéesQualitatives;
      const donneeTriB = chantierB.mailles[mailleChantier][territoireCode].dateDeMàjDonnéesQualitatives;

      if (donneeTriA === null) {
        return 1;
      } else if (donneeTriB === null) {
        return -1;
      } else {
        return sorting.desc
          ? donneeTriB.localeCompare(donneeTriA)
          : donneeTriA.localeCompare(donneeTriB);
      }
    }
    case 'tendance': {
      const orderMétéo = { 'HAUSSE': 1, 'STAGNATION': 2, 'BAISSE': 3, 'NON_APPLICABLE': null };
      const donneeTriA = orderMétéo[chantierA.mailles[mailleChantier][territoireCode].tendance || 'NON_APPLICABLE'];
      const donneeTriB = orderMétéo[chantierB.mailles[mailleChantier][territoireCode].tendance || 'NON_APPLICABLE'];

      if (donneeTriA === null) {
        return 1;
      } else if (donneeTriB === null) {
        return -1;
      } else {
        return sorting.desc
          ? donneeTriA - donneeTriB
          : donneeTriB - donneeTriA;
      }
    }
    case 'écart': {
      const donneeTriA = chantierA.mailles[mailleChantier][territoireCode].écart;
      const donneeTriB = chantierB.mailles[mailleChantier][territoireCode].écart;

      if (donneeTriA === null) {
        return 1;
      } else if (donneeTriB === null) {
        return -1;
      } else {
        return sorting.desc
          ? donneeTriB - donneeTriA
          : donneeTriA - donneeTriB;
      }
    }
  }
  return 0;
};

export class RécupérerChantiersAccessiblesEnLectureUseCase {
  constructor(
    private readonly chantierRepository: ChantierRepository,
    private readonly territoireRepository: TerritoireRepository,
  ) {}

  async run(habilitations: Habilitations, profil: ProfilCode, territoireCode: string, mailleChantier: MailleChantierContrat, ministères: Ministere[], mapAxe: Map<string, Axe>, filtres: FiltreQueryParams, sorting: SortingParams, jalon: number): Promise<ChantierAccueilContrat[]> {
    const habilitation = new Habilitation(habilitations);
    const chantiersLecture = habilitation.récupérerListeChantiersIdsAccessiblesEnLecture();
    const territoiresLecture = habilitation.récupérerListeTerritoireCodesAccessiblesEnLecture();

    const filtresPourChantier: FiltreQueryParams = {
      perimetres: filtres.perimetres,
      axes: filtres.axes.map(filtre => mapAxe.get(filtre)!.nom),
      statut: filtres.statut,
      meteos: filtres.meteos,
      estTerritorialise: filtres.estTerritorialise,
      estBarometre: filtres.estBarometre,
      valeurDeLaRecherche: filtres.valeurDeLaRecherche,
    };

    const territoires = await this.territoireRepository.récupérerTousNew();

    return this.chantierRepository.récupérerLesEntréesDeTousLesChantiersHabilitésNew(chantiersLecture, territoiresLecture, profil, filtresPourChantier, territoireCode, jalon)
      .then(listePrismaChantier => listePrismaChantier
        .reduce((acc, chantierIdentite) => {
          // on devrait pouvoir appliquer le filtre plus tôt
          const chantierTerritoireSelectionne = chantierIdentite.chantier_territoire.find(chantierTerritoire => chantierTerritoire.territoire_code === territoireCode);
          if (chantierTerritoireSelectionne?.est_applicable && appliquerFiltre(mailleChantier, profil)(chantierIdentite)) {
            return [...acc, presenterEnChantierAccueilContratNew(chantierIdentite, territoires, ministères, territoireCode, profil)];
          }
          return acc;
        }, [] as ChantierAccueilContrat[])
        .sort(appliquerTri(sorting, mailleChantier, territoireCode)),
      );
  }
}
