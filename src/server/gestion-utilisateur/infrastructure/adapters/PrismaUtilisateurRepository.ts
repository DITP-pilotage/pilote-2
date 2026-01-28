import {
  $Enums,
  habilitation as PrismaHabilitationModel,
  Prisma,
  profil as PrismaProfilModel,
  utilisateur as PrismaUtilisateurModel,
} from "@prisma/client";
import {
  HabilitationsÀCréerOuMettreÀJourCalculées,
  ScopeChantiers,
  ScopeUtilisateurs,
} from "@/server/domain/utilisateur/habilitation/Habilitation.interface";
import Habilitation from "@/server/domain/utilisateur/habilitation/Habilitation";
import { Territoire } from "@/server/domain/territoire/Territoire.interface";
import { ProfilEnum } from "@/server/app/enum/profil.enum";
import { UtilisateurRepository } from "@/server/gestion-utilisateur/domain/ports/UtilisateurRepository";
import { PrismaPilote } from "@/server/db/PrismaPilote";
import { UtilisateurListeGestion } from "@/server/gestion-utilisateur/domain/UtilisateurListeGestion.interface";
import { removeAccents } from "@/server/utils/remove-accents";
import { estUnProfilTerritorialise } from "@/server/app/domain/ProfilTerritorialise";
import { UtilisateurExportCSV } from "@/server/gestion-utilisateur/domain/UtilisateurExportCSV";
import { InformationChantierUtilisateur } from "@/server/gestion-utilisateur/domain/InformationChantierUtilisateur";
import { Habilitations } from "@/server/gestion-utilisateur/domain/habilitation/Habilitation.interface";
import {
  ProfilCode,
  profilsDépartementaux,
  profilsRégionaux,
  Utilisateur,
} from "@/server/gestion-utilisateur/domain/Utilisateur.interface";
import { UtilisateurÀCréerOuMettreÀJourSansHabilitation } from "@/server/domain/utilisateur/Utilisateur.interface";

interface Dependencies {
  prisma: PrismaPilote;
}

const récupérerChantiersParDéfaut = (
  profilUtilisateur: PrismaProfilModel,
  listeInformationsChantiersUtilisateurs: InformationChantierUtilisateur[],
): Record<
  ScopeChantiers | ScopeUtilisateurs,
  InformationChantierUtilisateur["id"][]
> => {
  let chantiersAccessibles = profilUtilisateur.a_acces_tous_chantiers
    ? listeInformationsChantiersUtilisateurs
    : profilUtilisateur.a_acces_tous_chantiers_territorialises
      ? listeInformationsChantiersUtilisateurs.reduce(
          (acc, chantier) =>
            chantier.estTerritorialise ? [...acc, chantier] : acc,
          [] as InformationChantierUtilisateur[],
        )
      : [];

  const listeChantiersAccessiblesIds = chantiersAccessibles.map(
    (chantier) => chantier.id,
  );

  let chantiersAccessiblesEnSaisieCommentaire = estUnProfilTerritorialise(
    profilUtilisateur.code as ProfilCode,
  )
    ? chantiersAccessibles.reduce((acc, chantier) => {
        if (chantier.estTerritorialise && chantier.ate === "ate") {
          return [...acc, chantier.id];
        }
        return acc;
      }, [] as string[])
    : listeChantiersAccessiblesIds;

  return {
    lecture: listeChantiersAccessiblesIds,
    saisieCommentaire: chantiersAccessiblesEnSaisieCommentaire,
    saisieIndicateur: [
      ProfilEnum.DITP_PILOTAGE,
      ProfilEnum.DITP_ADMIN,
    ].includes(profilUtilisateur.code)
      ? listeChantiersAccessiblesIds
      : [],
    gestionUtilisateur: profilUtilisateur.peut_modifier_les_utilisateurs
      ? chantiersAccessiblesEnSaisieCommentaire
      : [],
    responsabilite: [],
  };
};

