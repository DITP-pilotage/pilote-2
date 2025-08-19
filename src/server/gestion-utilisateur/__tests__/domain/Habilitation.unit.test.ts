import { HabilitationBuilder } from "@/server/gestion-utilisateur/domain/habilitation/HabilitationBuilder";
import { ProfilEnum } from "@/server/app/enum/profil.enum";
import { UnauthorizedError } from "@/server/app/error-boundary/unauthorized-error";
import {
  TerritoiresNonAutorisésSuppressionUtilisateurErreur,
  ChantiersNonAutorisésSuppressionUtilisateurErreur,
  ProfilNonAutorisésSuppressionUtilisateurErreur,
  TerritoiresNonAutorisésCreationModificationUtilisateurErreur,
  ChantiersNonAutorisésCreationModificationUtilisateurErreur,
} from "@/server/utils/errors";
import { Profil } from "@/server/domain/profil/Profil.interface";
import { PropositionValeurAvancementChantierInformation } from "@/server/chantiers/domain/PropositionValeurAvancementChantierInformation";
import { ProfilCode } from "@/server/gestion-utilisateur/domain/Utilisateur.interface";

describe("Habilitation", () => {
  // Helper function pour créer un profil mock
  const creerProfilMock = (overrides: Partial<Profil> = {}): Profil => ({
    code: ProfilEnum.DITP_ADMIN,
    nom: "Test Profil",
    chantiers: {
      lecture: {
        tous: false,
        tousTerritorialisés: false,
        tousTerritoires: false,
        brouillons: false,
      },
      saisieCommentaire: {
        tousTerritoires: false,
        saisiePossible: false,
      },
      saisieIndicateur: {
        tousTerritoires: false,
      },
    },
    utilisateurs: {
      modificationPossible: true,
      tousTerritoires: false,
      tousChantiers: false,
    },
    ...overrides,
  });

  // Helper function pour créer des données de proposition valeur avancement
  const creerPropositionValeurAvancementMock = (
    overrides: Partial<PropositionValeurAvancementChantierInformation> = {},
  ): PropositionValeurAvancementChantierInformation => ({
    id: "chantier-1",
    nom: "Test Chantier",
    statut: "PUBLIE",
    conseillerMail: "test@example.com",
    ...overrides,
  });

  describe("verifierAutorisationModificationTokenAPI", () => {
    it("devrait autoriser un utilisateur DITP_ADMIN à modifier les tokens API", () => {
      // GIVEN
      const habilitation = new HabilitationBuilder().build();

      // WHEN & THEN
      expect(() => {
        habilitation.verifierAutorisationModificationTokenAPI(
          ProfilEnum.DITP_ADMIN,
        );
      }).not.toThrow();
    });

    it("devrait rejeter un utilisateur non autorisé à modifier les tokens API", () => {
      // GIVEN
      const habilitation = new HabilitationBuilder().build();

      // WHEN & THEN
      expect(() => {
        habilitation.verifierAutorisationModificationTokenAPI(
          ProfilEnum.PREFET_REGION,
        );
      }).toThrow(UnauthorizedError);

      expect(() => {
        habilitation.verifierAutorisationModificationTokenAPI(
          ProfilEnum.PREFET_REGION,
        );
      }).toThrow("Vous n'êtes pas autorisé a effectuer cette action");
    });

    it("devrait rejeter si le profil est null", () => {
      // GIVEN
      const habilitation = new HabilitationBuilder().build();

      // WHEN & THEN
      expect(() => {
        habilitation.verifierAutorisationModificationTokenAPI(null);
      }).toThrow(UnauthorizedError);
    });
  });

  describe("verifierAutorisationLectureMetadataIndicateur", () => {
    it("devrait autoriser un utilisateur DITP_ADMIN à lire les metadata indicateur", () => {
      // GIVEN
      const habilitation = new HabilitationBuilder().build();

      // WHEN & THEN
      expect(() => {
        habilitation.verifierAutorisationLectureMetadataIndicateur(
          ProfilEnum.DITP_ADMIN,
        );
      }).not.toThrow();
    });

    it("devrait rejeter un utilisateur non autorisé à lire les metadata indicateur", () => {
      // GIVEN
      const habilitation = new HabilitationBuilder().build();

      // WHEN & THEN
      expect(() => {
        habilitation.verifierAutorisationLectureMetadataIndicateur(
          ProfilEnum.COORDINATEUR_REGION,
        );
      }).toThrow(UnauthorizedError);
    });

    it("devrait rejeter si le profil est null", () => {
      // GIVEN
      const habilitation = new HabilitationBuilder().build();

      // WHEN & THEN
      expect(() => {
        habilitation.verifierAutorisationLectureMetadataIndicateur(null);
      }).toThrow(UnauthorizedError);
    });
  });

  describe("verifierAutorisationModificationMetadataIndicateur", () => {
    it("devrait autoriser un utilisateur DITP_ADMIN à modifier les metadata indicateur", () => {
      // GIVEN
      const habilitation = new HabilitationBuilder().build();

      // WHEN & THEN
      expect(() => {
        habilitation.verifierAutorisationModificationMetadataIndicateur(
          ProfilEnum.DITP_ADMIN,
        );
      }).not.toThrow();
    });

    it("devrait rejeter un utilisateur non autorisé à modifier les metadata indicateur", () => {
      // GIVEN
      const habilitation = new HabilitationBuilder().build();

      // WHEN & THEN
      expect(() => {
        habilitation.verifierAutorisationModificationMetadataIndicateur(
          ProfilEnum.DIR_PROJET,
        );
      }).toThrow(UnauthorizedError);
    });

    it("devrait rejeter si le profil est null", () => {
      // GIVEN
      const habilitation = new HabilitationBuilder().build();

      // WHEN & THEN
      expect(() => {
        habilitation.verifierAutorisationModificationMetadataIndicateur(null);
      }).toThrow(UnauthorizedError);
    });
  });

  describe("verifierAutorisationModificationGestionContenu", () => {
    it("devrait autoriser un utilisateur DITP_ADMIN à modifier la gestion de contenu", () => {
      // GIVEN
      const habilitation = new HabilitationBuilder().build();

      // WHEN & THEN
      expect(() => {
        habilitation.verifierAutorisationModificationGestionContenu(
          ProfilEnum.DITP_ADMIN,
        );
      }).not.toThrow();
    });

    it("devrait rejeter un utilisateur non autorisé à modifier la gestion de contenu", () => {
      // GIVEN
      const habilitation = new HabilitationBuilder().build();

      // WHEN & THEN
      expect(() => {
        habilitation.verifierAutorisationModificationGestionContenu(
          ProfilEnum.EQUIPE_DIR_PROJET,
        );
      }).toThrow(UnauthorizedError);
    });

    it("devrait rejeter si le profil est null", () => {
      // GIVEN
      const habilitation = new HabilitationBuilder().build();

      // WHEN & THEN
      expect(() => {
        habilitation.verifierAutorisationModificationGestionContenu(null);
      }).toThrow(UnauthorizedError);
    });
  });

  describe("verifierAutorisationModificationPropositionValeurAvancement", () => {
    it("devrait autoriser les profils autorisés à modifier les propositions valeur avancement", () => {
      // GIVEN
      const habilitation = new HabilitationBuilder().build();
      const chantiersIdsAutorisés = ["chantier-1", "chantier-2"];
      const proposition = creerPropositionValeurAvancementMock();

      const profilsAutorisés = [
        ProfilEnum.DITP_ADMIN,
        ProfilEnum.PREFET_DEPARTEMENT,
        ProfilEnum.PREFET_REGION,
        ProfilEnum.COORDINATEUR_REGION,
        ProfilEnum.COORDINATEUR_DEPARTEMENT,
        ProfilEnum.SERVICES_DECONCENTRES_DEPARTEMENT,
        ProfilEnum.SERVICES_DECONCENTRES_REGION,
      ];

      // WHEN & THEN
      profilsAutorisés.forEach((profil) => {
        expect(() => {
          habilitation.verifierAutorisationModificationPropositionValeurAvancement(
            profil as ProfilCode,
            chantiersIdsAutorisés,
            proposition,
          );
        }).not.toThrow();
      });
    });

    it("devrait rejeter les profils non autorisés à modifier les propositions valeur avancement", () => {
      // GIVEN
      const habilitation = new HabilitationBuilder().build();
      const chantiersIdsAutorisés = ["chantier-1", "chantier-2"];
      const proposition = creerPropositionValeurAvancementMock();

      // WHEN & THEN
      expect(() => {
        habilitation.verifierAutorisationModificationPropositionValeurAvancement(
          ProfilEnum.DIR_PROJET as ProfilCode,
          chantiersIdsAutorisés,
          proposition,
        );
      }).toThrow(UnauthorizedError);
    });

    it("devrait rejeter si le chantier n'est pas dans la liste des chantiers autorisés", () => {
      // GIVEN
      const habilitation = new HabilitationBuilder().build();
      const chantiersIdsAutorisés = ["chantier-2", "chantier-3"];
      const proposition = creerPropositionValeurAvancementMock({
        id: "chantier-1",
      });

      // WHEN & THEN
      expect(() => {
        habilitation.verifierAutorisationModificationPropositionValeurAvancement(
          ProfilEnum.DITP_ADMIN,
          chantiersIdsAutorisés,
          proposition,
        );
      }).toThrow(UnauthorizedError);
    });

    it("devrait rejeter si le chantier est archivé", () => {
      // GIVEN
      const habilitation = new HabilitationBuilder().build();
      const chantiersIdsAutorisés = ["chantier-1"];
      const proposition = creerPropositionValeurAvancementMock({
        id: "chantier-1",
        statut: "ARCHIVE",
      });

      // WHEN & THEN
      expect(() => {
        habilitation.verifierAutorisationModificationPropositionValeurAvancement(
          ProfilEnum.DITP_ADMIN,
          chantiersIdsAutorisés,
          proposition,
        );
      }).toThrow(UnauthorizedError);
    });

    it("devrait rejeter si le profil est null", () => {
      // GIVEN
      const habilitation = new HabilitationBuilder().build();
      const chantiersIdsAutorisés = ["chantier-1"];
      const proposition = creerPropositionValeurAvancementMock();

      // WHEN & THEN
      expect(() => {
        habilitation.verifierAutorisationModificationPropositionValeurAvancement(
          null,
          chantiersIdsAutorisés,
          proposition,
        );
      }).toThrow(UnauthorizedError);
    });
  });

  describe("verifierAutorisationAcceptationOuRefusPropositionValeurAvancement", () => {
    it("devrait autoriser les profils autorisés à accepter les propositions valeur avancement", () => {
      // GIVEN
      const habilitation = new HabilitationBuilder()
        .avecChantiersIdsSaisieCommentaire(["chantier-1", "chantier-2"])
        .avecChantiersIdsSaisieIndicateur(["chantier-1", "chantier-2"]) // Nécessaire pour SECRETARIAT_GENERAL
        .build();
      const proposition = creerPropositionValeurAvancementMock();

      const profilsAutorisés = [
        ProfilEnum.DIR_PROJET,
        ProfilEnum.EQUIPE_DIR_PROJET,
        ProfilEnum.SECRETARIAT_GENERAL,
      ];

      // WHEN & THEN
      profilsAutorisés.forEach((profil) => {
        expect(() => {
          habilitation.verifierAutorisationAcceptationOuRefusPropositionValeurAvancement(
            profil as ProfilCode,
            habilitation["_habilitations"],
            proposition,
          );
        }).not.toThrow();
      });
    });

    it("devrait autoriser SECRETARIAT_GENERAL si le chantier est dans saisieCommentaire ET saisieIndicateur", () => {
      // GIVEN
      const habilitation = new HabilitationBuilder()
        .avecChantiersIdsSaisieCommentaire(["chantier-1"])
        .avecChantiersIdsSaisieIndicateur(["chantier-1"])
        .build();
      const proposition = creerPropositionValeurAvancementMock();

      // WHEN & THEN
      expect(() => {
        habilitation.verifierAutorisationAcceptationOuRefusPropositionValeurAvancement(
          ProfilEnum.SECRETARIAT_GENERAL as ProfilCode,
          habilitation["_habilitations"],
          proposition,
        );
      }).not.toThrow();
    });

    it("devrait rejeter SECRETARIAT_GENERAL si le chantier n'est pas dans saisieIndicateur", () => {
      // GIVEN
      const habilitation = new HabilitationBuilder()
        .avecChantiersIdsSaisieCommentaire(["chantier-1"])
        .build(); // Pas de chantier dans saisieIndicateur
      const proposition = creerPropositionValeurAvancementMock();

      // WHEN & THEN
      expect(() => {
        habilitation.verifierAutorisationAcceptationOuRefusPropositionValeurAvancement(
          ProfilEnum.SECRETARIAT_GENERAL as ProfilCode,
          habilitation["_habilitations"],
          proposition,
        );
      }).toThrow(UnauthorizedError);
    });

    it("devrait rejeter les profils non autorisés à accepter les propositions valeur avancement", () => {
      // GIVEN
      const habilitation = new HabilitationBuilder()
        .avecChantiersIdsSaisieCommentaire(["chantier-1", "chantier-2"])
        .build();
      const proposition = creerPropositionValeurAvancementMock();

      // WHEN & THEN
      expect(() => {
        habilitation.verifierAutorisationAcceptationOuRefusPropositionValeurAvancement(
          ProfilEnum.COORDINATEUR_REGION as ProfilCode,
          habilitation["_habilitations"],
          proposition,
        );
      }).toThrow(UnauthorizedError);
    });

    it("devrait rejeter si le chantier n'est pas dans saisieCommentaire", () => {
      // GIVEN
      const habilitation = new HabilitationBuilder()
        .avecChantiersIdsSaisieCommentaire(["chantier-2", "chantier-3"])
        .build();
      const proposition = creerPropositionValeurAvancementMock({
        id: "chantier-1", // Pas dans saisieCommentaire
      });

      // WHEN & THEN
      expect(() => {
        habilitation.verifierAutorisationAcceptationOuRefusPropositionValeurAvancement(
          ProfilEnum.DIR_PROJET as ProfilCode,
          habilitation["_habilitations"],
          proposition,
        );
      }).toThrow(UnauthorizedError);
    });

    it("devrait rejeter si le chantier est archivé", () => {
      // GIVEN
      const habilitation = new HabilitationBuilder()
        .avecChantiersIdsSaisieCommentaire(["chantier-1"])
        .build();
      const proposition = creerPropositionValeurAvancementMock({
        id: "chantier-1",
        statut: "ARCHIVE",
      });

      // WHEN & THEN
      expect(() => {
        habilitation.verifierAutorisationAcceptationOuRefusPropositionValeurAvancement(
          ProfilEnum.DIR_PROJET as ProfilCode,
          habilitation["_habilitations"],
          proposition,
        );
      }).toThrow(UnauthorizedError);
    });

    it("devrait rejeter si le profil est null", () => {
      // GIVEN
      const habilitation = new HabilitationBuilder()
        .avecChantiersIdsSaisieCommentaire(["chantier-1"])
        .build();
      const proposition = creerPropositionValeurAvancementMock();

      // WHEN & THEN
      expect(() => {
        habilitation.verifierAutorisationAcceptationOuRefusPropositionValeurAvancement(
          null,
          habilitation["_habilitations"],
          proposition,
        );
      }).toThrow(UnauthorizedError);
    });
  });

  describe("vérifierLesHabilitationsEnSuppressionUtilisateur", () => {
    it("devrait réussir quand toutes les conditions sont remplies", () => {
      // GIVEN
      const habilitation = new HabilitationBuilder()
        .avecTerritoireCodesGestionUtilisateur(["75", "92", "93"])
        .avecChantiersIdsGestionUtilisateur([
          "chantier-1",
          "chantier-2",
          "chantier-3",
        ])
        .build();

      const profil = creerProfilMock({
        utilisateurs: {
          modificationPossible: true,
          tousTerritoires: true,
          tousChantiers: true,
        },
      });

      const chantiersIds = ["chantier-1", "chantier-2"];
      const territoiresCodes = ["75", "92"];

      // WHEN & THEN
      expect(() => {
        habilitation.vérifierLesHabilitationsEnSuppressionUtilisateur(
          chantiersIds,
          territoiresCodes,
          profil,
        );
      }).not.toThrow();
    });

    it("devrait lever ProfilNonAutorisésSuppressionUtilisateurErreur si le profil est null", () => {
      // GIVEN
      const habilitation = new HabilitationBuilder().build();
      const chantiersIds = ["chantier-1"];
      const territoiresCodes = ["75"];

      // WHEN & THEN
      expect(() => {
        habilitation.vérifierLesHabilitationsEnSuppressionUtilisateur(
          chantiersIds,
          territoiresCodes,
          null,
        );
      }).toThrow(ProfilNonAutorisésSuppressionUtilisateurErreur);
    });

    it("devrait lever ProfilNonAutorisésSuppressionUtilisateurErreur si modificationPossible est false", () => {
      // GIVEN
      const habilitation = new HabilitationBuilder().build();
      const profil = creerProfilMock({
        utilisateurs: {
          modificationPossible: false,
          tousTerritoires: true,
          tousChantiers: true,
        },
      });

      const chantiersIds = ["chantier-1"];
      const territoiresCodes = ["75"];

      // WHEN & THEN
      expect(() => {
        habilitation.vérifierLesHabilitationsEnSuppressionUtilisateur(
          chantiersIds,
          territoiresCodes,
          profil,
        );
      }).toThrow(ProfilNonAutorisésSuppressionUtilisateurErreur);
    });

    it("devrait lever TerritoiresNonAutorisésSuppressionUtilisateurErreur quand l'utilisateur n'a pas accès à tous les territoires demandés", () => {
      // GIVEN
      const habilitation = new HabilitationBuilder()
        .avecTerritoireCodesGestionUtilisateur(["75", "92"]) // L'utilisateur n'a accès qu'à Paris et Hauts-de-Seine
        .build();

      const profil = creerProfilMock({
        utilisateurs: {
          modificationPossible: true,
          tousTerritoires: false,
          tousChantiers: true, // Le profil veut gérer tous les chantiers
        },
      });

      const chantiersIds = ["chantier-1", "chantier-2"];
      const territoiresCodes = ["75", "92", "93"]; // On demande l'accès à la Seine-Saint-Denis en plus

      // WHEN & THEN
      expect(() => {
        habilitation.vérifierLesHabilitationsEnSuppressionUtilisateur(
          chantiersIds,
          territoiresCodes,
          profil,
        );
      }).toThrow(TerritoiresNonAutorisésSuppressionUtilisateurErreur);
    });

    it("devrait lever ChantiersNonAutorisésSuppressionUtilisateurErreur quand l'utilisateur n'a pas accès à tous les chantiers demandés", () => {
      // GIVEN
      const habilitation = new HabilitationBuilder()
        .avecTerritoireCodesGestionUtilisateur(["75", "92"])
        .avecChantiersIdsGestionUtilisateur(["chantier-1", "chantier-2"]) // Accès limité aux chantiers
        .build();

      const profil = creerProfilMock({
        utilisateurs: {
          modificationPossible: true,
          tousTerritoires: true, // Le profil veut gérer tous les territoires
          tousChantiers: false,
        },
      });

      const chantiersIds = ["chantier-1", "chantier-3"]; // chantier-3 n'est pas autorisé
      const territoiresCodes = ["75"];

      // WHEN & THEN
      expect(() => {
        habilitation.vérifierLesHabilitationsEnSuppressionUtilisateur(
          chantiersIds,
          territoiresCodes,
          profil,
        );
      }).toThrow(ChantiersNonAutorisésSuppressionUtilisateurErreur);
    });

    it("devrait réussir quand l'utilisateur a accès à un sur-ensemble des territoires et chantiers demandés", () => {
      // GIVEN
      const habilitation = new HabilitationBuilder()
        .avecTerritoireCodesGestionUtilisateur(["75", "92", "93", "94"]) // Plus de territoires autorisés
        .avecChantiersIdsGestionUtilisateur([
          "chantier-1",
          "chantier-2",
          "chantier-3",
        ]) // Plus de chantiers autorisés
        .build();

      const profil = creerProfilMock({
        utilisateurs: {
          modificationPossible: true,
          tousTerritoires: true,
          tousChantiers: true,
        },
      });

      const chantiersIds = ["chantier-1", "chantier-2"]; // Sous-ensemble des chantiers autorisés
      const territoiresCodes = ["75", "92"]; // Sous-ensemble des territoires autorisés

      // WHEN & THEN
      expect(() => {
        habilitation.vérifierLesHabilitationsEnSuppressionUtilisateur(
          chantiersIds,
          territoiresCodes,
          profil,
        );
      }).not.toThrow();
    });
  });

  describe("vérifierLesHabilitationsEnCréationModificationUtilisateur", () => {
    it("devrait réussir quand toutes les conditions sont remplies", () => {
      // GIVEN
      const habilitation = new HabilitationBuilder()
        .avecTerritoireCodesGestionUtilisateur(["75", "92", "93"])
        .avecChantiersIdsGestionUtilisateur([
          "chantier-1",
          "chantier-2",
          "chantier-3",
        ])
        .build();

      const profil = creerProfilMock({
        utilisateurs: {
          modificationPossible: true,
          tousTerritoires: true,
          tousChantiers: true,
        },
      });

      const chantiersIds = ["chantier-1", "chantier-2"];
      const territoiresCodes = ["75", "92"];

      // WHEN & THEN
      expect(() => {
        habilitation.vérifierLesHabilitationsEnCréationModificationUtilisateur(
          chantiersIds,
          territoiresCodes,
          profil,
        );
      }).not.toThrow();
    });

    it("devrait lever ProfilNonAutorisésSuppressionUtilisateurErreur si le profil est null", () => {
      // GIVEN
      const habilitation = new HabilitationBuilder().build();
      const chantiersIds = ["chantier-1"];
      const territoiresCodes = ["75"];

      // WHEN & THEN
      expect(() => {
        habilitation.vérifierLesHabilitationsEnCréationModificationUtilisateur(
          chantiersIds,
          territoiresCodes,
          null,
        );
      }).toThrow(ProfilNonAutorisésSuppressionUtilisateurErreur);
    });

    it("devrait lever ProfilNonAutorisésSuppressionUtilisateurErreur si modificationPossible est false", () => {
      // GIVEN
      const habilitation = new HabilitationBuilder().build();
      const profil = creerProfilMock({
        utilisateurs: {
          modificationPossible: false,
          tousTerritoires: true,
          tousChantiers: true,
        },
      });

      const chantiersIds = ["chantier-1"];
      const territoiresCodes = ["75"];

      // WHEN & THEN
      expect(() => {
        habilitation.vérifierLesHabilitationsEnCréationModificationUtilisateur(
          chantiersIds,
          territoiresCodes,
          profil,
        );
      }).toThrow(ProfilNonAutorisésSuppressionUtilisateurErreur);
    });

    it("devrait lever TerritoiresNonAutorisésCreationModificationUtilisateurErreur quand l'utilisateur n'a pas accès à tous les territoires demandés", () => {
      // GIVEN
      const habilitation = new HabilitationBuilder()
        .avecTerritoireCodesGestionUtilisateur(["75", "92"])
        .build();

      const profil = creerProfilMock({
        utilisateurs: {
          modificationPossible: true,
          tousTerritoires: false,
          tousChantiers: true,
        },
      });

      const chantiersIds = ["chantier-1", "chantier-2"];
      const territoiresCodes = ["75", "92", "93"]; // Territoire 93 non autorisé

      // WHEN & THEN
      expect(() => {
        habilitation.vérifierLesHabilitationsEnCréationModificationUtilisateur(
          chantiersIds,
          territoiresCodes,
          profil,
        );
      }).toThrow(TerritoiresNonAutorisésCreationModificationUtilisateurErreur);
    });

    it("devrait lever ChantiersNonAutorisésCreationModificationUtilisateurErreur quand l'utilisateur n'a pas accès à tous les chantiers demandés", () => {
      // GIVEN
      const habilitation = new HabilitationBuilder()
        .avecTerritoireCodesGestionUtilisateur(["75", "92"])
        .avecChantiersIdsGestionUtilisateur(["chantier-1", "chantier-2"])
        .build();

      const profil = creerProfilMock({
        utilisateurs: {
          modificationPossible: true,
          tousTerritoires: true,
          tousChantiers: false,
        },
      });

      const chantiersIds = ["chantier-1", "chantier-3"]; // chantier-3 non autorisé
      const territoiresCodes = ["75"];

      // WHEN & THEN
      expect(() => {
        habilitation.vérifierLesHabilitationsEnCréationModificationUtilisateur(
          chantiersIds,
          territoiresCodes,
          profil,
        );
      }).toThrow(ChantiersNonAutorisésCreationModificationUtilisateurErreur);
    });

    it("devrait réussir avec des tableaux vides", () => {
      // GIVEN
      const habilitation = new HabilitationBuilder().build();
      const profil = creerProfilMock({
        utilisateurs: {
          modificationPossible: true,
          tousTerritoires: true,
          tousChantiers: true,
        },
      });

      // WHEN & THEN
      expect(() => {
        habilitation.vérifierLesHabilitationsEnCréationModificationUtilisateur(
          [],
          [],
          profil,
        );
      }).not.toThrow();
    });
  });

  describe("Cas de test pour la logique des profils et autorisations", () => {
    it("devrait gérer correctement le cas où tousChantiers est false mais tousTerritoires est true", () => {
      // GIVEN
      const habilitation = new HabilitationBuilder()
        .avecTerritoireCodesGestionUtilisateur(["75", "92"])
        .avecChantiersIdsGestionUtilisateur(["chantier-1"])
        .build();

      const profil = creerProfilMock({
        utilisateurs: {
          modificationPossible: true,
          tousTerritoires: true, // Vérifie les chantiers
          tousChantiers: false, // Ne vérifie pas les territoires
        },
      });

      const chantiersIds = ["chantier-1"]; // Chantier autorisé (important car tousTerritoires=true)
      const territoiresCodes = ["999"]; // Territoire non autorisé, mais pas vérifié car tousChantiers=false

      // WHEN & THEN
      expect(() => {
        habilitation.vérifierLesHabilitationsEnSuppressionUtilisateur(
          chantiersIds,
          territoiresCodes,
          profil,
        );
      }).not.toThrow();
    });

    it("devrait gérer correctement le cas où tousTerritoires est false mais tousChantiers est true", () => {
      // GIVEN
      const habilitation = new HabilitationBuilder()
        .avecTerritoireCodesGestionUtilisateur(["75"])
        .avecChantiersIdsGestionUtilisateur(["chantier-1", "chantier-2"])
        .build();

      const profil = creerProfilMock({
        utilisateurs: {
          modificationPossible: true,
          tousTerritoires: false, // Ne vérifie pas les chantiers
          tousChantiers: true, // Vérifie les territoires
        },
      });

      const chantiersIds = ["chantier-999"]; // Chantier non autorisé, mais pas vérifié car tousTerritoires=false
      const territoiresCodes = ["75"]; // Territoire autorisé (important car tousChantiers=true)

      // WHEN & THEN
      expect(() => {
        habilitation.vérifierLesHabilitationsEnSuppressionUtilisateur(
          chantiersIds,
          territoiresCodes,
          profil,
        );
      }).not.toThrow();
    });
  });
});
