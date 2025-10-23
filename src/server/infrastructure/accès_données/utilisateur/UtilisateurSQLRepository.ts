import {
  $Enums,
  chantier_identite as PrismaChantierIdentite,
  habilitation as PrismaHabilitation,
  perimetre,
  Prisma,
  profil,
  territoire,
  utilisateur,
} from "@prisma/client";
import Utilisateur, {
  ProfilCode,
  profilsDépartementaux,
  profilsRégionaux,
  UtilisateurÀCréerOuMettreÀJourSansHabilitation,
} from "@/server/domain/utilisateur/Utilisateur.interface";
import UtilisateurRepository from "@/server/domain/utilisateur/UtilisateurRepository.interface";
import {
  Habilitations,
  HabilitationsÀCréerOuMettreÀJourCalculées,
  ScopeChantiers,
  ScopeUtilisateurs,
} from "@/server/domain/utilisateur/habilitation/Habilitation.interface";
import { objectEntries } from "@/client/utils/objects/objects";
import Habilitation from "@/server/domain/utilisateur/habilitation/Habilitation";
import { Territoire } from "@/server/domain/territoire/Territoire.interface";
import { ProfilEnum } from "@/server/app/enum/profil.enum";
import { prisma } from "@/server/db/prisma";
import { configuration } from "@/config";

// TODO: TOUT TESTEEEEER
export class UtilisateurSQLRepository implements UtilisateurRepository {
  private _territoires: string[] = [];

  private _chantiers: {
    donnéesBrutes: PrismaChantierIdentite[];
    groupésParId: Record<PrismaChantierIdentite["id"], PrismaChantierIdentite>;
    chantiersIdsPérimètresIds: Record<
      PrismaChantierIdentite["id"],
      perimetre["id"][]
    >;
    ids: PrismaChantierIdentite["id"][];
  } = {
    donnéesBrutes: [],
    groupésParId: {},
    chantiersIdsPérimètresIds: {},
    ids: [],
  };

  private _chantiersTerritorialisésIds: string[] = [];

  private _chantiersBrouillonsIds: string[] = [];

  private _périmètresMinistériels: string[] = [];

  async _récupérerTerritoires() {
    if (this._territoires.length === 0) {
      const tousLesTerritoires = await prisma.territoire.findMany();
      this._territoires = tousLesTerritoires.map((c) => c.code);
    }
  }

  async _récupérerChantiers() {
    const whereOptions: Prisma.chantier_identiteWhereInput = configuration()
      .featureFlip.ppgArchive
      ? {}
      : {
          NOT: {
            statut: "ARCHIVE",
          },
        };

    if (this._chantiers.donnéesBrutes.length === 0) {
      const tousLesChantiers = await prisma.chantier_identite.findMany({
        where: whereOptions,
      });

      this._chantiers.donnéesBrutes = tousLesChantiers;

      tousLesChantiers.forEach((chantier) => {
        this._chantiers.groupésParId[chantier.id] = chantier;
        this._chantiers.ids.push(chantier.id);
        this._chantiers.chantiersIdsPérimètresIds[chantier.id] =
          chantier.perimetre_ids;

        if (chantier.est_territorialise === true) {
          this._chantiersTerritorialisésIds.push(chantier.id);
        }

        if (chantier.statut === "BROUILLON") {
          this._chantiersBrouillonsIds.push(chantier.id);
        }
      });
    }
  }

  async _récupérerPérimètresMinistériels() {
    if (this._périmètresMinistériels.length === 0) {
      const tousLesPérimètresMinistériels = await prisma.perimetre.findMany();
      this._périmètresMinistériels = tousLesPérimètresMinistériels.map(
        (périmètre) => périmètre.id,
      );
    }
  }

  async supprimer(email: string): Promise<void> {
    await prisma.utilisateur.delete({
      where: { email: email.toLowerCase() },
      include: {
        habilitation: true,
      },
    });
  }

