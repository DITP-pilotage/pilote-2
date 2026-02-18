import Habilitation from "@/server/domain/utilisateur/habilitation/Habilitation";
import { Habilitations } from "@/server/domain/utilisateur/habilitation/Habilitation.interface";
import { ProfilCode } from "@/server/domain/utilisateur/Utilisateur.interface";
import Ministère from "@/server/domain/ministère/Ministère.interface";
import Axe from "@/server/domain/axe/Axe.interface";
import { ProfilEnum } from "@/server/app/enum/profil.enum";
import { MailleChantierContrat } from "@/server/chantiers/app/contrats/ChantierAccueilContratV2";
import { PrismaChantier } from "@/server/chantiers/domain/PrismaChantier";
import {
  FiltreQueryParams,
  SortingParams,
} from "@/server/chantiers/app/contrats/FiltreQueryParams";
import { ChantierRepository } from "@/server/chantiers/domain/ports/ChantierRepository";
import { TerritoireRepository } from "@/server/chantiers/domain/ports/TerritoireRepository";
import {
  ChantierRapportDetailleContrat,
  presenterEnChantierRapportDetaille,
} from "@/server/chantiers/app/contrats/ChantierRapportDetailleContratV2";

const masquerPourDROM = (
  sessionProfil: string,
  mailleChantier: MailleChantierContrat,
) => {
  return sessionProfil === ProfilEnum.DROM && mailleChantier === "nationale";
};
const appliquerFiltreDrom = (
  chantier: PrismaChantier,
  sessionProfil: string,
  mailleChantier: MailleChantierContrat,
) => {
  return masquerPourDROM(sessionProfil, mailleChantier)
    ? chantier.perimetre_ids.includes("PER-018")
    : true;
};

const appliquerFiltreTerritorialise = (
  chantier: PrismaChantier,
  mailleChantier: MailleChantierContrat,
): boolean => {
  return mailleChantier !== "nationale"
    ? chantier.est_territorialise ||
        (mailleChantier === "departementale"
          ? !!chantier.possede_taux_avancement_departemental ||
            !!chantier.possede_meteo_departemental
          : !!chantier.possede_taux_avancement_regional ||
            !!chantier.possede_meteo_regional)
    : true;
};

const appliquerFiltre = (
  mailleChantier: MailleChantierContrat,
  sessionProfil: ProfilCode,
) => {
  return (chantier: PrismaChantier): boolean => {
    return (
      appliquerFiltreDrom(chantier, sessionProfil, mailleChantier) &&
      appliquerFiltreTerritorialise(chantier, mailleChantier)
    );
  };
};

