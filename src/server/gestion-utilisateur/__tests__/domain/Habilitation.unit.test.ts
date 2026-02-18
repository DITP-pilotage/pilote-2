import { HabilitationBuilder } from "@/server/gestion-utilisateur/domain/habilitation/HabilitationBuilder";
import { ProfilEnum } from "@/server/app/enum/profil.enum";
import { UnauthorizedError } from "@/server/app/error-boundary/unauthorized-error";
import { RapportDirecteurProjetChantierInformation } from "@/server/chantiers/domain/PropositionValeurAvancementChantierInformation";
import { ProfilCode } from "@/server/gestion-utilisateur/domain/Utilisateur.interface";

describe("Habilitation", () => {
  const creerPropositionValeurAvancementMock = (
    overrides: Partial<RapportDirecteurProjetChantierInformation> = {},
  ): RapportDirecteurProjetChantierInformation => ({
    id: "chantier-1",
    nom: "Test Chantier",
    statut: "PUBLIE",
    conseillerMail: "test@example.com",
    ...overrides,
  });

  describe("verifierAutorisationModificationTokenAPI", () => {
    it("devrait autoriser un utilisateur DITP_ADMIN à modifier les tokens API", () => {
      // Given
      const habilitation = new HabilitationBuilder()
        .avecProfilCode(ProfilEnum.DITP_ADMIN)
        .build();

      // When & THEN
      expect(() => {
        habilitation.verifierAutorisationModificationTokenAPI();
      }).not.toThrow();
    });

    it("devrait rejeter un utilisateur non autorisé à modifier les tokens API", () => {
      // Given
      const habilitation = new HabilitationBuilder()
        .avecProfilCode(ProfilEnum.PREFET_REGION)
        .build();

      // When & THEN
      expect(() => {
        habilitation.verifierAutorisationModificationTokenAPI();
      }).toThrow(UnauthorizedError);

      expect(() => {
        habilitation.verifierAutorisationModificationTokenAPI();
      }).toThrow("Vous n'êtes pas autorisé a effectuer cette action");
    });
  });

  describe("verifierAutorisationLectureMetadataIndicateur", () => {
    it("devrait autoriser un utilisateur DITP_ADMIN à lire les metadata indicateur", () => {
      // Given
      const habilitation = new HabilitationBuilder()
        .avecProfilCode(ProfilEnum.DITP_ADMIN)
        .build();

      // When & THEN
      expect(() => {
        habilitation.verifierAutorisationLectureMetadataIndicateur();
      }).not.toThrow();
    });

    it("devrait rejeter un utilisateur non autorisé à lire les metadata indicateur", () => {
      // Given
      const habilitation = new HabilitationBuilder()
        .avecProfilCode(ProfilEnum.COORDINATEUR_REGION)
        .build();

      // When & THEN
      expect(() => {
        habilitation.verifierAutorisationLectureMetadataIndicateur();
      }).toThrow(UnauthorizedError);
    });
  });

  describe("verifierAutorisationModificationMetadataIndicateur", () => {
    it("devrait autoriser un utilisateur DITP_ADMIN à modifier les metadata indicateur", () => {
      // Given
      const habilitation = new HabilitationBuilder()
        .avecProfilCode(ProfilEnum.DITP_ADMIN)
        .build();

      // When & THEN
      expect(() => {
        habilitation.verifierAutorisationModificationMetadataIndicateur();
      }).not.toThrow();
    });

    it("devrait rejeter un utilisateur non autorisé à modifier les metadata indicateur", () => {
      // Given
      const habilitation = new HabilitationBuilder()
        .avecProfilCode(ProfilEnum.DIR_PROJET)
        .build();

      // When & THEN
      expect(() => {
        habilitation.verifierAutorisationModificationMetadataIndicateur();
      }).toThrow(UnauthorizedError);
    });
  });

  describe("verifierAutorisationModificationGestionContenu", () => {
    it("devrait autoriser un utilisateur DITP_ADMIN à modifier la gestion de contenu", () => {
      // Given
      const habilitation = new HabilitationBuilder()
        .avecProfilCode(ProfilEnum.DITP_ADMIN)
        .build();

      // When & THEN
      expect(() => {
        habilitation.verifierAutorisationModificationGestionContenu();
      }).not.toThrow();
    });

    it("devrait rejeter un utilisateur non autorisé à modifier la gestion de contenu", () => {
      // Given
      const habilitation = new HabilitationBuilder()
        .avecProfilCode(ProfilEnum.EQUIPE_DIR_PROJET)
        .build();

      // When & THEN
      expect(() => {
        habilitation.verifierAutorisationModificationGestionContenu();
      }).toThrow(UnauthorizedError);
    });
  });

  describe("verifierAutorisationModificationPropositionValeurAvancement", () => {
    it("devrait autoriser les profils autorisés à modifier les propositions valeur avancement", () => {
      // Given
      const chantiersIdsAutorisés = ["chantier-1", "chantier-2"];
      const proposition = creerPropositionValeurAvancementMock();

      const profilsAutorisés: ProfilCode[] = [
        ProfilEnum.DITP_ADMIN,
        ProfilEnum.PREFET_DEPARTEMENT,
        ProfilEnum.PREFET_REGION,
        ProfilEnum.COORDINATEUR_REGION,
        ProfilEnum.COORDINATEUR_DEPARTEMENT,
        ProfilEnum.SERVICES_DECONCENTRES_DEPARTEMENT,
        ProfilEnum.SERVICES_DECONCENTRES_REGION,
      ];

      // When & THEN
      profilsAutorisés.forEach((profil) => {
        const habilitation = new HabilitationBuilder()
          .avecChantiersIdsSaisieCommentaire(chantiersIdsAutorisés)
          .avecProfilCode(profil)
          .build();
        expect(() => {
          habilitation.verifierAutorisationModificationPropositionValeurAvancement(
            proposition,
          );
        }).not.toThrow();
      });
    });

    it("devrait rejeter les profils non autorisés à modifier les propositions valeur avancement", () => {
      // Given
      const chantiersIdsAutorisés = ["chantier-1", "chantier-2"];

      const habilitation = new HabilitationBuilder()
        .avecChantiersIdsSaisieCommentaire(chantiersIdsAutorisés)
        .avecProfilCode(ProfilEnum.DIR_PROJET)
        .build();

      const proposition = creerPropositionValeurAvancementMock();

      // When & THEN
      expect(() => {
        habilitation.verifierAutorisationModificationPropositionValeurAvancement(
          proposition,
        );
      }).toThrow(UnauthorizedError);
    });

    it("devrait rejeter si le chantier n'est pas dans la liste des chantiers autorisés", () => {
      // Given
      const chantiersIdsAutorisés = ["chantier-2", "chantier-3"];
      const proposition = creerPropositionValeurAvancementMock({
        id: "chantier-1",
      });

      const habilitation = new HabilitationBuilder()
        .avecChantiersIdsSaisieCommentaire(chantiersIdsAutorisés)
        .avecProfilCode(ProfilEnum.DITP_ADMIN)
        .build();

      // When & THEN
      expect(() => {
        habilitation.verifierAutorisationModificationPropositionValeurAvancement(
          proposition,
        );
      }).toThrow(UnauthorizedError);
    });

    it("devrait rejeter si le chantier est archivé", () => {
      // Given
      const habilitation = new HabilitationBuilder()
        .avecChantiersIdsSaisieCommentaire(["chantier-1"])
        .avecProfilCode(ProfilEnum.DITP_ADMIN)
        .build();
      const proposition = creerPropositionValeurAvancementMock({
        id: "chantier-1",
        statut: "ARCHIVE",
      });

      // When & THEN
      expect(() => {
        habilitation.verifierAutorisationModificationPropositionValeurAvancement(
          proposition,
        );
      }).toThrow(UnauthorizedError);
    });
  });

  describe("verifierAutorisationAcceptationOuRefusPropositionValeurAvancement", () => {
    it("devrait autoriser les profils autorisés à accepter les propositions valeur avancement", () => {
      // Given
      const chantiersIds = ["chantier-1", "chantier-2"];
      const proposition = creerPropositionValeurAvancementMock();

      const profilsAutorisés: ProfilCode[] = [
        ProfilEnum.DIR_PROJET,
        ProfilEnum.EQUIPE_DIR_PROJET,
        ProfilEnum.SECRETARIAT_GENERAL,
      ];

      // When & THEN
      profilsAutorisés.forEach((profil) => {
        const habilitation = new HabilitationBuilder()
          .avecChantiersIdsSaisieCommentaire(chantiersIds)
          .avecChantiersIdsSaisieIndicateur(chantiersIds)
          .avecProfilCode(profil)
          .build();
        expect(() => {
          habilitation.verifierAutorisationAcceptationOuRefusPropositionValeurAvancement(
            proposition,
          );
        }).not.toThrow();
      });
    });

    it("devrait autoriser SECRETARIAT_GENERAL si le chantier est dans saisieCommentaire ET saisieIndicateur", () => {
      // Given
      const habilitation = new HabilitationBuilder()
        .avecChantiersIdsSaisieCommentaire(["chantier-1"])
        .avecChantiersIdsSaisieIndicateur(["chantier-1"])
        .avecProfilCode(ProfilEnum.SECRETARIAT_GENERAL)
        .build();
      const proposition = creerPropositionValeurAvancementMock();

      // When & THEN
      expect(() => {
        habilitation.verifierAutorisationAcceptationOuRefusPropositionValeurAvancement(
          proposition,
        );
      }).not.toThrow();
    });

    it("devrait rejeter SECRETARIAT_GENERAL si le chantier n'est pas dans saisieIndicateur", () => {
      // Given
      const habilitation = new HabilitationBuilder()
        .avecChantiersIdsSaisieCommentaire(["chantier-1"])
        .avecProfilCode(ProfilEnum.SECRETARIAT_GENERAL)
        .build();
      const proposition = creerPropositionValeurAvancementMock();

      // When & THEN
      expect(() => {
        habilitation.verifierAutorisationAcceptationOuRefusPropositionValeurAvancement(
          proposition,
        );
      }).toThrow(UnauthorizedError);
    });

    it("devrait rejeter les profils non autorisés à accepter les propositions valeur avancement", () => {
      // Given
      const habilitation = new HabilitationBuilder()
        .avecChantiersIdsSaisieCommentaire(["chantier-1", "chantier-2"])
        .avecProfilCode(ProfilEnum.COORDINATEUR_REGION)
        .build();
      const proposition = creerPropositionValeurAvancementMock();

      // When & THEN
      expect(() => {
        habilitation.verifierAutorisationAcceptationOuRefusPropositionValeurAvancement(
          proposition,
        );
      }).toThrow(UnauthorizedError);
    });

    it("devrait rejeter si le chantier n'est pas dans saisieIndicateur", () => {
      // Given
      const habilitation = new HabilitationBuilder()
        .avecChantiersIdsSaisieCommentaire(["chantier-2", "chantier-3"])
        .avecChantiersIdsSaisieIndicateur(["chantier-2", "chantier-3"])
        .avecProfilCode(ProfilEnum.DIR_PROJET)
        .build();
      const proposition = creerPropositionValeurAvancementMock({
        id: "chantier-1",
      });

      // When & THEN
      expect(() => {
        habilitation.verifierAutorisationAcceptationOuRefusPropositionValeurAvancement(
          proposition,
        );
      }).toThrow(UnauthorizedError);
    });

    it("devrait rejeter si le chantier est archivé", () => {
      // Given
      const habilitation = new HabilitationBuilder()
        .avecChantiersIdsSaisieCommentaire(["chantier-1"])
        .avecChantiersIdsSaisieIndicateur(["chantier-1"])
        .avecProfilCode(ProfilEnum.DIR_PROJET)
        .build();
      const proposition = creerPropositionValeurAvancementMock({
        id: "chantier-1",
        statut: "ARCHIVE",
      });

      // When & THEN
      expect(() => {
        habilitation.verifierAutorisationAcceptationOuRefusPropositionValeurAvancement(
          proposition,
        );
      }).toThrow(UnauthorizedError);
    });

    it("devrait rejeter DITP_ADMIN à accepter les propositions valeur avancement", () => {
      // Given
      const habilitation = new HabilitationBuilder()
        .avecChantiersIdsSaisieCommentaire(["chantier-1"])
        .avecChantiersIdsSaisieIndicateur(["chantier-1"])
        .avecProfilCode(ProfilEnum.DITP_ADMIN)
        .build();
      const proposition = creerPropositionValeurAvancementMock();

      // When & THEN
      expect(() => {
        habilitation.verifierAutorisationAcceptationOuRefusPropositionValeurAvancement(
          proposition,
        );
      }).toThrow(UnauthorizedError);
    });
  });

  describe("verifierAutorisationLectureRapportsHebdomadaires", () => {
    it("devrait autoriser un COORDINATEUR_REGION à lire les rapports hebdomadaires", () => {
      // Given
      const habilitation = new HabilitationBuilder()
        .avecProfilCode(ProfilEnum.COORDINATEUR_REGION)
        .build();

      // When & THEN
      expect(() => {
        habilitation.verifierAutorisationLectureRapportsHebdomadaires();
      }).not.toThrow();
    });

    it("devrait autoriser un COORDINATEUR_DEPARTEMENT à lire les rapports hebdomadaires", () => {
      // Given
      const habilitation = new HabilitationBuilder()
        .avecProfilCode(ProfilEnum.COORDINATEUR_DEPARTEMENT)
        .build();

      // When & THEN
      expect(() => {
        habilitation.verifierAutorisationLectureRapportsHebdomadaires();
      }).not.toThrow();
    });

    it("devrait rejeter un DITP_ADMIN à lire les rapports hebdomadaires", () => {
      // Given
      const habilitation = new HabilitationBuilder()
        .avecProfilCode(ProfilEnum.DITP_ADMIN)
        .build();

      // When & THEN
      expect(() => {
        habilitation.verifierAutorisationLectureRapportsHebdomadaires();
      }).toThrow(UnauthorizedError);
    });
  });

  describe("estAutoriseAAccederAuxRapportsHebdomadaires", () => {
    it("devrait retourner true pour un COORDINATEUR_REGION", () => {
      // Given
      const habilitation = new HabilitationBuilder()
        .avecProfilCode(ProfilEnum.COORDINATEUR_REGION)
        .build();

      // When
      const resultat =
        habilitation.estAutoriseAAccederAuxRapportsHebdomadaires();

      // Then
      expect(resultat).toBe(true);
    });

    it("devrait retourner false pour un DITP_ADMIN", () => {
      // Given
      const habilitation = new HabilitationBuilder()
        .avecProfilCode(ProfilEnum.DITP_ADMIN)
        .build();

      // When
      const resultat =
        habilitation.estAutoriseAAccederAuxRapportsHebdomadaires();

      // Then
      expect(resultat).toBe(false);
    });
  });
});