  async récupérer(email: string): Promise<Utilisateur | null> {
    await this._récupérerTerritoires();
    await this._récupérerChantiers();
    await this._récupérerPérimètresMinistériels();

    const row = await prisma.utilisateur.findUnique({
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

    return this._mapperVersDomaine(row);
  }

  async getById(id: string): Promise<Utilisateur | null> {
    await this._récupérerTerritoires();
    await this._récupérerChantiers();
    await this._récupérerPérimètresMinistériels();

    const row = await prisma.utilisateur.findUnique({
      where: { id },
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

    return this._mapperVersDomaine(row);
  }

  async récupérerExistants(
    utilisateurs: (UtilisateurÀCréerOuMettreÀJourSansHabilitation & {
      habilitations: HabilitationsÀCréerOuMettreÀJourCalculées;
    })[],
  ): Promise<Utilisateur["email"][]> {
    const utilisateursExistants = await prisma.utilisateur.findMany({
      where: {
        email: {
          in: utilisateurs.map((u) => u.email),
        },
      },
    });

    return utilisateursExistants.map((u) => u.email);
  }

  async récupérerNombreUtilisateursParTerritoires(
    territoires: Territoire[],
  ): Promise<Record<string, number>> {
    const territoireCodes = territoires.map(
      (territoireElement) => territoireElement.code,
    );
    const utilisateurs = await prisma.utilisateur.findMany({
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
            habilitationUtilisateur.some((h) => h.territoires.includes(code)) &&
            profilsCodes.includes(profilCode),
        ).length;

        return acc;
      },
      {},
    );
  }

  async créerOuMettreÀJour(
    u: UtilisateurÀCréerOuMettreÀJourSansHabilitation & {
      habilitations: HabilitationsÀCréerOuMettreÀJourCalculées;
    },
    auteurId: string,
  ): Promise<void> {
    const utilisateurCrééOuMisÀJour = await prisma.utilisateur.upsert({
      create: {
        email: u.email.toLocaleLowerCase(),
        nom: u.nom,
        prenom: u.prénom,
        profilCode: u.profil,
        fonction: u.fonction,
        auteur_id_creation: auteurId,
        date_creation: new Date(),
        auteur_id_modification: auteurId,
        date_modification: new Date(),
      },
      update: {
        email: u.email.toLocaleLowerCase(),
        nom: u.nom,
        prenom: u.prénom,
        profilCode: u.profil,
        fonction: u.fonction,
        auteur_id_modification: auteurId,
        date_modification: new Date(),
      },
      where: {
        email: u.email.toLowerCase(),
      },
    });

    const habilitationsÀCréer = Object.entries(u.habilitations).map((h) => ({
      utilisateurId: utilisateurCrééOuMisÀJour.id,
      scopeCode: h[0],
      territoires: h[1].territoires,
      perimetres: h[1].périmètres,
      chantiers: h[1].chantiers,
    }));

    await prisma.habilitation.deleteMany({
      where: {
        utilisateurId: utilisateurCrééOuMisÀJour.id,
      },
    });

    await prisma.habilitation.createMany({
      data: habilitationsÀCréer,
    });
  }

  private async _récupérerChantiersParDéfaut(
    profilUtilisateur: profil,
  ): Promise<
    Record<ScopeChantiers | ScopeUtilisateurs, PrismaChantierIdentite["id"][]>
  > {
    let chantiersAccessibles: PrismaChantierIdentite["id"][] = [];
    let chantiersAccessiblesEnGestionUtilisateur: PrismaChantierIdentite["id"][];

    if (profilUtilisateur.a_acces_tous_chantiers) {
      chantiersAccessibles = this._chantiers.ids;
    } else if (profilUtilisateur.a_acces_tous_chantiers_territorialises) {
      chantiersAccessibles = this._chantiersTerritorialisésIds;
    }

    // eslint-disable-next-line unicorn/prefer-ternary
    if (
      [
        ProfilEnum.COORDINATEUR_REGION,
        ProfilEnum.PREFET_REGION,
        ProfilEnum.COORDINATEUR_DEPARTEMENT,
        ProfilEnum.PREFET_DEPARTEMENT,
      ].includes(profilUtilisateur.code)
    ) {
      chantiersAccessiblesEnGestionUtilisateur = objectEntries(
        this._chantiers.groupésParId,
      )
        .filter(
          ([_, chantier]) =>
            chantier.est_territorialise && chantier.ate === "ate",
        )
        .map(([_, chantier]) => chantier.id);
    } else {
      chantiersAccessiblesEnGestionUtilisateur = chantiersAccessibles;
    }

    if (profilUtilisateur.a_acces_tous_chantiers) {
      chantiersAccessibles = this._chantiers.ids;
    }

    return {
      lecture: chantiersAccessibles,
      saisieCommentaire:
        profilUtilisateur.a_acces_tous_les_chantiers_saisie_commentaire
          ? chantiersAccessibles
          : [],
      saisieIndicateur: [
        ProfilEnum.DITP_PILOTAGE,
        ProfilEnum.DITP_ADMIN,
      ].includes(profilUtilisateur.code)
        ? chantiersAccessibles
        : [],
      gestionUtilisateur: profilUtilisateur.peut_modifier_les_utilisateurs
        ? chantiersAccessiblesEnGestionUtilisateur
        : [],
      responsabilite: [],
    };
  }

  private async _récupérerTerritoiresParDéfaut(
    profilUtilisateur: profil,
  ): Promise<Record<ScopeChantiers | ScopeUtilisateurs, territoire["code"][]>> {
    return {
      lecture: profilUtilisateur.a_acces_tous_les_territoires_lecture
        ? this._territoires
        : [],
      saisieCommentaire:
        profilUtilisateur.a_acces_tous_les_territoires_saisie_commentaire
          ? this._territoires
          : [],
      saisieIndicateur:
        profilUtilisateur.a_acces_tous_les_territoires_saisie_indicateur
          ? this._territoires
          : [],
      gestionUtilisateur: [
        ProfilEnum.DITP_PILOTAGE,
        ProfilEnum.DITP_ADMIN,
      ].includes(profilUtilisateur.code)
        ? this._territoires
        : [],
      responsabilite: [],
    };
  }

  private async _récupérerPérimètresMinistérielsParDéfaut(
    profilUtilisateur: profil,
  ): Promise<Record<ScopeChantiers | ScopeUtilisateurs, perimetre["id"][]>> {
    return {
      // on dit que ceux qui ont accès à tous les chantiers ont accès à tous les périmètres ministériels
      lecture: profilUtilisateur.a_acces_tous_chantiers
        ? this._périmètresMinistériels
        : [],
      saisieCommentaire: [],
      saisieIndicateur: [],
      gestionUtilisateur: [],
      responsabilite: [],
    };
  }

  private _aDesDroitsdeSaisieIndicateur(
    habilitations: Habilitations,
    profilUtilisateur: profil,
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
    profilUtilisateur: profil,
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

  private async _créerLesHabilitations(
    profilUtilisateur: profil,
    habilitations: PrismaHabilitation[],
  ) {
    const [
      chantiersParDéfaut,
      territoiresParDéfaut,
      périmètresMinistérielsParDéfaut,
    ] = await Promise.all([
      this._récupérerChantiersParDéfaut(profilUtilisateur),
      this._récupérerTerritoiresParDéfaut(profilUtilisateur),
      this._récupérerPérimètresMinistérielsParDéfaut(profilUtilisateur),
    ]);

    let habilitationsGénérées: Utilisateur["habilitations"] = {
      lecture: {
        chantiers: chantiersParDéfaut.lecture,
        territoires: territoiresParDéfaut.lecture,
        périmètres: périmètresMinistérielsParDéfaut.lecture,
      },
      saisieCommentaire: {
        chantiers: chantiersParDéfaut.saisieCommentaire,
        territoires: territoiresParDéfaut.saisieCommentaire,
        périmètres: périmètresMinistérielsParDéfaut.saisieCommentaire,
      },
      saisieIndicateur: {
        chantiers: chantiersParDéfaut.saisieIndicateur,
        territoires: territoiresParDéfaut.saisieIndicateur,
        périmètres: périmètresMinistérielsParDéfaut.saisieIndicateur,
      },
      gestionUtilisateur: {
        chantiers: chantiersParDéfaut.gestionUtilisateur,
        territoires: territoiresParDéfaut.gestionUtilisateur,
        périmètres: périmètresMinistérielsParDéfaut.gestionUtilisateur,
      },
      responsabilite: {
        chantiers: [],
        territoires: [],
        périmètres: [],
      },
    };

    for await (const h of habilitations) {
      const scopeCode = h.scopeCode as keyof Utilisateur["habilitations"];
      const listeChantier =
        scopeCode == "saisieCommentaire" &&
        [
          ProfilEnum.SERVICES_DECONCENTRES_REGION,
          ProfilEnum.SERVICES_DECONCENTRES_DEPARTEMENT,
        ].includes(profilUtilisateur.code)
          ? this._chantiers.donnéesBrutes.filter(
              (c) => c.ate !== "hors_ate_centralise",
            )
          : this._chantiers.donnéesBrutes;

      const chantiersSupplémentaires =
        h.chantiers.length > 0
          ? listeChantier
              .filter((c) => h.chantiers.includes(c.id))
              .map((c) => c.id)
          : h.chantiers;

      const chantiersAssociésAuxPérimètresMinistériels =
        h.perimetres.length > 0
          ? listeChantier
              .filter((c) =>
                c.perimetre_ids.some((p) => h.perimetres.includes(p)),
              )
              .map((c) => c.id)
          : [];

      const habilitationsChantier = [
        ...new Set([
          ...habilitationsGénérées[scopeCode].chantiers,
          ...chantiersAssociésAuxPérimètresMinistériels,
          ...chantiersSupplémentaires,
        ]),
      ];

      habilitationsGénérées[scopeCode].chantiers =
        profilUtilisateur.a_access_aux_chantiers_brouillons
          ? habilitationsChantier
          : habilitationsChantier.filter(
              (c) => !this._chantiersBrouillonsIds.includes(c),
            );
      habilitationsGénérées[scopeCode].territoires = [
        ...new Set([
          ...habilitationsGénérées[scopeCode].territoires,
          ...h.territoires,
        ]),
      ];
      habilitationsGénérées[scopeCode].périmètres = [
        ...new Set([
          ...habilitationsGénérées[scopeCode].périmètres,
          ...h.perimetres,
        ]),
      ];
    }

    return habilitationsGénérées;
  }

  private async _mapperVersDomaine(
    utilisateurBrut: utilisateur & {
      profil: profil;
      habilitation: PrismaHabilitation[];
      auteur_creation: utilisateur | null;
      auteur_modification: utilisateur | null;
    },
  ): Promise<Utilisateur> {
    const habilitations = await this._créerLesHabilitations(
      utilisateurBrut.profil,
      utilisateurBrut.habilitation,
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
      saisieIndicateur: this._aDesDroitsdeSaisieIndicateur(
        habilitations,
        utilisateurBrut.profil,
      ),
      gestionUtilisateur: this._aDesDroitsdeGestionUtilisateur(
        habilitations,
        utilisateurBrut.profil,
      ),
      applicationsAccessibles:
        utilisateurBrut.applications_accessibles as $Enums.application_accessible[],
      habilitations: habilitations,
      dateDesactivation:
        utilisateurBrut.date_desactivation?.toISOString() ?? null,
    };
  }
}