const créerLesHabilitations = (
  profilUtilisateur: PrismaProfilModel,
  habilitations: PrismaHabilitationModel[],
  listeInformationsChantiersUtilisateurs: InformationChantierUtilisateur[],
  territoires: string[],
  perimetresMinisteriels: string[],
) => {
  const chantiersParDéfaut = récupérerChantiersParDéfaut(
    profilUtilisateur,
    listeInformationsChantiersUtilisateurs,
  );

  let habilitationsGénérées: Habilitations = {
    lecture: {
      __meta: {
        aAccesTousLesChantiers: profilUtilisateur.a_acces_tous_chantiers,
        aAccesTousLesTerritoires:
          profilUtilisateur.a_acces_tous_les_territoires_lecture,
        aAccesTousLesPerimetres: profilUtilisateur.a_acces_tous_chantiers,
      },
      chantiers: chantiersParDéfaut.lecture,
      territoires: profilUtilisateur.a_acces_tous_les_territoires_lecture
        ? territoires
        : [],
      périmètres: profilUtilisateur.a_acces_tous_chantiers
        ? perimetresMinisteriels
        : [],
    },
    saisieCommentaire: {
      __meta: {
        aAccesTousLesChantiers: profilUtilisateur.a_acces_tous_chantiers,
        aAccesTousLesTerritoires:
          profilUtilisateur.a_acces_tous_les_territoires_saisie_commentaire,
        aAccesTousLesPerimetres: false,
      },
      chantiers: chantiersParDéfaut.saisieCommentaire,
      territoires:
        profilUtilisateur.a_acces_tous_les_territoires_saisie_commentaire
          ? territoires
          : [],
      périmètres: [],
    },
    saisieIndicateur: {
      __meta: {
        aAccesTousLesChantiers: profilUtilisateur.a_acces_tous_chantiers,
        aAccesTousLesTerritoires:
          profilUtilisateur.a_acces_tous_les_territoires_saisie_indicateur,
        aAccesTousLesPerimetres: false,
      },
      chantiers: chantiersParDéfaut.saisieIndicateur,
      territoires:
        profilUtilisateur.a_acces_tous_les_territoires_saisie_indicateur
          ? territoires
          : [],
      périmètres: [],
    },
    gestionUtilisateur: {
      __meta: {
        aAccesTousLesChantiers:
          profilUtilisateur.a_acces_a_tous_les_chantiers_utilisateurs,
        aAccesTousLesTerritoires:
          profilUtilisateur.a_acces_a_tous_les_territoires_utilisateurs,
        aAccesTousLesPerimetres: false,
      },
      chantiers: chantiersParDéfaut.gestionUtilisateur,
      territoires: [ProfilEnum.DITP_PILOTAGE, ProfilEnum.DITP_ADMIN].includes(
        profilUtilisateur.code,
      )
        ? territoires
        : [],
      périmètres: [],
    },
    responsabilite: {
      __meta: {
        aAccesTousLesChantiers: false,
        aAccesTousLesTerritoires: false,
        aAccesTousLesPerimetres: false,
      },
      chantiers: [],
      territoires: [],
      périmètres: [],
    },
  };

  habilitations.forEach((habilitation) => {
    const scopeCode =
      habilitation.scopeCode as keyof Utilisateur["habilitations"];
    const listeInformationsChantiersUtilisateursApplicableSurTerritoire =
      estUnProfilTerritorialise(profilUtilisateur.code as ProfilCode)
        ? listeInformationsChantiersUtilisateurs.filter((informationChantier) =>
            informationChantier.territoiresApplicables.some((territoire) =>
              habilitation.territoires.includes(territoire),
            ),
          )
        : listeInformationsChantiersUtilisateurs;

    const listeChantier =
      scopeCode == "saisieCommentaire" &&
      [
        ProfilEnum.SERVICES_DECONCENTRES_REGION,
        ProfilEnum.SERVICES_DECONCENTRES_DEPARTEMENT,
      ].includes(profilUtilisateur.code)
        ? listeInformationsChantiersUtilisateursApplicableSurTerritoire.filter(
            (chantier) => chantier.ate !== "hors_ate_centralise",
          )
        : listeInformationsChantiersUtilisateursApplicableSurTerritoire;

    const chantiersSupplémentaires =
      habilitation.chantiers.length > 0
        ? listeChantier
            .filter((chantier) => habilitation.chantiers.includes(chantier.id))
            .map((chantier) => chantier.id)
        : habilitation.chantiers;

    const chantiersAssociésAuxPérimètresMinistériels =
      habilitation.perimetres.length > 0
        ? listeChantier
            .filter((chantier) =>
              chantier.perimetreIds.some((p) =>
                habilitation.perimetres.includes(p),
              ),
            )
            .map((chantier) => chantier.id)
        : [];

    const habilitationsChantier = [
      ...new Set([
        ...habilitationsGénérées[scopeCode].chantiers,
        ...chantiersAssociésAuxPérimètresMinistériels,
        ...chantiersSupplémentaires,
      ]),
    ];

    const listeChantiersBrouillonsIds =
      listeInformationsChantiersUtilisateurs.reduce((acc, chantier) => {
        if (chantier.statut === "BROUILLON") {
          return [...acc, chantier.id];
        }
        return acc;
      }, [] as string[]);

    habilitationsGénérées[scopeCode].chantiers =
      profilUtilisateur.a_access_aux_chantiers_brouillons
        ? habilitationsChantier
        : habilitationsChantier.filter(
            (habilitationChantier) =>
              !listeChantiersBrouillonsIds.includes(habilitationChantier),
          );
    habilitationsGénérées[scopeCode].territoires = [
      ...new Set([
        ...habilitationsGénérées[scopeCode].territoires,
        ...habilitation.territoires,
      ]),
    ];
    habilitationsGénérées[scopeCode].périmètres = [
      ...new Set([
        ...habilitationsGénérées[scopeCode].périmètres,
        ...habilitation.perimetres,
      ]),
    ];
  });

  return habilitationsGénérées;
};