const appliquerTri =
  (
    sorting: SortingParams,
    mailleChantier: MailleChantierContrat,
    territoireCode: string,
  ) =>
  (
    chantierA: ChantierRapportDetailleContrat,
    chantierB: ChantierRapportDetailleContrat,
  ) => {
    switch (sorting.id) {
      case "avancement": {
        const donneeTriA =
          chantierA.mailles[mailleChantier][territoireCode].avancement.global;
        const donneeTriB =
          chantierB.mailles[mailleChantier][territoireCode].avancement.global;

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
      case "météo": {
        const orderMétéo = {
          SOLEIL: 1,
          COUVERT: 2,
          NUAGE: 3,
          ORAGE: 4,
          NON_RENSEIGNEE: null,
          NON_NECESSAIRE: null,
        };
        const donneeTriA =
          orderMétéo[
            chantierA.mailles[mailleChantier][territoireCode].météo ||
              "NON_RENSEIGNEE"
          ];
        const donneeTriB =
          orderMétéo[
            chantierB.mailles[mailleChantier][territoireCode].météo ||
              "NON_RENSEIGNEE"
          ];

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
      case "dateDeMàjDonnéesQuantitatives": {
        const donneeTriA =
          chantierA.mailles[mailleChantier][territoireCode]
            .dateDeMàjDonnéesQuantitatives;
        const donneeTriB =
          chantierB.mailles[mailleChantier][territoireCode]
            .dateDeMàjDonnéesQuantitatives;

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
      case "dateDeMàjDonnéesQualitatives": {
        const donneeTriA =
          chantierA.mailles[mailleChantier][territoireCode]
            .dateDeMàjDonnéesQualitatives;
        const donneeTriB =
          chantierB.mailles[mailleChantier][territoireCode]
            .dateDeMàjDonnéesQualitatives;

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
      case "tendance": {
        const orderMétéo = {
          HAUSSE: 1,
          STAGNATION: 2,
          BAISSE: 3,
          NON_APPLICABLE: null,
        };
        const donneeTriA =
          orderMétéo[
            chantierA.mailles[mailleChantier][territoireCode].tendance ||
              "NON_APPLICABLE"
          ];
        const donneeTriB =
          orderMétéo[
            chantierB.mailles[mailleChantier][territoireCode].tendance ||
              "NON_APPLICABLE"
          ];

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
      case "écart": {
        const donneeTriA =
          chantierA.mailles[mailleChantier][territoireCode].ecart.annuel;
        const donneeTriB =
          chantierB.mailles[mailleChantier][territoireCode].ecart.annuel;

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

export default class RecupererChantiersAccessiblesEnLectureUseCaseRapportDetailleV2 {
  private readonly chantierRepository: ChantierRepository;

  private readonly territoireRepository: TerritoireRepository;

  constructor({
    chantierRepository,
    territoireRepository,
  }: {
    chantierRepository: ChantierRepository;
    territoireRepository: TerritoireRepository;
  }) {
    this.chantierRepository = chantierRepository;
    this.territoireRepository = territoireRepository;
  }

  async run(
    habilitations: Habilitations,
    profil: ProfilCode,
    territoireCode: string,
    mailleChantier: MailleChantierContrat,
    ministères: Ministère[],
    mapAxe: Map<string, Axe>,
    filtres: FiltreQueryParams,
    sorting: SortingParams,
    jalon: number,
    jalonParDefaut: number,
  ): Promise<ChantierRapportDetailleContrat[]> {
    const habilitation = new Habilitation(habilitations);
    const chantiersLecture =
      habilitation.récupérerListeChantiersIdsAccessiblesEnLecture();
    const territoiresLecture =
      habilitation.récupérerListeTerritoireCodesAccessiblesEnLecture();

    const filtresPourChantier: FiltreQueryParams = {
      perimetres: filtres.perimetres,
      axes: filtres.axes.map((filtre) => mapAxe.get(filtre)!.nom),
      statut: filtres.statut,
      meteos: filtres.meteos,
      territorialisation: filtres.territorialisation,
      estBarometre: filtres.estBarometre,
      valeurDeLaRecherche: filtres.valeurDeLaRecherche,
    };

    const territoires = await this.territoireRepository.récupérerTousNew();

    return this.chantierRepository
      .récupérerLesEntréesDeTousLesChantiersHabilitésNew(
        chantiersLecture,
        territoiresLecture,
        profil,
        filtresPourChantier,
        territoireCode,
        [jalon, jalonParDefaut],
      )
      .then((listePrismaChantier) =>
        listePrismaChantier
          .reduce((acc, chantierIdentite) => {
            // on devrait pouvoir appliquer le filtre plus tôt
            const chantierTerritoireSelectionne =
              chantierIdentite.chantier_territoire.find(
                (chantierTerritoire) =>
                  chantierTerritoire.territoire_code === territoireCode,
              );
            if (
              chantierTerritoireSelectionne?.est_applicable &&
              appliquerFiltre(mailleChantier, profil)(chantierIdentite)
            ) {
              return [
                ...acc,
                presenterEnChantierRapportDetaille(
                  chantierIdentite,
                  territoires,
                  ministères,
                  territoireCode,
                  profil,
                  jalon,
                  jalonParDefaut,
                ),
              ];
            }
            return acc;
          }, [] as ChantierRapportDetailleContrat[])
          .sort(appliquerTri(sorting, mailleChantier, territoireCode)),
      );
  }
}