export class PrismaUtilisateurRepository implements UtilisateurRepository {
  constructor(private readonly deps: Dependencies) {}

  get prisma() {
    return this.deps.prisma.getInstance();
  }

  async verifierExistenceUtilisateur(email: string): Promise<boolean> {
    const utilisateur = await this.prisma.utilisateur.findFirst({
      where: {
        email,
      },
    });

    return utilisateur !== null;
  }

  async desactiver(email: string, auteurId: string): Promise<void> {
    await this.prisma.utilisateur.updateMany({
      where: {
        email: email.toLowerCase(),
      },
      data: {
        date_desactivation: new Date(),
        date_modification: new Date(),
        auteur_id_modification: auteurId,
      },
    });
  }

  async reactiver(email: string, auteurId: string): Promise<void> {
    await this.prisma.utilisateur.updateMany({
      where: {
        email: email.toLowerCase(),
      },
      data: {
        date_desactivation: null,
        date_modification: new Date(),
        auteur_id_modification: auteurId,
      },
    });
  }

  async recupererTous({
    sorting,
    valeurDeLaRecherche,
    listeTerritoiresCodes,
    listePerimetresMinisteriels,
    listeInformationsChantiersUtilisateurs,
  }: {
    sorting: { id: string; desc: boolean }[];
    valeurDeLaRecherche: string;
    listeTerritoiresCodes: string[];
    listePerimetresMinisteriels: string[];
    listeInformationsChantiersUtilisateurs: InformationChantierUtilisateur[];
  }): Promise<UtilisateurListeGestion[]> {
    const valeurDeLaRechercheSansAccentEtEnLowerCase = removeAccents(
      valeurDeLaRecherche.toLowerCase(),
    );

    const unaccentedUtilisateur = await this.prisma.$queryRawUnsafe<
      { id: string }[]
    >(
      `SELECT id FROM utilisateur where LOWER(unaccent(nom)) ILIKE $1
      OR LOWER(unaccent(email)) ILIKE $1
      OR LOWER(unaccent(prenom)) ILIKE $1
      OR LOWER(unaccent(fonction)) ILIKE $1
      OR LOWER(unaccent(profil_code)) ILIKE $1
    `,
      `%${valeurDeLaRechercheSansAccentEtEnLowerCase}%`,
    );

    const utilisateurs = await this.prisma.utilisateur.findMany({
      include: {
        profil: true,
        habilitation: true,
        auteur_modification: true,
      },
      where: {
        id: {
          in: unaccentedUtilisateur.map((utilisateurIds) => utilisateurIds.id),
        },
      },
      orderBy: sorting.reduce((acc, val) => {
        acc[
          this.convertirEnIdPrisma(
            val.id,
          ) as keyof Prisma.utilisateurOrderByWithRelationInput
        ] = val.desc ? "desc" : "asc";
        return acc;
      }, {} as Prisma.utilisateurOrderByWithRelationInput),
    });

    return utilisateurs.map(
      this.convertirEnUtilisateurListeGestion({
        listeTerritoiresCodes,
        listePerimetresMinisteriels,
        listeInformationsChantiersUtilisateurs,
      }),
    );
  }

  async recupererPourExports({
    valeurDeLaRecherche,
    listeTerritoiresCodes,
    listePerimetresMinisteriels,
    listeInformationsChantiersUtilisateurs,
  }: {
    valeurDeLaRecherche: string;
    listeTerritoiresCodes: string[];
    listePerimetresMinisteriels: string[];
    listeInformationsChantiersUtilisateurs: InformationChantierUtilisateur[];
  }): Promise<UtilisateurExportCSV[]> {
    const valeurDeLaRechercheSansAccentEtEnLowerCase = removeAccents(
      valeurDeLaRecherche.toLowerCase(),
    );

    const unaccentedUtilisateur = await this.prisma.$queryRawUnsafe<
      { id: string }[]
    >(
      `SELECT id FROM utilisateur where LOWER(unaccent(nom)) ILIKE $1
      OR LOWER(unaccent(email)) ILIKE $1
      OR LOWER(unaccent(prenom)) ILIKE $1
      OR LOWER(unaccent(fonction)) ILIKE $1
      OR LOWER(unaccent(profil_code)) ILIKE $1
    `,
      `%${valeurDeLaRechercheSansAccentEtEnLowerCase}%`,
    );

    const utilisateurs = await this.prisma.utilisateur.findMany({
      include: {
        profil: true,
        habilitation: true,
        auteur_modification: true,
        auteur_creation: true,
      },
      where: {
        id: {
          in: unaccentedUtilisateur.map((utilisateurIds) => utilisateurIds.id),
        },
      },
      orderBy: [
        {
          prenom: "asc",
        },
        {
          nom: "asc",
        },
      ],
    });

    return utilisateurs.map(
      this.convertirEnUtilisateurExportCSV({
        listeTerritoiresCodes,
        listePerimetresMinisteriels,
        listeInformationsChantiersUtilisateurs,
      }),
    );
  }

  async récupérer(
    email: string,
    listeTerritoiresCodes: string[],
    listePerimetresMinisteriels: string[],
    listeInformationsChantiersUtilisateurs: InformationChantierUtilisateur[],
  ): Promise<Utilisateur | null> {
    const row = await this.prisma.utilisateur.findUnique({
      where: { email: email.toLowerCase() },
      include: {
        profil: true,
        habilitation: true,
        auteur_creation: true,
        auteur_modification: true,
      },
    });

    if (!row) {
      return null;
    }

    return this.convertirEnUtilisateur({
      listeTerritoiresCodes,
      listePerimetresMinisteriels,
      listeInformationsChantiersUtilisateurs,
    })(row);
  }

  async récupérerNombreUtilisateursParTerritoires(
    territoires: Territoire[],
  ): Promise<Record<string, number>> {
    const territoireCodes = territoires.map(
      (territoireElement) => territoireElement.code,
    );

    const utilisateurs = await this.prisma.utilisateur.findMany({
      where: {
        OR: [
          {
            profilCode: {
              in: profilsDépartementaux,
            },
            date_desactivation: null,
            habilitation: {
              some: {
                scopeCode: "lecture",
                territoires: {
                  hasSome: territoireCodes,
                },
              },
            },
          },
          {
            profilCode: {
              in: profilsRégionaux,
            },
            date_desactivation: null,
            habilitation: {
              some: {
                scopeCode: "lecture",
                territoires: {
                  hasSome: territoireCodes,
                },
              },
            },
          },
        ],
      },
      select: {
        email: true,
        profilCode: true,
        habilitation: {
          select: {
            territoires: true,
          },
          where: {
            scopeCode: "lecture",
          },
        },
      },
    });

    return territoires.reduce(
      (acc: { [key: string]: number }, { code, maille }: Territoire) => {
        const profilsCodes =
          maille === "departementale"
            ? profilsDépartementaux
            : profilsRégionaux;

        acc[code] = utilisateurs.filter(
          ({ habilitation: habilitationUtilisateur, profilCode }) =>
            habilitationUtilisateur.some((habilitation) =>
              habilitation.territoires.includes(code),
            ) && profilsCodes.includes(profilCode),
        ).length;

        return acc;
      },
      {},
    );
  }

  async supprimerListeUtilisateur(
    utilisateursASupprimerIds: string[],
  ): Promise<void> {
    await this.prisma.utilisateur.deleteMany({
      where: {
        id: {
          in: utilisateursASupprimerIds,
        },
      },
    });
  }

  async recupererComptesDesactives(
    dateDesactivationMax: Date,
  ): Promise<{ id: string; email: string }[]> {
    const utilisateursInactifs = await this.prisma.utilisateur.findMany({
      where: {
        date_desactivation: {
          lt: dateDesactivationMax,
        },
      },
    });

    return utilisateursInactifs.map((utilisateurInactif) => ({
      id: utilisateurInactif.id,
      email: utilisateurInactif.email,
    }));
  }

  async anonymiserAuteurs(
    auteursAAnonymiserIds: string[],
    emailAuteurRemplacement: string,
  ): Promise<void> {
    const auteurAnonyme = await this.prisma.utilisateur.findFirst({
      where: {
        email: emailAuteurRemplacement,
      },
    });

    if (auteurAnonyme) {
      await this.prisma.utilisateur.updateMany({
        where: {
          auteur_id_creation: {
            in: auteursAAnonymiserIds,
          },
        },
        data: {
          auteur_id_creation: auteurAnonyme.id,
        },
      });
      await this.prisma.utilisateur.updateMany({
        where: {
          auteur_id_modification: {
            in: auteursAAnonymiserIds,
          },
        },
        data: {
          auteur_id_modification: auteurAnonyme.id,
        },
      });
    }
  }

  private _aDesDroitsdeSaisieCommentaire(
    habilitations: Habilitations,
    profilUtilisateur: PrismaProfilModel,
  ) {
    if (profilUtilisateur.a_acces_tous_chantiers) {
      return profilUtilisateur.peut_saisir_des_commentaires;
    } else {
      const habilitationSaisieCommentaire = habilitations.saisieCommentaire;
      return profilUtilisateur.a_acces_tous_les_territoires_saisie_commentaire
        ? habilitationSaisieCommentaire.périmètres.length > 0 ||
            habilitationSaisieCommentaire.chantiers.length > 0
        : habilitationSaisieCommentaire.territoires.length > 0;
    }
  }

  private convertirEnIdPrisma(
    idSort: string,
  ): keyof Prisma.utilisateurOrderByWithRelationInput {
    switch (idSort) {
      case "email": {
        return "email";
      }
      case "nom": {
        return "nom";
      }
      case "prénom": {
        return "prenom";
      }
      case "profil": {
        return "profilCode";
      }
      case "fonction": {
        return "fonction";
      }
      case "Dernière modification": {
        return "date_modification";
      }
      default: {
        return "date_modification";
      }
    }
  }

  private _aDesDroitsdeSaisieIndicateur(
    habilitations: Habilitations,
    profilUtilisateur: PrismaProfilModel,
  ) {
    if (
      profilUtilisateur.a_acces_tous_chantiers &&
      profilUtilisateur.a_acces_tous_les_territoires_saisie_indicateur
    ) {
      return true;
    } else {
      const habilitationSaisieIndicateur = habilitations.saisieIndicateur;
      return profilUtilisateur.a_acces_tous_les_territoires_saisie_indicateur
        ? habilitationSaisieIndicateur.périmètres.length > 0 ||
            habilitationSaisieIndicateur.chantiers.length > 0
        : habilitationSaisieIndicateur.territoires.length > 0;
    }
  }

  private _aDesDroitsdeGestionUtilisateur(
    habilitations: Habilitations,
    profilUtilisateur: PrismaProfilModel,
  ) {
    const habilitationsFormatés = new Habilitation(habilitations);
    if (!profilUtilisateur.peut_modifier_les_utilisateurs) return false;

    if (
      profilUtilisateur.a_acces_a_tous_les_chantiers_utilisateurs &&
      profilUtilisateur.a_acces_a_tous_les_territoires_utilisateurs
    )
      return true;

    if (profilUtilisateur.a_acces_a_tous_les_chantiers_utilisateurs)
      return habilitationsFormatés.possedeAuMoinsUnTerritoireEnGestionUtilisateur();

    if (profilUtilisateur.a_acces_a_tous_les_territoires_utilisateurs)
      return habilitationsFormatés.possedeAuMoinsUnChantierEnGestionUtilisateur();

    return false;
  }

  async recupererEtatVisualisationVideoAccueil(
    utilisateurId: string,
  ): Promise<boolean> {
    const etatVisualisationVideoAccueil =
      await this.prisma.utilisateur.findUnique({
        where: { id: utilisateurId },
        select: {
          date_visualisation_video_accueil: true,
        },
      });

    return (
      !!etatVisualisationVideoAccueil?.date_visualisation_video_accueil || false
    );
  }

  async recupererDateVisualisationVideoAccueil(
    utilisateurId: string,
  ): Promise<Date | null> {
    const utilisateur = await this.prisma.utilisateur.findUnique({
      where: { id: utilisateurId },
      select: {
        date_visualisation_video_accueil: true,
      },
    });

    return utilisateur?.date_visualisation_video_accueil || null;
  }

  async recupererDateInscriptionInfolettre(
    utilisateurId: string,
  ): Promise<Date | null> {
    const utilisateur = await this.prisma.utilisateur.findUnique({
      where: { id: utilisateurId },
      select: {
        date_inscription_infolettre: true,
      },
    });

    return utilisateur?.date_inscription_infolettre || null;
  }

  async recupererDateVisualisationPopupInfolettre(
    utilisateurId: string,
  ): Promise<Date | null> {
    const utilisateur = await this.prisma.utilisateur.findUnique({
      where: { id: utilisateurId },
      select: {
        date_visualisation_popup_infolettre: true,
      },
    });

    return utilisateur?.date_visualisation_popup_infolettre || null;
  }

  async desactiverVideoAccueil(
    utilisateurId: string,
    dateVisualisation: Date,
  ): Promise<void> {
    await this.prisma.utilisateur.update({
      where: { id: utilisateurId },
      data: { date_visualisation_video_accueil: dateVisualisation },
    });
  }

  async mettreAJourLaDateInscriptionInfolettre(
    email: string,
    dateInscriptionInfolettre: Date,
  ): Promise<void> {
    await this.prisma.utilisateur.update({
      where: { email: email },
      data: { date_inscription_infolettre: dateInscriptionInfolettre },
    });
  }

  async mettreAJourLaDateVisulationPopupInfolettre(
    utilisateurId: string,
    dateVisualisationPopupInfolettre: Date,
  ): Promise<void> {
    await this.prisma.utilisateur.update({
      where: { id: utilisateurId },
      data: {
        date_visualisation_popup_infolettre: dateVisualisationPopupInfolettre,
      },
    });
  }

  async reinitialiserEtatVisualisationVideoAccueil(
    email: string,
  ): Promise<void> {
    await this.prisma.utilisateur.update({
      where: { email },
      data: { date_visualisation_video_accueil: null },
    });
  }

  private convertirEnUtilisateurListeGestion({
    listeTerritoiresCodes,
    listePerimetresMinisteriels,
    listeInformationsChantiersUtilisateurs,
  }: {
    listeTerritoiresCodes: string[];
    listePerimetresMinisteriels: string[];
    listeInformationsChantiersUtilisateurs: InformationChantierUtilisateur[];
  }) {
    return (
      utilisateurBrut: PrismaUtilisateurModel & {
        profil: PrismaProfilModel;
        habilitation: PrismaHabilitationModel[];
        auteur_modification: PrismaUtilisateurModel | null;
      },
    ): UtilisateurListeGestion => {
      const habilitations = créerLesHabilitations(
        utilisateurBrut.profil,
        utilisateurBrut.habilitation,
        listeInformationsChantiersUtilisateurs,
        listeTerritoiresCodes,
        listePerimetresMinisteriels,
      );

      const auteurModification = utilisateurBrut.auteur_modification;

      return {
        id: utilisateurBrut.id,
        email: utilisateurBrut.email,
        nom: utilisateurBrut.nom || "Inconnu",
        prénom: utilisateurBrut.prenom || "Inconnu",
        fonction: utilisateurBrut.fonction,
        habilitations: habilitations,
        dateModification: utilisateurBrut.date_modification?.toISOString(),
        auteurModification: auteurModification
          ? `${auteurModification.prenom} ${auteurModification.nom}`
          : "Auteur Inconnu",
        profil: utilisateurBrut.profilCode as ProfilCode,
        dateDesactivation:
          utilisateurBrut.date_desactivation?.toISOString() ?? null,
      };
    };
  }

  private convertirEnUtilisateurExportCSV({
    listeTerritoiresCodes,
    listePerimetresMinisteriels,
    listeInformationsChantiersUtilisateurs,
  }: {
    listeTerritoiresCodes: string[];
    listePerimetresMinisteriels: string[];
    listeInformationsChantiersUtilisateurs: InformationChantierUtilisateur[];
  }) {
    return (
      utilisateurBrut: PrismaUtilisateurModel & {
        profil: PrismaProfilModel;
        habilitation: PrismaHabilitationModel[];
        auteur_modification: PrismaUtilisateurModel | null;
        auteur_creation: PrismaUtilisateurModel | null;
      },
    ): UtilisateurExportCSV => {
      const habilitations = créerLesHabilitations(
        utilisateurBrut.profil,
        utilisateurBrut.habilitation,
        listeInformationsChantiersUtilisateurs,
        listeTerritoiresCodes,
        listePerimetresMinisteriels,
      );

      const auteurModification = utilisateurBrut.auteur_modification;
      const auteurCreation = utilisateurBrut.auteur_creation;

      return {
        id: utilisateurBrut.id,
        email: utilisateurBrut.email,
        nom: utilisateurBrut.nom || "Inconnu",
        prénom: utilisateurBrut.prenom || "Inconnu",
        fonction: utilisateurBrut.fonction,
        habilitations,
        dateModification: utilisateurBrut.date_modification?.toISOString(),
        auteurModification: auteurModification
          ? `${auteurModification.prenom} ${auteurModification.nom}`
          : "Auteur Inconnu",
        profil: utilisateurBrut.profilCode as ProfilCode,
        dateDesactivation:
          utilisateurBrut.date_desactivation?.toISOString() ?? null,
        statut: utilisateurBrut.date_desactivation ? "Désactivé" : "Activé",
        dateCreation: utilisateurBrut.date_creation.toISOString(),
        auteurCreation: auteurCreation
          ? `${auteurCreation.prenom} ${auteurCreation.nom}`
          : "Auteur Inconnu",
      };
    };
  }

  private convertirEnUtilisateur({
    listeTerritoiresCodes,
    listePerimetresMinisteriels,
    listeInformationsChantiersUtilisateurs,
  }: {
    listeTerritoiresCodes: string[];
    listePerimetresMinisteriels: string[];
    listeInformationsChantiersUtilisateurs: InformationChantierUtilisateur[];
  }) {
    return (
      utilisateurBrut: PrismaUtilisateurModel & {
        profil: PrismaProfilModel;
        habilitation: PrismaHabilitationModel[];
        auteur_creation: PrismaUtilisateurModel | null;
        auteur_modification: PrismaUtilisateurModel | null;
      },
    ): Utilisateur => {
      const habilitations = créerLesHabilitations(
        utilisateurBrut.profil,
        utilisateurBrut.habilitation,
        listeInformationsChantiersUtilisateurs,
        listeTerritoiresCodes,
        listePerimetresMinisteriels,
      );

      const auteurCreation = utilisateurBrut.auteur_creation;
      const auteurModification = utilisateurBrut.auteur_modification;

      return {
        id: utilisateurBrut.id,
        nom: utilisateurBrut.nom || "Inconnu",
        prénom: utilisateurBrut.prenom || "Inconnu",
        email: utilisateurBrut.email,
        profil: utilisateurBrut.profilCode as ProfilCode,
        dateModification: utilisateurBrut.date_modification?.toISOString(),
        auteurModification: auteurModification
          ? `${auteurModification.prenom} ${auteurModification.nom}`
          : "Auteur Inconnu",
        dateCreation: utilisateurBrut.date_creation?.toISOString() || null,
        auteurCreation: auteurCreation
          ? `${auteurCreation.prenom} ${auteurCreation.nom}`
          : "Auteur Inconnu",
        fonction: utilisateurBrut.fonction,
        saisieCommentaire: this._aDesDroitsdeSaisieCommentaire(
          habilitations,
          utilisateurBrut.profil,
        ),
        saisieIndicateur: this._aDesDroitsdeSaisieIndicateur(
          habilitations,
          utilisateurBrut.profil,
        ),
        gestionUtilisateur: this._aDesDroitsdeGestionUtilisateur(
          habilitations,
          utilisateurBrut.profil,
        ),
        habilitations: habilitations,
        applicationsAccessibles:
          utilisateurBrut.applications_accessibles as $Enums.application_accessible[],
        dateDesactivation:
          utilisateurBrut.date_desactivation?.toISOString() ?? null,
      };
    };
  }

  async recupererUtilisateurEmail(
    utilisateurId: string,
  ): Promise<string | null> {
    const utilisateur = await this.prisma.utilisateur.findUnique({
      where: { id: utilisateurId },
      select: { email: true },
    });

    return utilisateur?.email ?? null;
  }

  async recupererUtilisateurId(email: string): Promise<string | null> {
    const utilisateur = await this.prisma.utilisateur.findUnique({
      where: { email: email.toLowerCase() },
      select: { id: true },
    });

    return utilisateur?.id ?? null;
  }

  async créerOuMettreÀJour(
    utilisateur: UtilisateurÀCréerOuMettreÀJourSansHabilitation & {
      habilitations: HabilitationsÀCréerOuMettreÀJourCalculées;
    },
    auteurId: string,
  ): Promise<void> {
    const utilisateurCrééOuMisÀJour = await this.prisma.utilisateur.upsert({
      create: {
        email: utilisateur.email.toLocaleLowerCase(),
        nom: utilisateur.nom,
        prenom: utilisateur.prénom,
        profilCode: utilisateur.profil,
        fonction: utilisateur.fonction,
        applications_accessibles: utilisateur.applicationsAccessibles,
        auteur_id_modification: auteurId,
        date_modification: new Date(),
        auteur_id_creation: auteurId,
        date_creation: new Date(),
      },
      update: {
        email: utilisateur.email.toLocaleLowerCase(),
        nom: utilisateur.nom,
        prenom: utilisateur.prénom,
        profilCode: utilisateur.profil,
        fonction: utilisateur.fonction,
        applications_accessibles: utilisateur.applicationsAccessibles,
        auteur_id_modification: auteurId,
        date_modification: new Date(),
      },
      where: {
        email: utilisateur.email.toLowerCase(),
      },
    });

    const habilitationsÀCréer = Object.entries(utilisateur.habilitations).map(
      (habilitation) => ({
        utilisateurId: utilisateurCrééOuMisÀJour.id,
        scopeCode: habilitation[0],
        territoires: habilitation[1].territoires,
        perimetres: habilitation[1].périmètres,
        chantiers: habilitation[1].chantiers,
      }),
    );

    await this.prisma.habilitation.deleteMany({
      where: {
        utilisateurId: utilisateurCrééOuMisÀJour.id,
      },
    });

    await this.prisma.habilitation.createMany({
      data: habilitationsÀCréer,
    });
  }

  async recupererComptesInactifs(dateReference: Date): Promise<
    {
      email: string;
      datePremiereRelanceDesactivation: Date | null;
      dateDeuxiemeRelanceDesactivation: Date | null;
      dateDesactivationProgramee: Date | null;
      dateDerniereConnexion: Date;
    }[]
  > {
    const dateSeuilInactivite = new Date(dateReference);
    dateSeuilInactivite.setMonth(dateSeuilInactivite.getMonth() - 11);

    const comptesInactifs = await this.prisma.utilisateur.findMany({
      where: {
        date_desactivation: null,
        date_derniere_connexion: {
          lt: dateSeuilInactivite,
        },
      },
      select: {
        email: true,
        date_premiere_relance_desactivation: true,
        date_deuxieme_relance_desactivation: true,
        date_desactivation_programee: true,
        date_derniere_connexion: true,
      },
    });

    return comptesInactifs.map((compte) => ({
      email: compte.email,
      datePremiereRelanceDesactivation:
        compte.date_premiere_relance_desactivation,
      dateDeuxiemeRelanceDesactivation:
        compte.date_deuxieme_relance_desactivation,
      dateDesactivationProgramee: compte.date_desactivation_programee,
      dateDerniereConnexion: compte.date_derniere_connexion,
    }));
  }

  async mettreAJourDatePremiereRelanceDesactivation(
    email: string,
    date: Date,
  ): Promise<void> {
    await this.prisma.utilisateur.update({
      where: { email: email.toLowerCase() },
      data: { date_premiere_relance_desactivation: date },
    });
  }

  async mettreAJourDateDeuxiemeRelanceDesactivation(
    email: string,
    date: Date,
  ): Promise<void> {
    await this.prisma.utilisateur.update({
      where: { email: email.toLowerCase() },
      data: { date_deuxieme_relance_desactivation: date },
    });
  }

  async mettreAJourDateDesactivationProgramee(
    email: string,
    date: Date,
  ): Promise<void> {
    await this.prisma.utilisateur.update({
      where: { email: email.toLowerCase() },
      data: { date_desactivation_programee: date },
    });
  }

  async mettreAJourDateDerniereConnexion(
    email: string,
    date: Date,
  ): Promise<void> {
    await this.prisma.utilisateur.update({
      where: { email: email.toLowerCase() },
      data: {
        date_derniere_connexion: date,
        date_premiere_relance_desactivation: null,
        date_deuxieme_relance_desactivation: null,
        date_desactivation_programee: null,
      },
    });
  }
}
