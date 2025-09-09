import { prisma } from "@/server/db/prisma";
import { PrismaIndicateurRepository } from "@/server/chantiers/infrastructure/adapters/PrismaIndicateurRepository";
import { EvenementValeurEnum } from "@/server/app/domain/EvenementValeurEnum";
import { ProfilEnum } from "@/server/app/enum/profil.enum";
import { Habilitations } from "@/server/domain/utilisateur/habilitation/Habilitation.interface";

describe("PrismaIndicateurRepository", () => {
  const dateDerniereExecutionDatajobs = new Date("2026-02-12T00:00:00.000Z");
  let prismaIndicateurRepository: PrismaIndicateurRepository;

  beforeEach(() => {
    prismaIndicateurRepository = new PrismaIndicateurRepository();
  });

  describe("#listerParIndicId", () => {
    it("doit récupérer les données associés à l'indicateur", async () => {
      // Given
      const indicId = "IND-001";
      await prisma.chantier_identite.create({
        data: {
          id: "CH-001",
          nom: "Nom chantier OK",
          directeurs_administration_centrale: ["DAC 1", "DAC 2"],
          directeurs_projet: ["DP 1", "DP 2"],
        },
      });

      await prisma.chantier_territoire.createMany({
        data: [
          {
            id: "CH-001",
            code_insee: "FR",
            maille: "NAT",
            zone_id: "FRANCE",
            territoire_code: "NAT-FR",
          },
          {
            id: "CH-001",
            code_insee: "FR",
            maille: "REG",
            zone_id: "R51",
            territoire_code: "REG-01",
          },
        ],
      });

      await prisma.indicateur_identite.create({
        data: {
          id: "IND-001",
          nom: "Indicateur OK",
          chantier_id: "CH-001",
          type_id: "IMPACT",
        },
      });

      await prisma.indicateur_territoire.createMany({
        data: [
          {
            id: "IND-001",
            chantier_id: "CH-001",
            code_insee: "FR",
            maille: "NAT",
            zone_id: "FRANCE",
            territoire_code: "NAT-FR",
            ponderation_zone_reel: 20,
          },
          {
            id: "IND-001",
            chantier_id: "CH-001",
            code_insee: "01",
            maille: "REG",
            zone_id: "R51",
            territoire_code: "REG-01",
            ponderation_zone_reel: 20,
          },
        ],
      });

      await prisma.indicateur_territoire_jalon.createMany({
        data: [
          {
            id: "IND-001",
            code_insee: "FR",
            maille: "NAT",
            zone_id: "FRANCE",
            territoire_code: "NAT-FR",
            valeur_cible: 20,
            date_valeur_cible: new Date("2024-12-06"),
            taux_avancement: 13,
            valeur_actuelle: 20,
            date_valeur_actuelle: new Date("2024-12-06"),
            jalon: 2024,
          },
          {
            id: "IND-001",
            code_insee: "FR",
            maille: "NAT",
            zone_id: "FRANCE",
            territoire_code: "NAT-FR",
            valeur_cible: 22,
            date_valeur_cible: new Date("2025-12-06"),
            taux_avancement: 13,
            valeur_actuelle: 25,
            date_valeur_actuelle: new Date("2025-12-06"),
            jalon: 2025,
          },
          {
            id: "IND-001",
            code_insee: "01",
            maille: "REG",
            zone_id: "D51",
            territoire_code: "REG-01",
            valeur_cible: 22,
            date_valeur_cible: new Date("2025-12-06"),
            taux_avancement: 13,
            jalon: 2025,
            valeur_actuelle: 30,
            date_valeur_actuelle: new Date("2025-12-06"),
          },
        ],
      });

      // When
      const listeDonneesIndicateurs =
        await prismaIndicateurRepository.listerParIndicId({
          indicId,
          jalon: 2025,
        });
      // Then
      expect(listeDonneesIndicateurs).toHaveLength(2);
      expect(listeDonneesIndicateurs[0].indicId).toEqual("IND-001");
      expect(listeDonneesIndicateurs[0].territoireCode).toEqual("NAT-FR");
      expect(listeDonneesIndicateurs[0].valeurCibleAnnuelle).toEqual(22);
      expect(
        listeDonneesIndicateurs[0].dateValeurCibleAnnuelle?.toISOString(),
      ).toStartWith("2025-12-06");
      expect(listeDonneesIndicateurs[0].tauxAvancementAnnuel).toEqual(13);
      expect(listeDonneesIndicateurs[0].valeurAvancement).toEqual(25);
      expect(
        listeDonneesIndicateurs[0].dateValeurAvancement?.toISOString(),
      ).toStartWith("2025-12-06");
      expect(listeDonneesIndicateurs[1].indicId).toEqual("IND-001");
      expect(listeDonneesIndicateurs[1].territoireCode).toEqual("REG-01");
      expect(listeDonneesIndicateurs[1].valeurAvancement).toEqual(30);
      expect(
        listeDonneesIndicateurs[1].dateValeurAvancement?.toISOString(),
      ).toStartWith("2025-12-06");
    });

    it("quand on donne un jalon, doit récupérer les données associés à l'indicateur", async () => {
      // Given
      const indicId = "IND-001";
      await prisma.chantier_identite.create({
        data: {
          id: "CH-001",
          nom: "Nom chantier OK",
          directeurs_administration_centrale: ["DAC 1", "DAC 2"],
          directeurs_projet: ["DP 1", "DP 2"],
        },
      });

      await prisma.chantier_territoire.createMany({
        data: [
          {
            id: "CH-001",
            code_insee: "FR",
            maille: "NAT",
            zone_id: "FRANCE",
            territoire_code: "NAT-FR",
          },
          {
            id: "CH-001",
            code_insee: "FR",
            maille: "REG",
            zone_id: "R51",
            territoire_code: "REG-01",
          },
        ],
      });

      await prisma.indicateur_identite.create({
        data: {
          id: "IND-001",
          nom: "Indicateur OK",
          chantier_id: "CH-001",
          type_id: "IMPACT",
        },
      });

      await prisma.indicateur_territoire.createMany({
        data: [
          {
            id: "IND-001",
            chantier_id: "CH-001",
            code_insee: "FR",
            maille: "NAT",
            zone_id: "FRANCE",
            territoire_code: "NAT-FR",
            ponderation_zone_reel: 20,
          },
          {
            id: "IND-001",
            chantier_id: "CH-001",
            code_insee: "01",
            maille: "REG",
            zone_id: "R51",
            territoire_code: "REG-01",
            ponderation_zone_reel: 20,
          },
        ],
      });

      await prisma.indicateur_territoire_jalon.createMany({
        data: [
          {
            id: "IND-001",
            code_insee: "FR",
            maille: "NAT",
            zone_id: "FRANCE",
            territoire_code: "NAT-FR",
            valeur_cible: 20,
            date_valeur_cible: new Date("2024-12-06"),
            taux_avancement: 13,
            valeur_actuelle: 20,
            date_valeur_actuelle: new Date("2024-12-06"),
            jalon: 2024,
          },
          {
            id: "IND-001",
            code_insee: "FR",
            maille: "NAT",
            zone_id: "FRANCE",
            territoire_code: "NAT-FR",
            valeur_cible: 22,
            date_valeur_cible: new Date("2025-12-06"),
            taux_avancement: 13,
            valeur_actuelle: 25,
            date_valeur_actuelle: new Date("2025-12-06"),
            jalon: 2025,
          },
          {
            id: "IND-001",
            code_insee: "01",
            maille: "REG",
            zone_id: "D51",
            territoire_code: "REG-01",
            valeur_cible: 22,
            date_valeur_cible: new Date("2025-12-06"),
            taux_avancement: 13,
            jalon: 2025,
            valeur_actuelle: 30,
            date_valeur_actuelle: new Date("2025-12-06"),
          },
        ],
      });

      // When
      const listeDonneesIndicateurs =
        await prismaIndicateurRepository.listerParIndicId({
          indicId,
          jalon: 2024,
        });
      // Then
      expect(listeDonneesIndicateurs).toHaveLength(2);
      expect(listeDonneesIndicateurs[0].indicId).toEqual("IND-001");
      expect(listeDonneesIndicateurs[0].territoireCode).toEqual("NAT-FR");
      expect(listeDonneesIndicateurs[0].valeurCibleAnnuelle).toEqual(20);
      expect(
        listeDonneesIndicateurs[0].dateValeurCibleAnnuelle?.toISOString(),
      ).toStartWith("2024-12-06");
      expect(listeDonneesIndicateurs[0].tauxAvancementAnnuel).toEqual(13);
      expect(listeDonneesIndicateurs[0].valeurAvancement).toEqual(20);
      expect(
        listeDonneesIndicateurs[0].dateValeurAvancement?.toISOString(),
      ).toStartWith("2024-12-06");
      expect(listeDonneesIndicateurs[1].indicId).toEqual("IND-001");
      expect(listeDonneesIndicateurs[1].territoireCode).toEqual("REG-01");
      expect(listeDonneesIndicateurs[1].valeurAvancement).toEqual(null);
      expect(listeDonneesIndicateurs[1].dateValeurAvancement).toEqual(null);
    });
  });

  describe("#supprimerPropositionValeurAvancement", () => {
    it("doit supprimer les données associés à la proposition de valeur actuelle de l'indicateur", async () => {
      // Given
      const indicId = "IND-001";
      await prisma.chantier_identite.create({
        data: {
          id: "CH-001",
          nom: "Nom chantier OK",
          directeurs_administration_centrale: ["DAC 1", "DAC 2"],
          directeurs_projet: ["DP 1", "DP 2"],
        },
      });

      await prisma.chantier_territoire.createMany({
        data: [
          {
            id: "CH-001",
            code_insee: "FR",
            maille: "NAT",
            zone_id: "FRANCE",
            territoire_code: "NAT-FR",
          },
        ],
      });

      await prisma.indicateur_identite.create({
        data: {
          id: "IND-001",
          nom: "Indicateur OK",
          chantier_id: "CH-001",
          type_id: "IMPACT",
        },
      });

      await prisma.indicateur_territoire.create({
        data: {
          id: "IND-001",
          chantier_id: "CH-001",
          code_insee: "FR",
          maille: "NAT",
          zone_id: "FRANCE",
          territoire_code: "NAT-FR",
          ponderation_zone_reel: 20,
          motif_proposition: "Un motif",
          date_proposition: new Date("2025-12-06"),
          auteur_proposition: "John Doe",
          valeur_actuelle_proposition: 10,
          source_donnee_methode_calcul_proposition: "Une source",
          taux_avancement_mandat_proposition: 12,
        },
      });

      await prisma.indicateur_territoire_jalon.create({
        data: {
          id: "IND-001",
          code_insee: "FR",
          maille: "NAT",
          zone_id: "FRANCE",
          jalon: 2025,
          territoire_code: "NAT-FR",
          taux_avancement_proposition: 30,
        },
      });

      // When
      await prismaIndicateurRepository.supprimerPropositionValeurAvancement({
        indicId,
        territoireCode: "NAT-FR",
        auteurModification: "Jane Doe",
      });

      // Then
      const indicateur = await prisma.indicateur_identite.findUnique({
        where: {
          id: "IND-001",
        },
        include: {
          indicateur_territoire: {
            where: {
              territoire_code: "NAT-FR",
            },
            include: {
              indicateur_territoire_jalon: {
                where: {
                  jalon: 2025,
                  territoire_code: "NAT-FR",
                },
              },
            },
          },
        },
      });

      expect(
        indicateur?.indicateur_territoire.at(0)?.motif_proposition,
      ).toEqual(null);
      expect(indicateur?.indicateur_territoire.at(0)?.date_proposition).toEqual(
        null,
      );
      expect(
        indicateur?.indicateur_territoire.at(0)?.auteur_proposition,
      ).toEqual("Jane Doe");
      expect(
        indicateur?.indicateur_territoire.at(0)?.valeur_actuelle_proposition,
      ).toEqual(null);
      expect(
        indicateur?.indicateur_territoire.at(0)
          ?.source_donnee_methode_calcul_proposition,
      ).toEqual(null);
      expect(
        indicateur?.indicateur_territoire.at(0)
          ?.taux_avancement_mandat_proposition,
      ).toEqual(null);
      expect(
        indicateur?.indicateur_territoire.at(0)?.indicateur_territoire_jalon[0]
          .taux_avancement_proposition,
      ).toEqual(null);
    });
  });

  describe("#recupererDetailsParChantierIdEtTerritoire", () => {
    it("sans proposition de valeur d'avancement, retourne les détails des indicateurs pour un chantier et un territoire", async () => {
      // Given
      const chantierId = "CH-001";
      const territoireCodes = ["NAT-FR"];
      const jalon = 2025;

      await prisma.chantier_identite.createMany({
        data: [
          {
            id: chantierId,
            nom: "Chantier 001",
            ministeres: ["1009"],
            ministeres_acronymes: ["MINA"],
          },
        ],
      });

      await prisma.chantier_territoire.createMany({
        data: [
          {
            id: "CH-001",
            maille: "NAT",
            code_insee: "FR",
            territoire_code: "NAT-FR",
            zone_id: "FRANCE",
          },
          {
            id: "CH-001",
            maille: "DEPT",
            code_insee: "01",
            territoire_code: "DEPT-01",
            zone_id: "D01",
          },
        ],
      });

      await prisma.indicateur_identite.createMany({
        data: [
          {
            id: "IND-001",
            nom: "Indicateur 001",
            chantier_id: chantierId,
            dernier_import_date_indic: new Date("2026-01-12"),
            type_id: "IMPACT",
            unite_mesure: "kg",
          },
        ],
      });

      await prisma.indicateur_territoire.createMany({
        data: [
          {
            id: "IND-001",
            chantier_id: chantierId,
            maille: "NAT",
            territoire_code: "NAT-FR",
            code_insee: "FR",
            zone_id: "FRANCE",
            evolution_valeur_actuelle: [
              {
                date: new Date("2026-01-12"),
                valeur: 100,
              },
              {
                date: new Date("2026-01-14"),
                valeur: 110,
              },
            ],
          },
          {
            id: "IND-001",
            chantier_id: chantierId,
            maille: "DEPT",
            territoire_code: "DEPT-01",
            code_insee: "01",
            zone_id: "D01",
          },
        ],
      });

      await prisma.indicateur_territoire_jalon.createMany({
        data: [
          {
            id: "IND-001",
            territoire_code: "NAT-FR",
            code_insee: "FR",
            maille: "NAT",
            jalon: 2025,
            zone_id: "FRANCE",
            valeur_actuelle: 110,
            date_valeur_actuelle: new Date("2026-01-12"),
          },
        ],
      });

      await prisma.utilisateur.create({
        data: {
          email: "jane.doe@test.com",
          nom: "Jane",
          prenom: "Doe",
          id: "550e8400-e29b-41d4-a716-446655440001",
          date_creation: new Date().toISOString(),
          profil: {
            connect: {
              code: ProfilEnum.DITP_ADMIN,
            },
          },
        },
      });

      await prisma.indicateur_territoire_valeur_evenement.createMany({
        data: [
          {
            id: "550e8400-e29b-41d4-a716-446655440000",
            indic_id: "IND-001",
            territoire_code: "NAT-FR",
            type_valeur: "VALEUR_AVANCEMENT",
            donnees_complementaires: {},
            type_evenement: EvenementValeurEnum.VALEUR_CREEE,
            date_valeur: new Date("2026-01-12"),
            ordre: 1,
            date_modification: new Date("2026-01-12"),
            date_creation: new Date("2026-01-12"),
            id_auteur_modification: "550e8400-e29b-41d4-a716-446655440001",
            correlation_id: "550e8400-e29b-41d4-a716-446655440002",
            valeur: 100,
          },
          {
            id: "550e8400-e29b-41d4-a716-446655440001",
            indic_id: "IND-001",
            territoire_code: "NAT-FR",
            type_valeur: "VALEUR_AVANCEMENT",
            donnees_complementaires: {},
            type_evenement: EvenementValeurEnum.VALEUR_MODIFIEE,
            date_valeur: new Date("2026-01-12"),
            ordre: 2,
            date_modification: new Date("2026-01-12"),
            date_creation: new Date("2026-01-12"),
            id_auteur_modification: "550e8400-e29b-41d4-a716-446655440001",
            correlation_id: "550e8400-e29b-41d4-a716-446655440002",
            valeur: 110,
          },
        ],
      });

      // When
      const result =
        await prismaIndicateurRepository.recupererDetailsParChantierIdEtTerritoire(
          chantierId,
          territoireCodes,
          jalon,
          dateDerniereExecutionDatajobs,
        );

      // Then
      expect(result["IND-001"]["NAT-FR"].valeurAvancement).toEqual(110);
      expect(result["IND-001"]["NAT-FR"].dateValeurAvancement).toEqual(
        "2026-01-12T00:00:00.000Z",
      );
      expect(result["IND-001"]["NAT-FR"].proposition).toBeNull();
      expect(result["IND-001"]["NAT-FR"].historiquesValeurs).toEqual([
        {
          date: "2026-01-12T00:00:00.000Z",
          valeur: 100,
        },
        {
          date: "2026-01-14T00:00:00.000Z",
          valeur: 110,
        },
      ]);
    });

    it("Quand il existe une proposition de valeur d'avancement [CREEE], retourne les détails des indicateurs pour un chantier, territoire et proposition", async () => {
      // Given
      const chantierId = "CH-001";
      const territoireCodes = ["NAT-FR"];
      const jalon = 2025;

      await prisma.chantier_identite.createMany({
        data: [
          {
            id: chantierId,
            nom: "Chantier 001",
            ministeres: ["1009"],
            ministeres_acronymes: ["MINA"],
          },
        ],
      });

      await prisma.chantier_territoire.createMany({
        data: [
          {
            id: "CH-001",
            maille: "NAT",
            code_insee: "FR",
            territoire_code: "NAT-FR",
            zone_id: "FRANCE",
          },
          {
            id: "CH-001",
            maille: "DEPT",
            code_insee: "01",
            territoire_code: "DEPT-01",
            zone_id: "D01",
          },
        ],
      });

      await prisma.indicateur_identite.createMany({
        data: [
          {
            id: "IND-001",
            nom: "Indicateur 001",
            chantier_id: chantierId,
            dernier_import_date_indic: new Date("2026-01-12"),
            type_id: "IMPACT",
            unite_mesure: "kg",
          },
        ],
      });

      await prisma.indicateur_territoire.createMany({
        data: [
          {
            id: "IND-001",
            chantier_id: chantierId,
            maille: "NAT",
            territoire_code: "NAT-FR",
            code_insee: "FR",
            zone_id: "FRANCE",
          },
          {
            id: "IND-001",
            chantier_id: chantierId,
            maille: "DEPT",
            territoire_code: "DEPT-01",
            code_insee: "01",
            zone_id: "D01",
          },
        ],
      });

      await prisma.indicateur_territoire_jalon.createMany({
        data: [
          {
            id: "IND-001",
            territoire_code: "NAT-FR",
            code_insee: "FR",
            maille: "NAT",
            jalon: 2025,
            zone_id: "FRANCE",
            valeur_actuelle: 110,
            date_valeur_actuelle: new Date("2026-01-12"),
          },
        ],
      });

      await prisma.utilisateur.create({
        data: {
          email: "jane.doe@test.com",
          nom: "Doe",
          prenom: "Jane",
          id: "550e8400-e29b-41d4-a716-446655440001",
          date_creation: new Date().toISOString(),
          profil: {
            connect: {
              code: ProfilEnum.DITP_ADMIN,
            },
          },
        },
      });

      await prisma.indicateur_territoire_valeur_evenement.createMany({
        data: [
          {
            id: "550e8400-e29b-41d4-a716-446655440000",
            indic_id: "IND-001",
            territoire_code: "NAT-FR",
            type_valeur: "VALEUR_AVANCEMENT",
            donnees_complementaires: {},
            type_evenement: EvenementValeurEnum.VALEUR_CREEE,
            date_valeur: new Date("2026-01-12"),
            ordre: 1,
            date_modification: new Date("2026-01-12"),
            date_creation: new Date("2026-01-12"),
            id_auteur_modification: "550e8400-e29b-41d4-a716-446655440001",
            correlation_id: "550e8400-e29b-41d4-a716-446655440002",
            valeur: 100,
          },
          {
            id: "550e8400-e29b-41d4-a716-446655440001",
            indic_id: "IND-001",
            territoire_code: "NAT-FR",
            type_valeur: "VALEUR_AVANCEMENT",
            donnees_complementaires: {},
            type_evenement: EvenementValeurEnum.VALEUR_MODIFIEE,
            date_valeur: new Date("2026-01-12"),
            ordre: 2,
            date_modification: new Date("2026-01-12"),
            date_creation: new Date("2026-01-12"),
            id_auteur_modification: "550e8400-e29b-41d4-a716-446655440001",
            correlation_id: "550e8400-e29b-41d4-a716-446655440002",
            valeur: 110,
          },
          {
            id: "550e8400-e29b-41d4-a716-446655440002",
            indic_id: "IND-001",
            territoire_code: "NAT-FR",
            type_valeur: "VALEUR_AVANCEMENT",
            donnees_complementaires: {
              motif: "Motif de la proposition",
              source_donnee_methode_calcul:
                "Source de la donnée et méthode de calcul",
            },
            type_evenement: EvenementValeurEnum.PROPOSITION_VALEUR_CREEE,
            date_valeur: new Date("2026-01-12"),
            ordre: 3,
            date_modification: new Date("2026-01-12"),
            date_creation: new Date("2026-01-12"),
            id_auteur_modification: "550e8400-e29b-41d4-a716-446655440001",
            correlation_id: "550e8400-e29b-41d4-a716-446655440002",
            valeur: 120,
          },
        ],
      });

      // When
      const result =
        await prismaIndicateurRepository.recupererDetailsParChantierIdEtTerritoire(
          chantierId,
          territoireCodes,
          jalon,
          dateDerniereExecutionDatajobs,
        );

      // Then
      expect(result["IND-001"]["NAT-FR"].valeurAvancement).toEqual(110);
      expect(result["IND-001"]["NAT-FR"].dateValeurAvancement).toEqual(
        "2026-01-12T00:00:00.000Z",
      );
      expect(result["IND-001"]["NAT-FR"].proposition).toEqual({
        valeurAvancement: 120,
        tauxAvancement: null,
        tauxAvancementIntermediaire: null,
        statutTauxAvancement: "CALCULE",
        auteur: "Jane Doe",
        dateProposition: "2026-01-12T00:00:00.000Z",
        motif: "Motif de la proposition",
        sourceDonneeEtMethodeCalcul: "Source de la donnée et méthode de calcul",
      });
    });

    it("Quand il existe une proposition de valeur d'avancement [CREEE, MODIFIEE], retourne les détails des indicateurs pour un chantier, territoire et dernière proposition", async () => {
      // Given
      const chantierId = "CH-001";
      const territoireCodes = ["NAT-FR"];
      const jalon = 2025;

      await prisma.chantier_identite.createMany({
        data: [
          {
            id: chantierId,
            nom: "Chantier 001",
            ministeres: ["1009"],
            ministeres_acronymes: ["MINA"],
          },
        ],
      });

      await prisma.chantier_territoire.createMany({
        data: [
          {
            id: "CH-001",
            maille: "NAT",
            code_insee: "FR",
            territoire_code: "NAT-FR",
            zone_id: "FRANCE",
          },
          {
            id: "CH-001",
            maille: "DEPT",
            code_insee: "01",
            territoire_code: "DEPT-01",
            zone_id: "D01",
          },
        ],
      });

      await prisma.indicateur_identite.createMany({
        data: [
          {
            id: "IND-001",
            nom: "Indicateur 001",
            chantier_id: chantierId,
            dernier_import_date_indic: new Date("2026-01-12"),
            type_id: "IMPACT",
            unite_mesure: "kg",
          },
        ],
      });

      await prisma.indicateur_territoire.createMany({
        data: [
          {
            id: "IND-001",
            chantier_id: chantierId,
            maille: "NAT",
            territoire_code: "NAT-FR",
            code_insee: "FR",
            zone_id: "FRANCE",
          },
          {
            id: "IND-001",
            chantier_id: chantierId,
            maille: "DEPT",
            territoire_code: "DEPT-01",
            code_insee: "01",
            zone_id: "D01",
          },
        ],
      });

      await prisma.indicateur_territoire_jalon.createMany({
        data: [
          {
            id: "IND-001",
            territoire_code: "NAT-FR",
            code_insee: "FR",
            maille: "NAT",
            jalon: 2025,
            zone_id: "FRANCE",
            valeur_actuelle: 110,
            date_valeur_actuelle: new Date("2026-01-12"),
          },
        ],
      });

      await prisma.utilisateur.create({
        data: {
          email: "jane.doe@test.com",
          nom: "Doe",
          prenom: "Jane",
          id: "550e8400-e29b-41d4-a716-446655440001",
          date_creation: new Date().toISOString(),
          profil: {
            connect: {
              code: ProfilEnum.DITP_ADMIN,
            },
          },
        },
      });

      await prisma.indicateur_territoire_valeur_evenement.createMany({
        data: [
          {
            id: "550e8400-e29b-41d4-a716-446655440000",
            indic_id: "IND-001",
            territoire_code: "NAT-FR",
            type_valeur: "VALEUR_AVANCEMENT",
            donnees_complementaires: {},
            type_evenement: EvenementValeurEnum.VALEUR_CREEE,
            date_valeur: new Date("2026-01-12"),
            ordre: 1,
            date_modification: new Date("2026-01-12"),
            date_creation: new Date("2026-01-12"),
            id_auteur_modification: "550e8400-e29b-41d4-a716-446655440001",
            correlation_id: "550e8400-e29b-41d4-a716-446655440002",
            valeur: 100,
          },
          {
            id: "550e8400-e29b-41d4-a716-446655440001",
            indic_id: "IND-001",
            territoire_code: "NAT-FR",
            type_valeur: "VALEUR_AVANCEMENT",
            donnees_complementaires: {},
            type_evenement: EvenementValeurEnum.VALEUR_MODIFIEE,
            date_valeur: new Date("2026-01-12"),
            ordre: 2,
            date_modification: new Date("2026-01-12"),
            date_creation: new Date("2026-01-12"),
            id_auteur_modification: "550e8400-e29b-41d4-a716-446655440001",
            correlation_id: "550e8400-e29b-41d4-a716-446655440002",
            valeur: 110,
          },
          {
            id: "550e8400-e29b-41d4-a716-446655440002",
            indic_id: "IND-001",
            territoire_code: "NAT-FR",
            type_valeur: "VALEUR_AVANCEMENT",
            donnees_complementaires: {
              motif: "Motif de la proposition",
              sourceDonneeEtMethodeCalcul:
                "Source de la donnée et méthode de calcul",
            },
            type_evenement: EvenementValeurEnum.PROPOSITION_VALEUR_CREEE,
            date_valeur: new Date("2026-01-12"),
            ordre: 3,
            date_modification: new Date("2026-01-12"),
            date_creation: new Date("2026-01-12"),
            id_auteur_modification: "550e8400-e29b-41d4-a716-446655440001",
            correlation_id: "550e8400-e29b-41d4-a716-446655440002",
            valeur: 120,
          },
          {
            id: "550e8400-e29b-41d4-a716-446655440003",
            indic_id: "IND-001",
            territoire_code: "NAT-FR",
            type_valeur: "VALEUR_AVANCEMENT",
            donnees_complementaires: {},
            type_evenement: EvenementValeurEnum.PROPOSITION_VALEUR_MODIFIEE,
            date_valeur: new Date("2026-01-12"),
            ordre: 4,
            date_modification: new Date("2026-01-12"),
            date_creation: new Date("2026-01-12"),
            id_auteur_modification: "550e8400-e29b-41d4-a716-446655440001",
            correlation_id: "550e8400-e29b-41d4-a716-446655440002",
            valeur: 140,
          },
        ],
      });

      // When
      const result =
        await prismaIndicateurRepository.recupererDetailsParChantierIdEtTerritoire(
          chantierId,
          territoireCodes,
          jalon,
          dateDerniereExecutionDatajobs,
        );

      // Then
      expect(result["IND-001"]["NAT-FR"].valeurAvancement).toEqual(110);
      expect(result["IND-001"]["NAT-FR"].dateValeurAvancement).toEqual(
        "2026-01-12T00:00:00.000Z",
      );
      expect(result["IND-001"]["NAT-FR"].proposition).toEqual({
        valeurAvancement: 140,
        tauxAvancement: null,
        tauxAvancementIntermediaire: null,
        statutTauxAvancement: "CALCULE",
        auteur: "Jane Doe",
        dateProposition: "2026-01-12T00:00:00.000Z",
        motif: null,
        sourceDonneeEtMethodeCalcul: null,
      });
    });

    it.each([
      [EvenementValeurEnum.PROPOSITION_VALEUR_SUPPRIMEE],
      [EvenementValeurEnum.PROPOSITION_VALEUR_REFUSEE],
      [EvenementValeurEnum.PROPOSITION_VALEUR_IGNOREE_VALEUR_MODIFIEE],
      [EvenementValeurEnum.PROPOSITION_VALEUR_IGNOREE_VALEUR_HISTORISEE],
    ])(
      "Quand il existe une proposition de valeur d'avancement [CREEE, MODIFIEE, %s], retourne les détails des indicateurs pour un chantier, territoire et aucune proposition",
      async (evenement) => {
        // Given
        const chantierId = "CH-001";
        const territoireCodes = ["NAT-FR"];
        const jalon = 2025;

        await prisma.chantier_identite.createMany({
          data: [
            {
              id: chantierId,
              nom: "Chantier 001",
              ministeres: ["1009"],
              ministeres_acronymes: ["MINA"],
            },
          ],
        });

        await prisma.chantier_territoire.createMany({
          data: [
            {
              id: "CH-001",
              maille: "NAT",
              code_insee: "FR",
              territoire_code: "NAT-FR",
              zone_id: "FRANCE",
            },
            {
              id: "CH-001",
              maille: "DEPT",
              code_insee: "01",
              territoire_code: "DEPT-01",
              zone_id: "D01",
            },
          ],
        });

        await prisma.indicateur_identite.createMany({
          data: [
            {
              id: "IND-001",
              nom: "Indicateur 001",
              chantier_id: chantierId,
              dernier_import_date_indic: new Date("2026-01-12"),
              type_id: "IMPACT",
              unite_mesure: "kg",
            },
          ],
        });

        await prisma.indicateur_territoire.createMany({
          data: [
            {
              id: "IND-001",
              chantier_id: chantierId,
              maille: "NAT",
              territoire_code: "NAT-FR",
              code_insee: "FR",
              zone_id: "FRANCE",
            },
            {
              id: "IND-001",
              chantier_id: chantierId,
              maille: "DEPT",
              territoire_code: "DEPT-01",
              code_insee: "01",
              zone_id: "D01",
            },
          ],
        });

        await prisma.indicateur_territoire_jalon.createMany({
          data: [
            {
              id: "IND-001",
              territoire_code: "NAT-FR",
              code_insee: "FR",
              maille: "NAT",
              jalon: 2025,
              zone_id: "FRANCE",
              valeur_actuelle: 110,
              date_valeur_actuelle: new Date("2026-01-12"),
            },
          ],
        });

        await prisma.utilisateur.create({
          data: {
            email: "jane.doe@test.com",
            nom: "Doe",
            prenom: "Jane",
            id: "550e8400-e29b-41d4-a716-446655440001",
            date_creation: new Date().toISOString(),
            profil: {
              connect: {
                code: ProfilEnum.DITP_ADMIN,
              },
            },
          },
        });

        await prisma.indicateur_territoire_valeur_evenement.createMany({
          data: [
            {
              id: "550e8400-e29b-41d4-a716-446655440000",
              indic_id: "IND-001",
              territoire_code: "NAT-FR",
              type_valeur: "VALEUR_AVANCEMENT",
              donnees_complementaires: {},
              type_evenement: EvenementValeurEnum.VALEUR_CREEE,
              date_valeur: new Date("2026-01-12"),
              ordre: 1,
              date_modification: new Date("2026-01-12"),
              date_creation: new Date("2026-01-12"),
              id_auteur_modification: "550e8400-e29b-41d4-a716-446655440001",
              correlation_id: "550e8400-e29b-41d4-a716-446655440002",
              valeur: 100,
            },
            {
              id: "550e8400-e29b-41d4-a716-446655440001",
              indic_id: "IND-001",
              territoire_code: "NAT-FR",
              type_valeur: "VALEUR_AVANCEMENT",
              donnees_complementaires: {},
              type_evenement: EvenementValeurEnum.VALEUR_MODIFIEE,
              date_valeur: new Date("2026-01-12"),
              ordre: 2,
              date_modification: new Date("2026-01-12"),
              date_creation: new Date("2026-01-12"),
              id_auteur_modification: "550e8400-e29b-41d4-a716-446655440001",
              correlation_id: "550e8400-e29b-41d4-a716-446655440002",
              valeur: 110,
            },
            {
              id: "550e8400-e29b-41d4-a716-446655440002",
              indic_id: "IND-001",
              territoire_code: "NAT-FR",
              type_valeur: "VALEUR_AVANCEMENT",
              donnees_complementaires: {},
              type_evenement: EvenementValeurEnum.PROPOSITION_VALEUR_CREEE,
              date_valeur: new Date("2026-01-12"),
              ordre: 3,
              date_modification: new Date("2026-01-12"),
              date_creation: new Date("2026-01-12"),
              id_auteur_modification: "550e8400-e29b-41d4-a716-446655440001",
              correlation_id: "550e8400-e29b-41d4-a716-446655440002",
              valeur: 120,
            },
            {
              id: "550e8400-e29b-41d4-a716-446655440003",
              indic_id: "IND-001",
              territoire_code: "NAT-FR",
              type_valeur: "VALEUR_AVANCEMENT",
              donnees_complementaires: {},
              type_evenement: EvenementValeurEnum.PROPOSITION_VALEUR_MODIFIEE,
              date_valeur: new Date("2026-01-12"),
              ordre: 4,
              date_modification: new Date("2026-01-12"),
              date_creation: new Date("2026-01-14"),
              id_auteur_modification: "550e8400-e29b-41d4-a716-446655440001",
              correlation_id: "550e8400-e29b-41d4-a716-446655440002",
              valeur: 140,
            },

            {
              id: "550e8400-e29b-41d4-a716-446655440004",
              indic_id: "IND-001",
              territoire_code: "NAT-FR",
              type_valeur: "VALEUR_AVANCEMENT",
              donnees_complementaires: {},
              type_evenement: evenement,
              date_valeur: new Date("2026-01-12"),
              ordre: 5,
              date_modification: new Date("2026-01-12"),
              date_creation: new Date("2026-01-14"),
              id_auteur_modification: "550e8400-e29b-41d4-a716-446655440001",
              correlation_id: "550e8400-e29b-41d4-a716-446655440002",
              valeur: 140,
            },
          ],
        });

        // When
        const result =
          await prismaIndicateurRepository.recupererDetailsParChantierIdEtTerritoire(
            chantierId,
            territoireCodes,
            jalon,
            dateDerniereExecutionDatajobs,
          );

        // Then
        expect(result["IND-001"]["NAT-FR"].valeurAvancement).toEqual(110);
        expect(result["IND-001"]["NAT-FR"].dateValeurAvancement).toEqual(
          "2026-01-12T00:00:00.000Z",
        );
        expect(result["IND-001"]["NAT-FR"].proposition).toBeNull();
      },
    );

    it.each([
      EvenementValeurEnum.PROPOSITION_VALEUR_ACCEPTEE,
      EvenementValeurEnum.PROPOSITION_VALEUR_ACCEPTEE_AVEC_MODIFICATION,
    ])(
      "Quand il existe une proposition de valeur d'avancement [CREEE, MODIFIEE, %s], retourne les détails des indicateurs pour un chantier, territoire et la proposition",
      async (evenement) => {
        // Given
        const chantierId = "CH-001";
        const territoireCodes = ["NAT-FR"];
        const jalon = 2025;

        await prisma.chantier_identite.createMany({
          data: [
            {
              id: chantierId,
              nom: "Chantier 001",
              ministeres: ["1009"],
              ministeres_acronymes: ["MINA"],
            },
          ],
        });

        await prisma.chantier_territoire.createMany({
          data: [
            {
              id: "CH-001",
              maille: "NAT",
              code_insee: "FR",
              territoire_code: "NAT-FR",
              zone_id: "FRANCE",
            },
            {
              id: "CH-001",
              maille: "DEPT",
              code_insee: "01",
              territoire_code: "DEPT-01",
              zone_id: "D01",
            },
          ],
        });

        await prisma.indicateur_identite.createMany({
          data: [
            {
              id: "IND-001",
              nom: "Indicateur 001",
              chantier_id: chantierId,
              dernier_import_date_indic: new Date("2026-01-12"),
              type_id: "IMPACT",
              unite_mesure: "kg",
            },
          ],
        });

        await prisma.indicateur_territoire.createMany({
          data: [
            {
              id: "IND-001",
              chantier_id: chantierId,
              maille: "NAT",
              territoire_code: "NAT-FR",
              code_insee: "FR",
              zone_id: "FRANCE",
            },
            {
              id: "IND-001",
              chantier_id: chantierId,
              maille: "DEPT",
              territoire_code: "DEPT-01",
              code_insee: "01",
              zone_id: "D01",
            },
          ],
        });

        await prisma.indicateur_territoire_jalon.createMany({
          data: [
            {
              id: "IND-001",
              territoire_code: "NAT-FR",
              code_insee: "FR",
              maille: "NAT",
              jalon: 2025,
              zone_id: "FRANCE",
              valeur_actuelle: 110,
              date_valeur_actuelle: new Date("2026-01-12"),
            },
          ],
        });

        await prisma.utilisateur.create({
          data: {
            email: "jane.doe@test.com",
            nom: "Doe",
            prenom: "Jane",
            id: "550e8400-e29b-41d4-a716-446655440001",
            date_creation: new Date().toISOString(),
            profil: {
              connect: {
                code: ProfilEnum.DITP_ADMIN,
              },
            },
          },
        });

        await prisma.indicateur_territoire_valeur_evenement.createMany({
          data: [
            {
              id: "550e8400-e29b-41d4-a716-446655440000",
              indic_id: "IND-001",
              territoire_code: "NAT-FR",
              type_valeur: "VALEUR_AVANCEMENT",
              donnees_complementaires: {},
              type_evenement: EvenementValeurEnum.VALEUR_CREEE,
              date_valeur: new Date("2026-01-12"),
              ordre: 1,
              date_modification: new Date("2026-01-12"),
              date_creation: new Date("2026-01-12"),
              id_auteur_modification: "550e8400-e29b-41d4-a716-446655440001",
              correlation_id: "550e8400-e29b-41d4-a716-446655440002",
              valeur: 100,
            },
            {
              id: "550e8400-e29b-41d4-a716-446655440001",
              indic_id: "IND-001",
              territoire_code: "NAT-FR",
              type_valeur: "VALEUR_AVANCEMENT",
              donnees_complementaires: {},
              type_evenement: EvenementValeurEnum.VALEUR_MODIFIEE,
              date_valeur: new Date("2026-01-12"),
              ordre: 2,
              date_modification: new Date("2026-01-12"),
              date_creation: new Date("2026-01-12"),
              id_auteur_modification: "550e8400-e29b-41d4-a716-446655440001",
              correlation_id: "550e8400-e29b-41d4-a716-446655440002",
              valeur: 110,
            },
            {
              id: "550e8400-e29b-41d4-a716-446655440002",
              indic_id: "IND-001",
              territoire_code: "NAT-FR",
              type_valeur: "VALEUR_AVANCEMENT",
              donnees_complementaires: {},
              type_evenement: EvenementValeurEnum.PROPOSITION_VALEUR_CREEE,
              date_valeur: new Date("2026-01-12"),
              ordre: 3,
              date_modification: new Date("2026-01-12"),
              date_creation: new Date("2026-01-12"),
              id_auteur_modification: "550e8400-e29b-41d4-a716-446655440001",
              correlation_id: "550e8400-e29b-41d4-a716-446655440002",
              valeur: 120,
            },
            {
              id: "550e8400-e29b-41d4-a716-446655440003",
              indic_id: "IND-001",
              territoire_code: "NAT-FR",
              type_valeur: "VALEUR_AVANCEMENT",
              donnees_complementaires: {},
              type_evenement: EvenementValeurEnum.PROPOSITION_VALEUR_MODIFIEE,
              date_valeur: new Date("2026-01-12"),
              ordre: 4,
              date_modification: new Date("2026-01-12"),
              date_creation: new Date("2026-01-14"),
              id_auteur_modification: "550e8400-e29b-41d4-a716-446655440001",
              correlation_id: "550e8400-e29b-41d4-a716-446655440002",
              valeur: 140,
            },

            {
              id: "550e8400-e29b-41d4-a716-446655440004",
              indic_id: "IND-001",
              territoire_code: "NAT-FR",
              type_valeur: "VALEUR_AVANCEMENT",
              donnees_complementaires: {},
              type_evenement: evenement,
              date_valeur: new Date("2026-01-12"),
              ordre: 5,
              date_modification: new Date("2026-01-12"),
              date_creation: new Date("2026-01-14"),
              id_auteur_modification: "550e8400-e29b-41d4-a716-446655440001",
              correlation_id: "550e8400-e29b-41d4-a716-446655440002",
              valeur: 140,
            },
          ],
        });

        // When
        const result =
          await prismaIndicateurRepository.recupererDetailsParChantierIdEtTerritoire(
            chantierId,
            territoireCodes,
            jalon,
            dateDerniereExecutionDatajobs,
          );

        // Then
        expect(result["IND-001"]["NAT-FR"].valeurAvancement).toEqual(110);
        expect(result["IND-001"]["NAT-FR"].dateValeurAvancement).toEqual(
          "2026-01-12T00:00:00.000Z",
        );
        expect(result["IND-001"]["NAT-FR"].proposition).toBeNull();
      },
    );

    it("Quand il existe une proposition de valeur d'avancement [CREEE, MODIFIEE, SUPPRIMEE, CREEE], retourne les détails des indicateurs pour un chantier, territoire et nouvelle proposition", async () => {
      // Given
      const chantierId = "CH-001";
      const territoireCodes = ["NAT-FR"];
      const jalon = 2025;

      await prisma.chantier_identite.createMany({
        data: [
          {
            id: chantierId,
            nom: "Chantier 001",
            ministeres: ["1009"],
            ministeres_acronymes: ["MINA"],
          },
        ],
      });

      await prisma.chantier_territoire.createMany({
        data: [
          {
            id: "CH-001",
            maille: "NAT",
            code_insee: "FR",
            territoire_code: "NAT-FR",
            zone_id: "FRANCE",
          },
          {
            id: "CH-001",
            maille: "DEPT",
            code_insee: "01",
            territoire_code: "DEPT-01",
            zone_id: "D01",
          },
        ],
      });

      await prisma.indicateur_identite.createMany({
        data: [
          {
            id: "IND-001",
            nom: "Indicateur 001",
            chantier_id: chantierId,
            dernier_import_date_indic: new Date("2026-01-12"),
            type_id: "IMPACT",
            unite_mesure: "kg",
          },
        ],
      });

      await prisma.indicateur_territoire.createMany({
        data: [
          {
            id: "IND-001",
            chantier_id: chantierId,
            maille: "NAT",
            territoire_code: "NAT-FR",
            code_insee: "FR",
            zone_id: "FRANCE",
          },
          {
            id: "IND-001",
            chantier_id: chantierId,
            maille: "DEPT",
            territoire_code: "DEPT-01",
            code_insee: "01",
            zone_id: "D01",
          },
        ],
      });

      await prisma.indicateur_territoire_jalon.createMany({
        data: [
          {
            id: "IND-001",
            territoire_code: "NAT-FR",
            code_insee: "FR",
            maille: "NAT",
            jalon: 2025,
            zone_id: "FRANCE",
            valeur_actuelle: 110,
            date_valeur_actuelle: new Date("2026-01-12"),
          },
        ],
      });

      await prisma.utilisateur.create({
        data: {
          email: "jane.doe@test.com",
          nom: "Doe",
          prenom: "Jane",
          id: "550e8400-e29b-41d4-a716-446655440001",
          date_creation: new Date().toISOString(),
          profil: {
            connect: {
              code: ProfilEnum.DITP_ADMIN,
            },
          },
        },
      });

      await prisma.indicateur_territoire_valeur_evenement.createMany({
        data: [
          {
            id: "550e8400-e29b-41d4-a716-446655440000",
            indic_id: "IND-001",
            territoire_code: "NAT-FR",
            type_valeur: "VALEUR_AVANCEMENT",
            donnees_complementaires: {},
            type_evenement: EvenementValeurEnum.VALEUR_CREEE,
            date_valeur: new Date("2026-01-12"),
            ordre: 1,
            date_modification: new Date("2026-01-12"),
            date_creation: new Date("2026-01-12"),
            id_auteur_modification: "550e8400-e29b-41d4-a716-446655440001",
            correlation_id: "550e8400-e29b-41d4-a716-446655440002",
            valeur: 100,
          },
          {
            id: "550e8400-e29b-41d4-a716-446655440001",
            indic_id: "IND-001",
            territoire_code: "NAT-FR",
            type_valeur: "VALEUR_AVANCEMENT",
            donnees_complementaires: {},
            type_evenement: EvenementValeurEnum.VALEUR_MODIFIEE,
            date_valeur: new Date("2026-01-12"),
            ordre: 2,
            date_modification: new Date("2026-01-12"),
            date_creation: new Date("2026-01-12"),
            id_auteur_modification: "550e8400-e29b-41d4-a716-446655440001",
            correlation_id: "550e8400-e29b-41d4-a716-446655440002",
            valeur: 110,
          },
          {
            id: "550e8400-e29b-41d4-a716-446655440002",
            indic_id: "IND-001",
            territoire_code: "NAT-FR",
            type_valeur: "VALEUR_AVANCEMENT",
            donnees_complementaires: {
              motif: "Motif de la proposition",
              source_donnee_methode_calcul:
                "Source de la donnée et méthode de calcul",
            },
            type_evenement: EvenementValeurEnum.PROPOSITION_VALEUR_CREEE,
            date_valeur: new Date("2026-01-12"),
            ordre: 3,
            date_modification: new Date("2026-01-12"),
            date_creation: new Date("2026-01-12"),
            id_auteur_modification: "550e8400-e29b-41d4-a716-446655440001",
            correlation_id: "550e8400-e29b-41d4-a716-446655440002",
            valeur: 120,
          },
          {
            id: "550e8400-e29b-41d4-a716-446655440003",
            indic_id: "IND-001",
            territoire_code: "NAT-FR",
            type_valeur: "VALEUR_AVANCEMENT",
            donnees_complementaires: {},
            type_evenement: EvenementValeurEnum.PROPOSITION_VALEUR_MODIFIEE,
            date_valeur: new Date("2026-01-12"),
            ordre: 4,
            date_modification: new Date("2026-01-12"),
            date_creation: new Date("2026-01-12"),
            id_auteur_modification: "550e8400-e29b-41d4-a716-446655440001",
            correlation_id: "550e8400-e29b-41d4-a716-446655440002",
            valeur: 140,
          },

          {
            id: "550e8400-e29b-41d4-a716-446655440004",
            indic_id: "IND-001",
            territoire_code: "NAT-FR",
            type_valeur: "VALEUR_AVANCEMENT",
            donnees_complementaires: {},
            type_evenement: EvenementValeurEnum.PROPOSITION_VALEUR_SUPPRIMEE,
            date_valeur: new Date("2026-01-12"),
            ordre: 5,
            date_modification: new Date("2026-01-12"),
            date_creation: new Date("2026-01-12"),
            id_auteur_modification: "550e8400-e29b-41d4-a716-446655440001",
            correlation_id: "550e8400-e29b-41d4-a716-446655440002",
            valeur: 140,
          },
          {
            id: "550e8400-e29b-41d4-a716-446655440005",
            indic_id: "IND-001",
            territoire_code: "NAT-FR",
            type_valeur: "VALEUR_AVANCEMENT",
            donnees_complementaires: {
              motif: "Motif de la proposition 2",
              source_donnee_methode_calcul:
                "Source de la donnée et méthode de calcul 2",
            },
            type_evenement: EvenementValeurEnum.PROPOSITION_VALEUR_CREEE,
            date_valeur: new Date("2026-01-12"),
            ordre: 6,
            date_modification: new Date("2026-01-12"),
            date_creation: new Date("2026-01-12"),
            id_auteur_modification: "550e8400-e29b-41d4-a716-446655440001",
            correlation_id: "550e8400-e29b-41d4-a716-446655440002",
            valeur: 150,
          },
        ],
      });

      // When
      const result =
        await prismaIndicateurRepository.recupererDetailsParChantierIdEtTerritoire(
          chantierId,
          territoireCodes,
          jalon,
          dateDerniereExecutionDatajobs,
        );

      // Then
      expect(result["IND-001"]["NAT-FR"].valeurAvancement).toEqual(110);
      expect(result["IND-001"]["NAT-FR"].dateValeurAvancement).toEqual(
        "2026-01-12T00:00:00.000Z",
      );
      expect(result["IND-001"]["NAT-FR"].proposition).toEqual({
        valeurAvancement: 150,
        tauxAvancement: null,
        tauxAvancementIntermediaire: null,
        statutTauxAvancement: "CALCULE",
        auteur: "Jane Doe",
        dateProposition: "2026-01-12T00:00:00.000Z",
        motif: "Motif de la proposition 2",
        sourceDonneeEtMethodeCalcul:
          "Source de la donnée et méthode de calcul 2",
      });
    });

    it.each([
      EvenementValeurEnum.PROPOSITION_VALEUR_REFUSEE,
      EvenementValeurEnum.PROPOSITION_VALEUR_ACCEPTEE,
      EvenementValeurEnum.PROPOSITION_VALEUR_ACCEPTEE_AVEC_MODIFICATION,
    ])(
      "lorsque le dernier évènement en date est de type %s, le propositionStatutTerritoire est null et le propositionStatutDirectionProjet est du même type avec la date de l'événement",
      async (evenement) => {
        // Given
        const chantierId = "CH-001";
        const territoireCodes = ["NAT-FR"];
        const jalon = 2025;

        await prisma.chantier_identite.createMany({
          data: [
            {
              id: chantierId,
              nom: "Chantier 001",
              ministeres: ["1009"],
              ministeres_acronymes: ["MINA"],
            },
          ],
        });

        await prisma.chantier_territoire.createMany({
          data: [
            {
              id: "CH-001",
              maille: "NAT",
              code_insee: "FR",
              territoire_code: "NAT-FR",
              zone_id: "FRANCE",
            },
          ],
        });

        await prisma.indicateur_identite.createMany({
          data: [
            {
              id: "IND-001",
              nom: "Indicateur 001",
              chantier_id: chantierId,
              type_id: "IMPACT",
            },
          ],
        });

        await prisma.indicateur_territoire.createMany({
          data: [
            {
              id: "IND-001",
              chantier_id: chantierId,
              maille: "NAT",
              territoire_code: "NAT-FR",
              code_insee: "FR",
              zone_id: "FRANCE",
              date_valeur_actuelle_mandat: new Date("2026-01-12"),
            },
          ],
        });

        await prisma.indicateur_territoire_jalon.createMany({
          data: [
            {
              id: "IND-001",
              territoire_code: "NAT-FR",
              code_insee: "FR",
              maille: "NAT",
              jalon: 2025,
              zone_id: "FRANCE",
              date_valeur_actuelle: new Date("2026-01-12"),
            },
          ],
        });

        await prisma.utilisateur.create({
          data: {
            email: "jane.doe@test.com",
            nom: "Doe",
            prenom: "Jane",
            id: "550e8400-e29b-41d4-a716-446655440001",
            date_creation: new Date().toISOString(),
            profil: {
              connect: {
                code: ProfilEnum.DITP_ADMIN,
              },
            },
          },
        });

        await prisma.indicateur_territoire_valeur_evenement.createMany({
          data: [
            {
              id: "550e8400-e29b-41d4-a716-446655440000",
              indic_id: "IND-001",
              territoire_code: "NAT-FR",
              type_valeur: "VALEUR_AVANCEMENT",
              donnees_complementaires: {},
              type_evenement: evenement,
              date_valeur: new Date("2026-01-12"),
              ordre: 2,
              date_modification: new Date("2026-01-12"),
              date_creation: new Date("2026-01-12"),
              id_auteur_modification: "550e8400-e29b-41d4-a716-446655440001",
              correlation_id: "550e8400-e29b-41d4-a716-446655440002",
              valeur: 100,
            },
            {
              id: "d2d4153c-8561-42d5-8310-cae96337fd0a",
              indic_id: "IND-001",
              territoire_code: "NAT-FR",
              type_valeur: "VALEUR_AVANCEMENT",
              donnees_complementaires: {},
              type_evenement: EvenementValeurEnum.PROPOSITION_VALEUR_CREEE,
              date_valeur: new Date("2026-01-12"),
              ordre: 1,
              date_modification: new Date("2026-01-12"),
              date_creation: new Date("2026-01-12"),
              id_auteur_modification: "550e8400-e29b-41d4-a716-446655440001",
              correlation_id: "550e8400-e29b-41d4-a716-446655440002",
              valeur: 100,
            },
          ],
        });

        // When
        const result =
          await prismaIndicateurRepository.recupererDetailsParChantierIdEtTerritoire(
            chantierId,
            territoireCodes,
            jalon,
            dateDerniereExecutionDatajobs,
          );

        // Then
        expect(
          result["IND-001"]["NAT-FR"].propositionStatutTerritoire,
        ).toBeNull();
        expect(
          result["IND-001"]["NAT-FR"].propositionStatutDirectionProjet,
        ).toEqual({
          statut: evenement,
          date: "2026-01-12",
          dateTime: "2026-01-12T00:00:00.000Z",
        });
      },
    );

    it("lorsque le dernier évènement en date est de type PROPOSITION_VALEUR_ACCUSEE_RECEPTION suivi de PROPOSITION_VALEUR_CREEE, le propositionStatutTerritoire est PROPOSITION_VALEUR_CREEE", async () => {
      // Given
      const chantierId = "CH-001";
      const territoireCodes = ["NAT-FR"];
      const jalon = 2025;

      await prisma.chantier_identite.createMany({
        data: [
          {
            id: chantierId,
            nom: "Chantier 001",
            ministeres: ["1009"],
            ministeres_acronymes: ["MINA"],
          },
        ],
      });

      await prisma.chantier_territoire.createMany({
        data: [
          {
            id: "CH-001",
            maille: "NAT",
            code_insee: "FR",
            territoire_code: "NAT-FR",
            zone_id: "FRANCE",
          },
        ],
      });

      await prisma.indicateur_identite.createMany({
        data: [
          {
            id: "IND-001",
            nom: "Indicateur 001",
            chantier_id: chantierId,
            type_id: "IMPACT",
          },
        ],
      });

      await prisma.indicateur_territoire.createMany({
        data: [
          {
            id: "IND-001",
            chantier_id: chantierId,
            maille: "NAT",
            territoire_code: "NAT-FR",
            code_insee: "FR",
            zone_id: "FRANCE",
            date_valeur_actuelle_mandat: new Date("2026-01-12"),
          },
        ],
      });

      await prisma.indicateur_territoire_jalon.createMany({
        data: [
          {
            id: "IND-001",
            territoire_code: "NAT-FR",
            code_insee: "FR",
            maille: "NAT",
            jalon: 2025,
            zone_id: "FRANCE",
            date_valeur_actuelle: new Date("2026-01-12"),
          },
        ],
      });

      await prisma.utilisateur.create({
        data: {
          email: "jane.doe2@test.com",
          nom: "Doe",
          prenom: "Jane",
          id: "550e8400-e29b-41d4-a716-446655440002",
          date_creation: new Date().toISOString(),
          profil: {
            connect: {
              code: ProfilEnum.DITP_ADMIN,
            },
          },
        },
      });

      await prisma.indicateur_territoire_valeur_evenement.createMany({
        data: [
          {
            id: "550e8400-e29b-41d4-a716-446655440100",
            indic_id: "IND-001",
            territoire_code: "NAT-FR",
            type_valeur: "VALEUR_AVANCEMENT",
            donnees_complementaires: {
              motif: "Un motif",
              source_donnee_methode_calcul: "Une source",
            },
            type_evenement: EvenementValeurEnum.PROPOSITION_VALEUR_CREEE,
            date_valeur: new Date("2026-01-12"),
            ordre: 1,
            date_modification: new Date("2026-01-12"),
            date_creation: new Date("2026-01-12"),
            id_auteur_modification: "550e8400-e29b-41d4-a716-446655440002",
            correlation_id: "550e8400-e29b-41d4-a716-446655440003",
            valeur: 100,
          },
          {
            id: "550e8400-e29b-41d4-a716-446655440101",
            indic_id: "IND-001",
            territoire_code: "NAT-FR",
            type_valeur: "VALEUR_AVANCEMENT",
            donnees_complementaires: {
              motif: "motif accusee reception",
            },
            type_evenement:
              EvenementValeurEnum.PROPOSITION_VALEUR_ACCUSEE_RECEPTION,
            date_valeur: new Date("2026-01-12"),
            ordre: 2,
            date_modification: new Date("2026-01-12"),
            date_creation: new Date("2026-01-12"),
            id_auteur_modification: "550e8400-e29b-41d4-a716-446655440002",
            correlation_id: "550e8400-e29b-41d4-a716-446655440003",
            valeur: 100,
          },
        ],
      });

      // When
      const result =
        await prismaIndicateurRepository.recupererDetailsParChantierIdEtTerritoire(
          chantierId,
          territoireCodes,
          jalon,
          dateDerniereExecutionDatajobs,
        );

      // Then
      expect(result["IND-001"]["NAT-FR"].propositionStatutTerritoire).toEqual({
        statut: "PROPOSITION_VALEUR_CREEE",
        date: "2026-01-12",
        dateTime: "2026-01-12T00:00:00.000Z",
      });
      expect(
        result["IND-001"]["NAT-FR"].propositionStatutDirectionProjet,
      ).toEqual({
        statut: "PROPOSITION_VALEUR_ACCUSEE_RECEPTION",
        date: "2026-01-12",
        dateTime: "2026-01-12T00:00:00.000Z",
      });

      expect(result["IND-001"]["NAT-FR"].proposition?.motif).toEqual(
        "Un motif",
      );
      expect(
        result["IND-001"]["NAT-FR"].proposition?.sourceDonneeEtMethodeCalcul,
      ).toEqual("Une source");
    });

    it("lorsque le dernier évènement en date est de type PROPOSITION_VALEUR_ACCUSEE_RECEPTION suivi de PROPOSITION_VALEUR_MODIFIEE, le propositionStatutTerritoire est PROPOSITION_VALEUR_MODIFIEE", async () => {
      // Given
      const chantierId = "CH-001";
      const territoireCodes = ["NAT-FR"];
      const jalon = 2025;

      await prisma.chantier_identite.createMany({
        data: [
          {
            id: chantierId,
            nom: "Chantier 001",
            ministeres: ["1009"],
            ministeres_acronymes: ["MINA"],
          },
        ],
      });

      await prisma.chantier_territoire.createMany({
        data: [
          {
            id: "CH-001",
            maille: "NAT",
            code_insee: "FR",
            territoire_code: "NAT-FR",
            zone_id: "FRANCE",
          },
        ],
      });

      await prisma.indicateur_identite.createMany({
        data: [
          {
            id: "IND-001",
            nom: "Indicateur 001",
            chantier_id: chantierId,
            type_id: "IMPACT",
          },
        ],
      });

      await prisma.indicateur_territoire.createMany({
        data: [
          {
            id: "IND-001",
            chantier_id: chantierId,
            maille: "NAT",
            territoire_code: "NAT-FR",
            code_insee: "FR",
            zone_id: "FRANCE",
            date_valeur_actuelle_mandat: new Date("2026-01-12"),
          },
        ],
      });

      await prisma.indicateur_territoire_jalon.createMany({
        data: [
          {
            id: "IND-001",
            territoire_code: "NAT-FR",
            code_insee: "FR",
            maille: "NAT",
            jalon: 2025,
            zone_id: "FRANCE",
            date_valeur_actuelle: new Date("2026-01-12"),
          },
        ],
      });

      await prisma.utilisateur.create({
        data: {
          email: "jane.doe3@test.com",
          nom: "Doe",
          prenom: "Jane",
          id: "550e8400-e29b-41d4-a716-446655440003",
          date_creation: new Date().toISOString(),
          profil: {
            connect: {
              code: ProfilEnum.DITP_ADMIN,
            },
          },
        },
      });

      await prisma.indicateur_territoire_valeur_evenement.createMany({
        data: [
          {
            id: "550e8400-e29b-41d4-a716-446655440200",
            indic_id: "IND-001",
            territoire_code: "NAT-FR",
            type_valeur: "VALEUR_AVANCEMENT",
            donnees_complementaires: {},
            type_evenement: EvenementValeurEnum.PROPOSITION_VALEUR_CREEE,
            date_valeur: new Date("2026-01-12"),
            ordre: 1,
            date_modification: new Date("2026-01-12"),
            date_creation: new Date("2026-01-12"),
            id_auteur_modification: "550e8400-e29b-41d4-a716-446655440003",
            correlation_id: "550e8400-e29b-41d4-a716-446655440004",
            valeur: 100,
          },
          {
            id: "4bbe27d7-34a5-4cb9-b3bb-f681abe5544b",
            indic_id: "IND-001",
            territoire_code: "NAT-FR",
            type_valeur: "VALEUR_AVANCEMENT",
            donnees_complementaires: {},
            type_evenement: EvenementValeurEnum.PROPOSITION_VALEUR_MODIFIEE,
            date_valeur: new Date("2026-01-12"),
            ordre: 2,
            date_modification: new Date("2026-01-12"),
            date_creation: new Date("2026-01-12"),
            id_auteur_modification: "550e8400-e29b-41d4-a716-446655440003",
            correlation_id: "550e8400-e29b-41d4-a716-446655440004",
            valeur: 100,
          },
          {
            id: "e617826b-0f39-4f64-a409-de83c65f2d2d",
            indic_id: "IND-001",
            territoire_code: "NAT-FR",
            type_valeur: "VALEUR_AVANCEMENT",
            donnees_complementaires: {},
            type_evenement:
              EvenementValeurEnum.PROPOSITION_VALEUR_ACCUSEE_RECEPTION,
            date_valeur: new Date("2026-01-12"),
            ordre: 3,
            date_modification: new Date("2026-01-12"),
            date_creation: new Date("2026-01-12"),
            id_auteur_modification: "550e8400-e29b-41d4-a716-446655440003",
            correlation_id: "550e8400-e29b-41d4-a716-446655440004",
            valeur: 100,
          },
        ],
      });

      // When
      const result =
        await prismaIndicateurRepository.recupererDetailsParChantierIdEtTerritoire(
          chantierId,
          territoireCodes,
          jalon,
          dateDerniereExecutionDatajobs,
        );

      // Then
      expect(result["IND-001"]["NAT-FR"].propositionStatutTerritoire).toEqual({
        statut: "PROPOSITION_VALEUR_MODIFIEE",
        date: "2026-01-12",
        dateTime: "2026-01-12T00:00:00.000Z",
      });
      expect(
        result["IND-001"]["NAT-FR"].propositionStatutDirectionProjet,
      ).toEqual({
        statut: "PROPOSITION_VALEUR_ACCUSEE_RECEPTION",
        date: "2026-01-12",
        dateTime: "2026-01-12T00:00:00.000Z",
      });
    });

    it("lorsque le dernier évènement en date est de type PROPOSITION_VALEUR_SUPPRIMEE, le propositionStatutTerritoire est PROPOSITION_VALEUR_SUPPRIMEE et le propositionStatutDirectionProjet est null", async () => {
      // Given
      const chantierId = "CH-001";
      const territoireCodes = ["NAT-FR"];
      const jalon = 2025;

      await prisma.chantier_identite.createMany({
        data: [
          {
            id: chantierId,
            nom: "Chantier 001",
            ministeres: ["1009"],
            ministeres_acronymes: ["MINA"],
          },
        ],
      });

      await prisma.chantier_territoire.createMany({
        data: [
          {
            id: "CH-001",
            maille: "NAT",
            code_insee: "FR",
            territoire_code: "NAT-FR",
            zone_id: "FRANCE",
          },
        ],
      });

      await prisma.indicateur_identite.createMany({
        data: [
          {
            id: "IND-001",
            nom: "Indicateur 001",
            chantier_id: chantierId,
            type_id: "IMPACT",
          },
        ],
      });

      await prisma.indicateur_territoire.createMany({
        data: [
          {
            id: "IND-001",
            chantier_id: chantierId,
            maille: "NAT",
            territoire_code: "NAT-FR",
            code_insee: "FR",
            zone_id: "FRANCE",
            date_valeur_actuelle_mandat: new Date("2026-01-12"),
          },
        ],
      });

      await prisma.indicateur_territoire_jalon.createMany({
        data: [
          {
            id: "IND-001",
            territoire_code: "NAT-FR",
            code_insee: "FR",
            maille: "NAT",
            jalon: 2025,
            zone_id: "FRANCE",
            date_valeur_actuelle: new Date("2026-01-12"),
          },
        ],
      });

      await prisma.utilisateur.create({
        data: {
          email: "jane.doe4@test.com",
          nom: "Doe",
          prenom: "Jane",
          id: "550e8400-e29b-41d4-a716-446655440004",
          date_creation: new Date().toISOString(),
          profil: {
            connect: {
              code: ProfilEnum.DITP_ADMIN,
            },
          },
        },
      });

      await prisma.indicateur_territoire_valeur_evenement.createMany({
        data: [
          {
            id: "550e8400-e29b-41d4-a716-446655440300",
            indic_id: "IND-001",
            territoire_code: "NAT-FR",
            type_valeur: "VALEUR_AVANCEMENT",
            donnees_complementaires: {},
            type_evenement: EvenementValeurEnum.PROPOSITION_VALEUR_CREEE,
            date_valeur: new Date("2026-01-12"),
            ordre: 1,
            date_modification: new Date("2026-01-12"),
            date_creation: new Date("2026-01-12"),
            id_auteur_modification: "550e8400-e29b-41d4-a716-446655440004",
            correlation_id: "550e8400-e29b-41d4-a716-446655440005",
            valeur: 100,
          },
          {
            id: "550e8400-e29b-41d4-a716-446655440301",
            indic_id: "IND-001",
            territoire_code: "NAT-FR",
            type_valeur: "VALEUR_AVANCEMENT",
            donnees_complementaires: {},
            type_evenement: EvenementValeurEnum.PROPOSITION_VALEUR_SUPPRIMEE,
            date_valeur: new Date("2026-01-12"),
            ordre: 2,
            date_modification: new Date("2026-01-12"),
            date_creation: new Date("2026-01-12"),
            id_auteur_modification: "550e8400-e29b-41d4-a716-446655440004",
            correlation_id: "550e8400-e29b-41d4-a716-446655440005",
            valeur: 100,
          },
        ],
      });

      // When
      const result =
        await prismaIndicateurRepository.recupererDetailsParChantierIdEtTerritoire(
          chantierId,
          territoireCodes,
          jalon,
          dateDerniereExecutionDatajobs,
        );

      // Then
      expect(result["IND-001"]["NAT-FR"].propositionStatutTerritoire).toEqual({
        statut: "PROPOSITION_VALEUR_SUPPRIMEE",
        date: "2026-01-12",
        dateTime: "2026-01-12T00:00:00.000Z",
      });
      expect(
        result["IND-001"]["NAT-FR"].propositionStatutDirectionProjet,
      ).toBeNull();
    });

    it("lorsque le dernier évènement en date est de type PROPOSITION_VALEUR_CREEE, le propositionStatutTerritoire est PROPOSITION_VALEUR_CREEE et le propositionStatutDirectionProjet est null", async () => {
      // Given
      const chantierId = "CH-001";
      const territoireCodes = ["NAT-FR"];
      const jalon = 2025;

      await prisma.chantier_identite.createMany({
        data: [
          {
            id: chantierId,
            nom: "Chantier 001",
            ministeres: ["1009"],
            ministeres_acronymes: ["MINA"],
          },
        ],
      });

      await prisma.chantier_territoire.createMany({
        data: [
          {
            id: "CH-001",
            maille: "NAT",
            code_insee: "FR",
            territoire_code: "NAT-FR",
            zone_id: "FRANCE",
          },
        ],
      });

      await prisma.indicateur_identite.createMany({
        data: [
          {
            id: "IND-001",
            nom: "Indicateur 001",
            chantier_id: chantierId,
            type_id: "IMPACT",
          },
        ],
      });

      await prisma.indicateur_territoire.createMany({
        data: [
          {
            id: "IND-001",
            chantier_id: chantierId,
            maille: "NAT",
            territoire_code: "NAT-FR",
            code_insee: "FR",
            zone_id: "FRANCE",
            date_valeur_actuelle_mandat: new Date("2026-01-12"),
          },
        ],
      });

      await prisma.indicateur_territoire_jalon.createMany({
        data: [
          {
            id: "IND-001",
            territoire_code: "NAT-FR",
            code_insee: "FR",
            maille: "NAT",
            jalon: 2025,
            zone_id: "FRANCE",
            date_valeur_actuelle: new Date("2026-01-12"),
          },
        ],
      });

      await prisma.utilisateur.create({
        data: {
          email: "jane.doe5@test.com",
          nom: "Doe",
          prenom: "Jane",
          id: "550e8400-e29b-41d4-a716-446655440005",
          date_creation: new Date().toISOString(),
          profil: {
            connect: {
              code: ProfilEnum.DITP_ADMIN,
            },
          },
        },
      });

      await prisma.indicateur_territoire_valeur_evenement.createMany({
        data: [
          {
            id: "550e8400-e29b-41d4-a716-446655440400",
            indic_id: "IND-001",
            territoire_code: "NAT-FR",
            type_valeur: "VALEUR_AVANCEMENT",
            donnees_complementaires: {},
            type_evenement: EvenementValeurEnum.PROPOSITION_VALEUR_CREEE,
            date_valeur: new Date("2026-01-12"),
            ordre: 1,
            date_modification: new Date("2026-01-12"),
            date_creation: new Date("2026-01-12"),
            id_auteur_modification: "550e8400-e29b-41d4-a716-446655440005",
            correlation_id: "550e8400-e29b-41d4-a716-446655440006",
            valeur: 100,
          },
        ],
      });

      // When
      const result =
        await prismaIndicateurRepository.recupererDetailsParChantierIdEtTerritoire(
          chantierId,
          territoireCodes,
          jalon,
          dateDerniereExecutionDatajobs,
        );

      // Then
      expect(result["IND-001"]["NAT-FR"].propositionStatutTerritoire).toEqual({
        statut: "PROPOSITION_VALEUR_CREEE",
        date: "2026-01-12",
        dateTime: "2026-01-12T00:00:00.000Z",
      });
      expect(
        result["IND-001"]["NAT-FR"].propositionStatutDirectionProjet,
      ).toBeNull();
    });

    it("lorsque le dernier évènement en date est de type PROPOSITION_VALEUR_MODIFIEE, le propositionStatutTerritoire est PROPOSITION_VALEUR_MODIFIEE et le propositionStatutDirectionProjet est null", async () => {
      // Given
      const chantierId = "CH-001";
      const territoireCodes = ["NAT-FR"];
      const jalon = 2025;

      await prisma.chantier_identite.createMany({
        data: [
          {
            id: chantierId,
            nom: "Chantier 001",
            ministeres: ["1009"],
            ministeres_acronymes: ["MINA"],
          },
        ],
      });

      await prisma.chantier_territoire.createMany({
        data: [
          {
            id: "CH-001",
            maille: "NAT",
            code_insee: "FR",
            territoire_code: "NAT-FR",
            zone_id: "FRANCE",
          },
        ],
      });

      await prisma.indicateur_identite.createMany({
        data: [
          {
            id: "IND-001",
            nom: "Indicateur 001",
            chantier_id: chantierId,
            type_id: "IMPACT",
          },
        ],
      });

      await prisma.indicateur_territoire.createMany({
        data: [
          {
            id: "IND-001",
            chantier_id: chantierId,
            maille: "NAT",
            territoire_code: "NAT-FR",
            code_insee: "FR",
            zone_id: "FRANCE",
            date_valeur_actuelle_mandat: new Date("2026-01-12"),
          },
        ],
      });

      await prisma.indicateur_territoire_jalon.createMany({
        data: [
          {
            id: "IND-001",
            territoire_code: "NAT-FR",
            code_insee: "FR",
            maille: "NAT",
            jalon: 2025,
            zone_id: "FRANCE",
            date_valeur_actuelle: new Date("2026-01-12"),
          },
        ],
      });

      await prisma.utilisateur.create({
        data: {
          email: "jane.doe6@test.com",
          nom: "Doe",
          prenom: "Jane",
          id: "550e8400-e29b-41d4-a716-446655440006",
          date_creation: new Date().toISOString(),
          profil: {
            connect: {
              code: ProfilEnum.DITP_ADMIN,
            },
          },
        },
      });

      await prisma.indicateur_territoire_valeur_evenement.createMany({
        data: [
          {
            id: "207aed34-158a-46b5-80d1-acebb72cd7e3",
            indic_id: "IND-001",
            territoire_code: "NAT-FR",
            type_valeur: "VALEUR_AVANCEMENT",
            donnees_complementaires: {},
            type_evenement: EvenementValeurEnum.PROPOSITION_VALEUR_MODIFIEE,
            date_valeur: new Date("2026-01-12"),
            ordre: 3,
            date_modification: new Date("2026-01-12"),
            date_creation: new Date("2026-01-12"),
            id_auteur_modification: "550e8400-e29b-41d4-a716-446655440006",
            correlation_id: "550e8400-e29b-41d4-a716-446655440007",
            valeur: 90,
          },
          {
            id: "550e8400-e29b-41d4-a716-446655440500",
            indic_id: "IND-001",
            territoire_code: "NAT-FR",
            type_valeur: "VALEUR_AVANCEMENT",
            donnees_complementaires: {},
            type_evenement: EvenementValeurEnum.PROPOSITION_VALEUR_MODIFIEE,
            date_valeur: new Date("2026-01-12"),
            ordre: 2,
            date_modification: new Date("2026-01-12"),
            date_creation: new Date("2026-01-12"),
            id_auteur_modification: "550e8400-e29b-41d4-a716-446655440006",
            correlation_id: "550e8400-e29b-41d4-a716-446655440007",
            valeur: 100,
          },
          {
            id: "3c9316d9-de73-439b-bf62-75fb280860b6",
            indic_id: "IND-001",
            territoire_code: "NAT-FR",
            type_valeur: "VALEUR_AVANCEMENT",
            donnees_complementaires: {},
            type_evenement: EvenementValeurEnum.PROPOSITION_VALEUR_CREEE,
            date_valeur: new Date("2026-01-12"),
            ordre: 1,
            date_modification: new Date("2026-01-12"),
            date_creation: new Date("2026-01-12"),
            id_auteur_modification: "550e8400-e29b-41d4-a716-446655440006",
            correlation_id: "550e8400-e29b-41d4-a716-446655440007",
            valeur: 10,
          },
        ],
      });

      // When
      const result =
        await prismaIndicateurRepository.recupererDetailsParChantierIdEtTerritoire(
          chantierId,
          territoireCodes,
          jalon,
          dateDerniereExecutionDatajobs,
        );

      // Then
      expect(result["IND-001"]["NAT-FR"].propositionStatutTerritoire).toEqual({
        statut: "PROPOSITION_VALEUR_MODIFIEE",
        date: "2026-01-12",
        dateTime: "2026-01-12T00:00:00.000Z",
      });
      expect(
        result["IND-001"]["NAT-FR"].propositionStatutDirectionProjet,
      ).toBeNull();
    });

    it("s'assure que les événements sur différentes dates ne s'impactent pas mutuellement", async () => {
      // Given
      const chantierId = "CH-001";
      const territoireCodes = ["NAT-FR"];
      const jalon = 2025;

      await prisma.chantier_identite.createMany({
        data: [
          {
            id: chantierId,
            nom: "Chantier 001",
            ministeres: ["1009"],
            ministeres_acronymes: ["MINA"],
          },
        ],
      });

      await prisma.chantier_territoire.createMany({
        data: [
          {
            id: "CH-001",
            maille: "NAT",
            code_insee: "FR",
            territoire_code: "NAT-FR",
            zone_id: "FRANCE",
          },
        ],
      });

      await prisma.indicateur_identite.createMany({
        data: [
          {
            id: "IND-001",
            nom: "Indicateur 001",
            chantier_id: chantierId,
            type_id: "IMPACT",
          },
        ],
      });

      await prisma.indicateur_territoire.createMany({
        data: [
          {
            id: "IND-001",
            chantier_id: chantierId,
            maille: "NAT",
            territoire_code: "NAT-FR",
            code_insee: "FR",
            zone_id: "FRANCE",
            date_valeur_actuelle_mandat: new Date("2026-01-15"),
          },
        ],
      });

      await prisma.indicateur_territoire_jalon.createMany({
        data: [
          {
            id: "IND-001",
            territoire_code: "NAT-FR",
            code_insee: "FR",
            maille: "NAT",
            jalon: 2025,
            zone_id: "FRANCE",
            date_valeur_actuelle: new Date("2026-01-15"),
          },
        ],
      });

      await prisma.utilisateur.create({
        data: {
          email: "jane.doe7@test.com",
          nom: "Doe",
          prenom: "Jane",
          id: "550e8400-e29b-41d4-a716-446655440007",
          date_creation: new Date().toISOString(),
          profil: {
            connect: {
              code: ProfilEnum.DITP_ADMIN,
            },
          },
        },
      });

      await prisma.indicateur_territoire_valeur_evenement.createMany({
        data: [
          // Événement sur une date antérieure - ne devrait pas impacter
          {
            id: "550e8400-e29b-41d4-a716-446655440600",
            indic_id: "IND-001",
            territoire_code: "NAT-FR",
            type_valeur: "VALEUR_AVANCEMENT",
            donnees_complementaires: {},
            type_evenement:
              EvenementValeurEnum.PROPOSITION_VALEUR_ACCUSEE_RECEPTION,
            date_valeur: new Date("2026-01-10"),
            ordre: 1,
            date_modification: new Date("2026-01-10"),
            date_creation: new Date("2026-01-10"),
            id_auteur_modification: "550e8400-e29b-41d4-a716-446655440007",
            correlation_id: "550e8400-e29b-41d4-a716-446655440008",
            valeur: 80,
          },
          // Événements sur la date la plus récente (date_valeur_actuelle)
          {
            id: "550e8400-e29b-41d4-a716-446655440601",
            indic_id: "IND-001",
            territoire_code: "NAT-FR",
            type_valeur: "VALEUR_AVANCEMENT",
            donnees_complementaires: {},
            type_evenement: EvenementValeurEnum.PROPOSITION_VALEUR_CREEE,
            date_valeur: new Date("2026-01-15"),
            ordre: 1,
            date_modification: new Date("2026-01-15"),
            date_creation: new Date("2026-01-15"),
            id_auteur_modification: "550e8400-e29b-41d4-a716-446655440007",
            correlation_id: "550e8400-e29b-41d4-a716-446655440008",
            valeur: 100,
          },
        ],
      });

      // When
      const result =
        await prismaIndicateurRepository.recupererDetailsParChantierIdEtTerritoire(
          chantierId,
          territoireCodes,
          jalon,
          dateDerniereExecutionDatajobs,
        );

      // Then
      // Seuls les événements de la date la plus récente (2026-01-15) sont pris en compte
      expect(result["IND-001"]["NAT-FR"].propositionStatutTerritoire).toEqual({
        statut: "PROPOSITION_VALEUR_CREEE",
        date: "2026-01-15",
        dateTime: "2026-01-15T00:00:00.000Z",
      });
      expect(
        result["IND-001"]["NAT-FR"].propositionStatutDirectionProjet,
      ).toBeNull();
    });

    it("calcule le statutTauxAvancement EN_COURS quand la date de création de la proposition est postérieure à la dernière exécution des datajobs", async () => {
      // Given
      const chantierId = "CH-001";
      const territoireCodes = ["NAT-FR"];
      const jalon = 2025;

      await prisma.chantier_identite.createMany({
        data: [
          {
            id: chantierId,
            nom: "Chantier 001",
            ministeres: ["1009"],
            ministeres_acronymes: ["MINA"],
          },
        ],
      });

      await prisma.chantier_territoire.createMany({
        data: [
          {
            id: "CH-001",
            maille: "NAT",
            code_insee: "FR",
            territoire_code: "NAT-FR",
            zone_id: "FRANCE",
          },
        ],
      });

      await prisma.indicateur_identite.createMany({
        data: [
          {
            id: "IND-001",
            nom: "Indicateur 001",
            chantier_id: chantierId,
            type_id: "IMPACT",
            unite_mesure: "kg",
            statut: "PUBLIE",
          },
        ],
      });

      await prisma.indicateur_territoire.createMany({
        data: [
          {
            id: "IND-001",
            chantier_id: chantierId,
            maille: "NAT",
            territoire_code: "NAT-FR",
            code_insee: "FR",
            zone_id: "FRANCE",
          },
        ],
      });

      await prisma.utilisateur.create({
        data: {
          email: "jane.doe@test.com",
          nom: "Doe",
          prenom: "Jane",
          id: "550e8400-e29b-41d4-a716-446655440001",
          date_creation: new Date().toISOString(),
          profil: {
            connect: {
              code: ProfilEnum.DITP_ADMIN,
            },
          },
        },
      });

      await prisma.indicateur_territoire_valeur_evenement.createMany({
        data: [
          {
            id: "550e8400-e29b-41d4-a716-446655440000",
            indic_id: "IND-001",
            territoire_code: "NAT-FR",
            type_valeur: "VALEUR_AVANCEMENT",
            donnees_complementaires: {},
            type_evenement: EvenementValeurEnum.PROPOSITION_VALEUR_CREEE,
            date_valeur: new Date("2026-01-12"),
            ordre: 1,
            date_modification: new Date("2026-02-13"),
            date_creation: new Date("2026-02-13"),
            id_auteur_modification: "550e8400-e29b-41d4-a716-446655440001",
            correlation_id: "550e8400-e29b-41d4-a716-446655440002",
            valeur: 100,
          },
        ],
      });

      // When
      const result =
        await prismaIndicateurRepository.recupererDetailsParChantierIdEtTerritoire(
          chantierId,
          territoireCodes,
          jalon,
          dateDerniereExecutionDatajobs,
        );

      // Then
      expect(
        result["IND-001"]["NAT-FR"].proposition?.statutTauxAvancement,
      ).toEqual("EN_COURS");
    });

    it("calcule le statutTauxAvancement CALCULE quand la date de création de la proposition est antérieure à la dernière exécution des datajobs", async () => {
      // Given
      const chantierId = "CH-001";
      const territoireCodes = ["NAT-FR"];
      const jalon = 2025;

      await prisma.chantier_identite.createMany({
        data: [
          {
            id: chantierId,
            nom: "Chantier 001",
            ministeres: ["1009"],
            ministeres_acronymes: ["MINA"],
          },
        ],
      });

      await prisma.chantier_territoire.createMany({
        data: [
          {
            id: "CH-001",
            maille: "NAT",
            code_insee: "FR",
            territoire_code: "NAT-FR",
            zone_id: "FRANCE",
          },
        ],
      });

      await prisma.indicateur_identite.createMany({
        data: [
          {
            id: "IND-001",
            nom: "Indicateur 001",
            chantier_id: chantierId,
            type_id: "IMPACT",
            unite_mesure: "kg",
            statut: "PUBLIE",
          },
        ],
      });

      await prisma.indicateur_territoire.createMany({
        data: [
          {
            id: "IND-001",
            chantier_id: chantierId,
            maille: "NAT",
            territoire_code: "NAT-FR",
            code_insee: "FR",
            zone_id: "FRANCE",
          },
        ],
      });

      await prisma.utilisateur.create({
        data: {
          email: "jane.doe@test.com",
          nom: "Doe",
          prenom: "Jane",
          id: "550e8400-e29b-41d4-a716-446655440001",
          date_creation: new Date().toISOString(),
          profil: {
            connect: {
              code: ProfilEnum.DITP_ADMIN,
            },
          },
        },
      });

      await prisma.indicateur_territoire_valeur_evenement.createMany({
        data: [
          {
            id: "550e8400-e29b-41d4-a716-446655440000",
            indic_id: "IND-001",
            territoire_code: "NAT-FR",
            type_valeur: "VALEUR_AVANCEMENT",
            donnees_complementaires: {},
            type_evenement: EvenementValeurEnum.PROPOSITION_VALEUR_CREEE,
            date_valeur: new Date("2026-01-12"),
            ordre: 1,
            date_modification: new Date("2026-01-12"),
            date_creation: new Date("2026-01-12"), // Antérieure à la dernière exécution des datajobs
            id_auteur_modification: "550e8400-e29b-41d4-a716-446655440001",
            correlation_id: "550e8400-e29b-41d4-a716-446655440002",
            valeur: 100,
          },
        ],
      });

      // When
      const result =
        await prismaIndicateurRepository.recupererDetailsParChantierIdEtTerritoire(
          chantierId,
          territoireCodes,
          jalon,
          dateDerniereExecutionDatajobs,
        );

      // Then
      expect(
        result["IND-001"]["NAT-FR"].proposition?.statutTauxAvancement,
      ).toEqual("CALCULE");
    });
  });

  describe("#récupérerDétailsTerritoirePourUnIndicateur", () => {
    it("sans proposition de valeur d'avancement, retourne les détails d'un indicateur sur tous les territoires territoire", async () => {
      // Given
      const chantiersIds = ["CH-001"];
      const indicateurId = "IND-001";
      const territoireCodes = ["DEPT-02", "DEPT-01"];
      const jalon = 2025;
      const habilitations: Habilitations = {
        gestionUtilisateur: {
          chantiers: chantiersIds,
          territoires: territoireCodes,
          périmètres: [],
        },
        lecture: {
          chantiers: chantiersIds,
          territoires: territoireCodes,
          périmètres: [],
        },
        saisieCommentaire: {
          chantiers: chantiersIds,
          territoires: territoireCodes,
          périmètres: [],
        },
        saisieIndicateur: {
          chantiers: chantiersIds,
          territoires: territoireCodes,
          périmètres: [],
        },
        responsabilite: {
          chantiers: chantiersIds,
          territoires: territoireCodes,
          périmètres: [],
        },
      };

      await prisma.chantier_identite.createMany({
        data: [
          {
            id: "CH-001",
            nom: "Chantier 001",
            ministeres: ["1009"],
            ministeres_acronymes: ["MINA"],
          },
        ],
      });

      await prisma.chantier_territoire.createMany({
        data: [
          {
            id: "CH-001",
            maille: "DEPT",
            code_insee: "02",
            territoire_code: "DEPT-02",
            zone_id: "FRANCE",
          },
          {
            id: "CH-001",
            maille: "DEPT",
            code_insee: "01",
            territoire_code: "DEPT-01",
            zone_id: "D01",
          },
        ],
      });

      await prisma.indicateur_identite.createMany({
        data: [
          {
            id: "IND-001",
            nom: "Indicateur 001",
            chantier_id: "CH-001",
            dernier_import_date_indic: new Date("2026-01-12"),
            type_id: "IMPACT",
            unite_mesure: "kg",
          },
        ],
      });

      await prisma.indicateur_territoire.createMany({
        data: [
          {
            id: "IND-001",
            chantier_id: "CH-001",
            maille: "DEPT",
            code_insee: "02",
            territoire_code: "DEPT-02",
            zone_id: "D02",
            evolution_valeur_actuelle: [
              {
                date: new Date("2026-01-12"),
                valeur: 100,
              },
              {
                date: new Date("2026-01-14"),
                valeur: 110,
              },
            ],
          },
          {
            id: "IND-001",
            chantier_id: "CH-001",
            maille: "DEPT",
            territoire_code: "DEPT-01",
            code_insee: "01",
            zone_id: "D01",
            valeur_actuelle_mandat: 10,
            date_valeur_actuelle_mandat: new Date("2025-05-06"),
          },
        ],
      });

      await prisma.indicateur_territoire_jalon.createMany({
        data: [
          {
            id: "IND-001",
            maille: "DEPT",
            code_insee: "02",
            territoire_code: "DEPT-02",
            jalon: 2025,
            zone_id: "D02",
            valeur_actuelle: 110,
            date_valeur_actuelle: new Date("2026-01-12"),
          },
        ],
      });

      await prisma.utilisateur.create({
        data: {
          email: "jane.doe@test.com",
          nom: "Jane",
          prenom: "Doe",
          id: "550e8400-e29b-41d4-a716-446655440001",
          date_creation: new Date().toISOString(),
          profil: {
            connect: {
              code: ProfilEnum.DITP_ADMIN,
            },
          },
        },
      });

      // When
      const result =
        await prismaIndicateurRepository.récupérerDétailsTerritoirePourUnIndicateur(
          indicateurId,
          habilitations,
          ProfilEnum.SERVICES_DECONCENTRES_DEPARTEMENT,
          jalon,
          dateDerniereExecutionDatajobs,
        );

      // Then
      expect(result["DEPT-02"].valeurAvancement).toEqual(110);
      expect(result["DEPT-02"].dateValeurAvancement).toEqual(
        new Date("2026-01-12").toLocaleString(),
      );
      expect(result["DEPT-02"].proposition).toBeNull();
      expect(result["DEPT-02"].historiquesValeurs).toEqual([
        {
          date: "2026-01-12T00:00:00.000Z",
          valeur: 100,
        },
        {
          date: "2026-01-14T00:00:00.000Z",
          valeur: 110,
        },
      ]);

      expect(result["DEPT-01"].valeurAvancementMandat).toEqual(10);
      expect(result["DEPT-01"].dateValeurAvancementMandat).toEqual(
        new Date("2025-05-06").toLocaleString(),
      );
      expect(result["DEPT-01"].proposition).toBeNull();
      expect(result["DEPT-01"].historiquesValeurs).toEqual([]);
    });

    it("Quand il existe une proposition de valeur d'avancement [CREEE], retourne les détails des indicateurs pour un chantier, territoire et proposition", async () => {
      // Given
      const chantiersIds = ["CH-001"];
      const indicateurId = "IND-001";
      const territoireCodes = ["DEPT-02", "DEPT-01"];
      const jalon = 2025;
      const habilitations: Habilitations = {
        gestionUtilisateur: {
          chantiers: chantiersIds,
          territoires: territoireCodes,
          périmètres: [],
        },
        lecture: {
          chantiers: chantiersIds,
          territoires: territoireCodes,
          périmètres: [],
        },
        saisieCommentaire: {
          chantiers: chantiersIds,
          territoires: territoireCodes,
          périmètres: [],
        },
        saisieIndicateur: {
          chantiers: chantiersIds,
          territoires: territoireCodes,
          périmètres: [],
        },
        responsabilite: {
          chantiers: chantiersIds,
          territoires: territoireCodes,
          périmètres: [],
        },
      };

      await prisma.chantier_identite.createMany({
        data: [
          {
            id: "CH-001",
            nom: "Chantier 001",
            ministeres: ["1009"],
            ministeres_acronymes: ["MINA"],
          },
        ],
      });

      await prisma.chantier_territoire.createMany({
        data: [
          {
            id: "CH-001",
            maille: "DEPT",
            code_insee: "02",
            territoire_code: "DEPT-02",
            zone_id: "FRANCE",
          },
          {
            id: "CH-001",
            maille: "DEPT",
            code_insee: "01",
            territoire_code: "DEPT-01",
            zone_id: "D01",
          },
        ],
      });

      await prisma.indicateur_identite.createMany({
        data: [
          {
            id: "IND-001",
            nom: "Indicateur 001",
            chantier_id: "CH-001",
            dernier_import_date_indic: new Date("2026-01-12"),
            type_id: "IMPACT",
            unite_mesure: "kg",
          },
        ],
      });

      await prisma.indicateur_territoire.createMany({
        data: [
          {
            id: "IND-001",
            chantier_id: "CH-001",
            maille: "DEPT",
            code_insee: "02",
            territoire_code: "DEPT-02",
            zone_id: "D02",
            evolution_valeur_actuelle: [
              {
                date: new Date("2026-01-12"),
                valeur: 100,
              },
              {
                date: new Date("2026-01-14"),
                valeur: 110,
              },
            ],
          },
          {
            id: "IND-001",
            chantier_id: "CH-001",
            maille: "DEPT",
            territoire_code: "DEPT-01",
            code_insee: "01",
            zone_id: "D01",
            valeur_actuelle_mandat: 10,
            date_valeur_actuelle_mandat: new Date("2025-05-06"),
          },
        ],
      });

      await prisma.indicateur_territoire_jalon.createMany({
        data: [
          {
            id: "IND-001",
            maille: "DEPT",
            code_insee: "02",
            territoire_code: "DEPT-02",
            jalon: 2025,
            zone_id: "D02",
            valeur_actuelle: 110,
            date_valeur_actuelle: new Date("2026-01-12"),
          },
        ],
      });

      await prisma.utilisateur.create({
        data: {
          email: "jane.doe@test.com",
          nom: "Doe",
          prenom: "Jane",
          id: "550e8400-e29b-41d4-a716-446655440001",
          date_creation: new Date().toISOString(),
          profil: {
            connect: {
              code: ProfilEnum.DITP_ADMIN,
            },
          },
        },
      });

      await prisma.indicateur_territoire_valeur_evenement.createMany({
        data: [
          {
            id: "550e8400-e29b-41d4-a716-446655440000",
            indic_id: "IND-001",
            territoire_code: "DEPT-02",
            type_valeur: "VALEUR_AVANCEMENT",
            donnees_complementaires: {},
            type_evenement: EvenementValeurEnum.VALEUR_CREEE,
            date_valeur: new Date("2026-01-12"),
            ordre: 1,
            date_modification: new Date("2026-01-12"),
            date_creation: new Date("2026-01-12"),
            id_auteur_modification: "550e8400-e29b-41d4-a716-446655440001",
            correlation_id: "550e8400-e29b-41d4-a716-446655440002",
            valeur: 100,
          },
          {
            id: "550e8400-e29b-41d4-a716-446655440001",
            indic_id: "IND-001",
            territoire_code: "DEPT-02",
            type_valeur: "VALEUR_AVANCEMENT",
            donnees_complementaires: {},
            type_evenement: EvenementValeurEnum.VALEUR_MODIFIEE,
            date_valeur: new Date("2026-01-12"),
            ordre: 2,
            date_modification: new Date("2026-01-12"),
            date_creation: new Date("2026-01-12"),
            id_auteur_modification: "550e8400-e29b-41d4-a716-446655440001",
            correlation_id: "550e8400-e29b-41d4-a716-446655440002",
            valeur: 110,
          },
          {
            id: "550e8400-e29b-41d4-a716-446655440002",
            indic_id: "IND-001",
            territoire_code: "DEPT-02",
            type_valeur: "VALEUR_AVANCEMENT",
            donnees_complementaires: {
              motif: "Motif de la proposition",
              source_donnee_methode_calcul:
                "Source de la donnée et méthode de calcul",
            },
            type_evenement: EvenementValeurEnum.PROPOSITION_VALEUR_CREEE,
            date_valeur: new Date("2026-01-12"),
            ordre: 3,
            date_modification: new Date("2026-01-12"),
            date_creation: new Date("2026-01-12"),
            id_auteur_modification: "550e8400-e29b-41d4-a716-446655440001",
            correlation_id: "550e8400-e29b-41d4-a716-446655440002",
            valeur: 120,
          },
        ],
      });

      // When
      const result =
        await prismaIndicateurRepository.récupérerDétailsTerritoirePourUnIndicateur(
          indicateurId,
          habilitations,
          ProfilEnum.SERVICES_DECONCENTRES_DEPARTEMENT,
          jalon,
          dateDerniereExecutionDatajobs,
        );

      // Then
      expect(result["DEPT-02"].valeurAvancement).toEqual(110);
      expect(result["DEPT-02"].dateValeurAvancement).toEqual(
        new Date("2026-01-12").toLocaleString(),
      );
      expect(result["DEPT-02"].proposition).toEqual({
        valeurAvancement: 120,
        tauxAvancement: null,
        tauxAvancementIntermediaire: null,
        statutTauxAvancement: "CALCULE",
        auteur: "Jane Doe",
        dateProposition: "2026-01-12T00:00:00.000Z",
        motif: "Motif de la proposition",
        sourceDonneeEtMethodeCalcul: "Source de la donnée et méthode de calcul",
      });
    });

    it("Quand il existe une proposition de valeur d'avancement [CREEE, MODIFIEE], retourne les détails des indicateurs pour un chantier, territoire et dernière proposition", async () => {
      // Given
      const chantiersIds = ["CH-001"];
      const indicateurId = "IND-001";
      const territoireCodes = ["DEPT-02", "DEPT-01"];
      const jalon = 2025;
      const habilitations: Habilitations = {
        gestionUtilisateur: {
          chantiers: chantiersIds,
          territoires: territoireCodes,
          périmètres: [],
        },
        lecture: {
          chantiers: chantiersIds,
          territoires: territoireCodes,
          périmètres: [],
        },
        saisieCommentaire: {
          chantiers: chantiersIds,
          territoires: territoireCodes,
          périmètres: [],
        },
        saisieIndicateur: {
          chantiers: chantiersIds,
          territoires: territoireCodes,
          périmètres: [],
        },
        responsabilite: {
          chantiers: chantiersIds,
          territoires: territoireCodes,
          périmètres: [],
        },
      };

      await prisma.chantier_identite.createMany({
        data: [
          {
            id: "CH-001",
            nom: "Chantier 001",
            ministeres: ["1009"],
            ministeres_acronymes: ["MINA"],
          },
        ],
      });

      await prisma.chantier_territoire.createMany({
        data: [
          {
            id: "CH-001",
            maille: "DEPT",
            code_insee: "02",
            territoire_code: "DEPT-02",
            zone_id: "FRANCE",
          },
          {
            id: "CH-001",
            maille: "DEPT",
            code_insee: "01",
            territoire_code: "DEPT-01",
            zone_id: "D01",
          },
        ],
      });

      await prisma.indicateur_identite.createMany({
        data: [
          {
            id: "IND-001",
            nom: "Indicateur 001",
            chantier_id: "CH-001",
            dernier_import_date_indic: new Date("2026-01-12"),
            type_id: "IMPACT",
            unite_mesure: "kg",
          },
        ],
      });

      await prisma.indicateur_territoire.createMany({
        data: [
          {
            id: "IND-001",
            chantier_id: "CH-001",
            maille: "DEPT",
            code_insee: "02",
            territoire_code: "DEPT-02",
            zone_id: "D02",
            evolution_valeur_actuelle: [
              {
                date: new Date("2026-01-12"),
                valeur: 100,
              },
              {
                date: new Date("2026-01-14"),
                valeur: 110,
              },
            ],
          },
          {
            id: "IND-001",
            chantier_id: "CH-001",
            maille: "DEPT",
            territoire_code: "DEPT-01",
            code_insee: "01",
            zone_id: "D01",
            valeur_actuelle_mandat: 10,
            date_valeur_actuelle_mandat: new Date("2025-05-06"),
          },
        ],
      });

      await prisma.indicateur_territoire_jalon.createMany({
        data: [
          {
            id: "IND-001",
            maille: "DEPT",
            code_insee: "02",
            territoire_code: "DEPT-02",
            jalon: 2025,
            zone_id: "D02",
            valeur_actuelle: 110,
            date_valeur_actuelle: new Date("2026-01-12"),
          },
        ],
      });

      await prisma.utilisateur.create({
        data: {
          email: "jane.doe@test.com",
          nom: "Doe",
          prenom: "Jane",
          id: "550e8400-e29b-41d4-a716-446655440001",
          date_creation: new Date().toISOString(),
          profil: {
            connect: {
              code: ProfilEnum.DITP_ADMIN,
            },
          },
        },
      });

      await prisma.indicateur_territoire_valeur_evenement.createMany({
        data: [
          {
            id: "550e8400-e29b-41d4-a716-446655440000",
            indic_id: "IND-001",
            territoire_code: "DEPT-02",
            type_valeur: "VALEUR_AVANCEMENT",
            donnees_complementaires: {},
            type_evenement: EvenementValeurEnum.VALEUR_CREEE,
            date_valeur: new Date("2026-01-12"),
            ordre: 1,
            date_modification: new Date("2026-01-12"),
            date_creation: new Date("2026-01-12"),
            id_auteur_modification: "550e8400-e29b-41d4-a716-446655440001",
            correlation_id: "550e8400-e29b-41d4-a716-446655440002",
            valeur: 100,
          },
          {
            id: "550e8400-e29b-41d4-a716-446655440001",
            indic_id: "IND-001",
            territoire_code: "DEPT-02",
            type_valeur: "VALEUR_AVANCEMENT",
            donnees_complementaires: {},
            type_evenement: EvenementValeurEnum.VALEUR_MODIFIEE,
            date_valeur: new Date("2026-01-12"),
            ordre: 2,
            date_modification: new Date("2026-01-12"),
            date_creation: new Date("2026-01-12"),
            id_auteur_modification: "550e8400-e29b-41d4-a716-446655440001",
            correlation_id: "550e8400-e29b-41d4-a716-446655440002",
            valeur: 110,
          },
          {
            id: "550e8400-e29b-41d4-a716-446655440002",
            indic_id: "IND-001",
            territoire_code: "DEPT-02",
            type_valeur: "VALEUR_AVANCEMENT",
            donnees_complementaires: {
              motif: "Motif de la proposition",
              sourceDonneeEtMethodeCalcul:
                "Source de la donnée et méthode de calcul",
            },
            type_evenement: EvenementValeurEnum.PROPOSITION_VALEUR_CREEE,
            date_valeur: new Date("2026-01-12"),
            ordre: 3,
            date_modification: new Date("2026-01-12"),
            date_creation: new Date("2026-01-12"),
            id_auteur_modification: "550e8400-e29b-41d4-a716-446655440001",
            correlation_id: "550e8400-e29b-41d4-a716-446655440002",
            valeur: 120,
          },
          {
            id: "550e8400-e29b-41d4-a716-446655440003",
            indic_id: "IND-001",
            territoire_code: "DEPT-02",
            type_valeur: "VALEUR_AVANCEMENT",
            donnees_complementaires: {},
            type_evenement: EvenementValeurEnum.PROPOSITION_VALEUR_MODIFIEE,
            date_valeur: new Date("2026-01-12"),
            ordre: 4,
            date_modification: new Date("2026-01-12"),
            date_creation: new Date("2026-01-12"),
            id_auteur_modification: "550e8400-e29b-41d4-a716-446655440001",
            correlation_id: "550e8400-e29b-41d4-a716-446655440002",
            valeur: 140,
          },
        ],
      });

      // When
      const result =
        await prismaIndicateurRepository.récupérerDétailsTerritoirePourUnIndicateur(
          indicateurId,
          habilitations,
          ProfilEnum.SERVICES_DECONCENTRES_DEPARTEMENT,
          jalon,
          dateDerniereExecutionDatajobs,
        );

      // Then
      expect(result["DEPT-02"].valeurAvancement).toEqual(110);
      expect(result["DEPT-02"].dateValeurAvancement).toEqual(
        new Date("2026-01-12").toLocaleString(),
      );
      expect(result["DEPT-02"].proposition).toEqual({
        valeurAvancement: 140,
        tauxAvancement: null,
        tauxAvancementIntermediaire: null,
        statutTauxAvancement: "CALCULE",
        auteur: "Jane Doe",
        dateProposition: "2026-01-12T00:00:00.000Z",
        motif: null,
        sourceDonneeEtMethodeCalcul: null,
      });
    });

    it.each([
      [EvenementValeurEnum.PROPOSITION_VALEUR_SUPPRIMEE],
      [EvenementValeurEnum.PROPOSITION_VALEUR_REFUSEE],
      [EvenementValeurEnum.PROPOSITION_VALEUR_IGNOREE_VALEUR_MODIFIEE],
      [EvenementValeurEnum.PROPOSITION_VALEUR_IGNOREE_VALEUR_HISTORISEE],
    ])(
      "Quand il existe une proposition de valeur d'avancement [CREEE, MODIFIEE, %s], retourne les détails des indicateurs pour un chantier, territoire et aucune proposition",
      async (evenement) => {
        // Given
        const chantiersIds = ["CH-001"];
        const indicateurId = "IND-001";
        const territoireCodes = ["DEPT-02", "DEPT-01"];
        const jalon = 2025;
        const habilitations: Habilitations = {
          gestionUtilisateur: {
            chantiers: chantiersIds,
            territoires: territoireCodes,
            périmètres: [],
          },
          lecture: {
            chantiers: chantiersIds,
            territoires: territoireCodes,
            périmètres: [],
          },
          saisieCommentaire: {
            chantiers: chantiersIds,
            territoires: territoireCodes,
            périmètres: [],
          },
          saisieIndicateur: {
            chantiers: chantiersIds,
            territoires: territoireCodes,
            périmètres: [],
          },
          responsabilite: {
            chantiers: chantiersIds,
            territoires: territoireCodes,
            périmètres: [],
          },
        };

        await prisma.chantier_identite.createMany({
          data: [
            {
              id: "CH-001",
              nom: "Chantier 001",
              ministeres: ["1009"],
              ministeres_acronymes: ["MINA"],
            },
          ],
        });

        await prisma.chantier_territoire.createMany({
          data: [
            {
              id: "CH-001",
              maille: "DEPT",
              code_insee: "02",
              territoire_code: "DEPT-02",
              zone_id: "FRANCE",
            },
            {
              id: "CH-001",
              maille: "DEPT",
              code_insee: "01",
              territoire_code: "DEPT-01",
              zone_id: "D01",
            },
          ],
        });

        await prisma.indicateur_identite.createMany({
          data: [
            {
              id: "IND-001",
              nom: "Indicateur 001",
              chantier_id: "CH-001",
              dernier_import_date_indic: new Date("2026-01-12"),
              type_id: "IMPACT",
              unite_mesure: "kg",
            },
          ],
        });

        await prisma.indicateur_territoire.createMany({
          data: [
            {
              id: "IND-001",
              chantier_id: "CH-001",
              maille: "DEPT",
              code_insee: "02",
              territoire_code: "DEPT-02",
              zone_id: "D02",
              evolution_valeur_actuelle: [
                {
                  date: new Date("2026-01-12"),
                  valeur: 100,
                },
                {
                  date: new Date("2026-01-14"),
                  valeur: 110,
                },
              ],
            },
            {
              id: "IND-001",
              chantier_id: "CH-001",
              maille: "DEPT",
              territoire_code: "DEPT-01",
              code_insee: "01",
              zone_id: "D01",
              valeur_actuelle_mandat: 10,
              date_valeur_actuelle_mandat: new Date("2025-05-06"),
            },
          ],
        });

        await prisma.indicateur_territoire_jalon.createMany({
          data: [
            {
              id: "IND-001",
              maille: "DEPT",
              code_insee: "02",
              territoire_code: "DEPT-02",
              jalon: 2025,
              zone_id: "D02",
              valeur_actuelle: 110,
              date_valeur_actuelle: new Date("2026-01-12"),
            },
          ],
        });

        await prisma.utilisateur.create({
          data: {
            email: "jane.doe@test.com",
            nom: "Doe",
            prenom: "Jane",
            id: "550e8400-e29b-41d4-a716-446655440001",
            date_creation: new Date().toISOString(),
            profil: {
              connect: {
                code: ProfilEnum.DITP_ADMIN,
              },
            },
          },
        });

        await prisma.indicateur_territoire_valeur_evenement.createMany({
          data: [
            {
              id: "550e8400-e29b-41d4-a716-446655440000",
              indic_id: "IND-001",
              territoire_code: "DEPT-02",
              type_valeur: "VALEUR_AVANCEMENT",
              donnees_complementaires: {},
              type_evenement: EvenementValeurEnum.VALEUR_CREEE,
              date_valeur: new Date("2026-01-12"),
              ordre: 1,
              date_modification: new Date("2026-01-12"),
              date_creation: new Date("2026-01-12"),
              id_auteur_modification: "550e8400-e29b-41d4-a716-446655440001",
              correlation_id: "550e8400-e29b-41d4-a716-446655440002",
              valeur: 100,
            },
            {
              id: "550e8400-e29b-41d4-a716-446655440001",
              indic_id: "IND-001",
              territoire_code: "DEPT-02",
              type_valeur: "VALEUR_AVANCEMENT",
              donnees_complementaires: {},
              type_evenement: EvenementValeurEnum.VALEUR_MODIFIEE,
              date_valeur: new Date("2026-01-12"),
              ordre: 2,
              date_modification: new Date("2026-01-12"),
              date_creation: new Date("2026-01-12"),
              id_auteur_modification: "550e8400-e29b-41d4-a716-446655440001",
              correlation_id: "550e8400-e29b-41d4-a716-446655440002",
              valeur: 110,
            },
            {
              id: "550e8400-e29b-41d4-a716-446655440002",
              indic_id: "IND-001",
              territoire_code: "DEPT-02",
              type_valeur: "VALEUR_AVANCEMENT",
              donnees_complementaires: {},
              type_evenement: EvenementValeurEnum.PROPOSITION_VALEUR_CREEE,
              date_valeur: new Date("2026-01-12"),
              ordre: 3,
              date_modification: new Date("2026-01-12"),
              date_creation: new Date("2026-01-12"),
              id_auteur_modification: "550e8400-e29b-41d4-a716-446655440001",
              correlation_id: "550e8400-e29b-41d4-a716-446655440002",
              valeur: 120,
            },
            {
              id: "550e8400-e29b-41d4-a716-446655440003",
              indic_id: "IND-001",
              territoire_code: "DEPT-02",
              type_valeur: "VALEUR_AVANCEMENT",
              donnees_complementaires: {},
              type_evenement: EvenementValeurEnum.PROPOSITION_VALEUR_MODIFIEE,
              date_valeur: new Date("2026-01-12"),
              ordre: 4,
              date_modification: new Date("2026-01-12"),
              date_creation: new Date("2026-01-14"),
              id_auteur_modification: "550e8400-e29b-41d4-a716-446655440001",
              correlation_id: "550e8400-e29b-41d4-a716-446655440002",
              valeur: 140,
            },

            {
              id: "550e8400-e29b-41d4-a716-446655440004",
              indic_id: "IND-001",
              territoire_code: "DEPT-02",
              type_valeur: "VALEUR_AVANCEMENT",
              donnees_complementaires: {},
              type_evenement: evenement,
              date_valeur: new Date("2026-01-12"),
              ordre: 5,
              date_modification: new Date("2026-01-12"),
              date_creation: new Date("2026-01-14"),
              id_auteur_modification: "550e8400-e29b-41d4-a716-446655440001",
              correlation_id: "550e8400-e29b-41d4-a716-446655440002",
              valeur: 140,
            },
          ],
        });

        // When
        const result =
          await prismaIndicateurRepository.récupérerDétailsTerritoirePourUnIndicateur(
            indicateurId,
            habilitations,
            ProfilEnum.SERVICES_DECONCENTRES_DEPARTEMENT,
            jalon,
            dateDerniereExecutionDatajobs,
          );

        // Then
        expect(result["DEPT-02"].valeurAvancement).toEqual(110);
        expect(result["DEPT-02"].dateValeurAvancement).toEqual(
          new Date("2026-01-12").toLocaleString(),
        );
        expect(result["DEPT-02"].proposition).toBeNull();
      },
    );

    it.each([
      [EvenementValeurEnum.PROPOSITION_VALEUR_ACCEPTEE],
      [EvenementValeurEnum.PROPOSITION_VALEUR_ACCEPTEE_AVEC_MODIFICATION],
    ])(
      "Quand il existe une proposition de valeur d'avancement [CREEE, MODIFIEE, %s], retourne les détails des indicateurs pour un chantier, territoire et la proposition",
      async (evenement) => {
        // Given
        const chantiersIds = ["CH-001"];
        const indicateurId = "IND-001";
        const territoireCodes = ["DEPT-02", "DEPT-01"];
        const jalon = 2025;
        const habilitations: Habilitations = {
          gestionUtilisateur: {
            chantiers: chantiersIds,
            territoires: territoireCodes,
            périmètres: [],
          },
          lecture: {
            chantiers: chantiersIds,
            territoires: territoireCodes,
            périmètres: [],
          },
          saisieCommentaire: {
            chantiers: chantiersIds,
            territoires: territoireCodes,
            périmètres: [],
          },
          saisieIndicateur: {
            chantiers: chantiersIds,
            territoires: territoireCodes,
            périmètres: [],
          },
          responsabilite: {
            chantiers: chantiersIds,
            territoires: territoireCodes,
            périmètres: [],
          },
        };

        await prisma.chantier_identite.createMany({
          data: [
            {
              id: "CH-001",
              nom: "Chantier 001",
              ministeres: ["1009"],
              ministeres_acronymes: ["MINA"],
            },
          ],
        });

        await prisma.chantier_territoire.createMany({
          data: [
            {
              id: "CH-001",
              maille: "DEPT",
              code_insee: "02",
              territoire_code: "DEPT-02",
              zone_id: "FRANCE",
            },
            {
              id: "CH-001",
              maille: "DEPT",
              code_insee: "01",
              territoire_code: "DEPT-01",
              zone_id: "D01",
            },
          ],
        });

        await prisma.indicateur_identite.createMany({
          data: [
            {
              id: "IND-001",
              nom: "Indicateur 001",
              chantier_id: "CH-001",
              dernier_import_date_indic: new Date("2026-01-12"),
              type_id: "IMPACT",
              unite_mesure: "kg",
            },
          ],
        });

        await prisma.indicateur_territoire.createMany({
          data: [
            {
              id: "IND-001",
              chantier_id: "CH-001",
              maille: "DEPT",
              code_insee: "02",
              territoire_code: "DEPT-02",
              zone_id: "D02",
              evolution_valeur_actuelle: [
                {
                  date: new Date("2026-01-12"),
                  valeur: 100,
                },
                {
                  date: new Date("2026-01-14"),
                  valeur: 110,
                },
              ],
            },
            {
              id: "IND-001",
              chantier_id: "CH-001",
              maille: "DEPT",
              territoire_code: "DEPT-01",
              code_insee: "01",
              zone_id: "D01",
              valeur_actuelle_mandat: 10,
              date_valeur_actuelle_mandat: new Date("2025-05-06"),
            },
          ],
        });

        await prisma.indicateur_territoire_jalon.createMany({
          data: [
            {
              id: "IND-001",
              maille: "DEPT",
              code_insee: "02",
              territoire_code: "DEPT-02",
              jalon: 2025,
              zone_id: "D02",
              valeur_actuelle: 110,
              date_valeur_actuelle: new Date("2026-01-12"),
            },
          ],
        });

        await prisma.utilisateur.create({
          data: {
            email: "jane.doe@test.com",
            nom: "Doe",
            prenom: "Jane",
            id: "550e8400-e29b-41d4-a716-446655440001",
            date_creation: new Date().toISOString(),
            profil: {
              connect: {
                code: ProfilEnum.DITP_ADMIN,
              },
            },
          },
        });

        await prisma.indicateur_territoire_valeur_evenement.createMany({
          data: [
            {
              id: "550e8400-e29b-41d4-a716-446655440000",
              indic_id: "IND-001",
              territoire_code: "DEPT-02",
              type_valeur: "VALEUR_AVANCEMENT",
              donnees_complementaires: {},
              type_evenement: EvenementValeurEnum.VALEUR_CREEE,
              date_valeur: new Date("2026-01-12"),
              ordre: 1,
              date_modification: new Date("2026-01-12"),
              date_creation: new Date("2026-01-12"),
              id_auteur_modification: "550e8400-e29b-41d4-a716-446655440001",
              correlation_id: "550e8400-e29b-41d4-a716-446655440002",
              valeur: 100,
            },
            {
              id: "550e8400-e29b-41d4-a716-446655440001",
              indic_id: "IND-001",
              territoire_code: "DEPT-02",
              type_valeur: "VALEUR_AVANCEMENT",
              donnees_complementaires: {},
              type_evenement: EvenementValeurEnum.VALEUR_MODIFIEE,
              date_valeur: new Date("2026-01-12"),
              ordre: 2,
              date_modification: new Date("2026-01-12"),
              date_creation: new Date("2026-01-12"),
              id_auteur_modification: "550e8400-e29b-41d4-a716-446655440001",
              correlation_id: "550e8400-e29b-41d4-a716-446655440002",
              valeur: 110,
            },
            {
              id: "550e8400-e29b-41d4-a716-446655440002",
              indic_id: "IND-001",
              territoire_code: "DEPT-02",
              type_valeur: "VALEUR_AVANCEMENT",
              donnees_complementaires: {},
              type_evenement: EvenementValeurEnum.PROPOSITION_VALEUR_CREEE,
              date_valeur: new Date("2026-01-12"),
              ordre: 3,
              date_modification: new Date("2026-01-12"),
              date_creation: new Date("2026-01-12"),
              id_auteur_modification: "550e8400-e29b-41d4-a716-446655440001",
              correlation_id: "550e8400-e29b-41d4-a716-446655440002",
              valeur: 120,
            },
            {
              id: "550e8400-e29b-41d4-a716-446655440003",
              indic_id: "IND-001",
              territoire_code: "DEPT-02",
              type_valeur: "VALEUR_AVANCEMENT",
              donnees_complementaires: {},
              type_evenement: EvenementValeurEnum.PROPOSITION_VALEUR_MODIFIEE,
              date_valeur: new Date("2026-01-12"),
              ordre: 4,
              date_modification: new Date("2026-01-12"),
              date_creation: new Date("2026-01-14"),
              id_auteur_modification: "550e8400-e29b-41d4-a716-446655440001",
              correlation_id: "550e8400-e29b-41d4-a716-446655440002",
              valeur: 140,
            },

            {
              id: "550e8400-e29b-41d4-a716-446655440004",
              indic_id: "IND-001",
              territoire_code: "DEPT-02",
              type_valeur: "VALEUR_AVANCEMENT",
              donnees_complementaires: {},
              type_evenement: evenement,
              date_valeur: new Date("2026-01-12"),
              ordre: 5,
              date_modification: new Date("2026-01-12"),
              date_creation: new Date("2026-01-14"),
              id_auteur_modification: "550e8400-e29b-41d4-a716-446655440001",
              correlation_id: "550e8400-e29b-41d4-a716-446655440002",
              valeur: 140,
            },
          ],
        });

        // When
        const result =
          await prismaIndicateurRepository.récupérerDétailsTerritoirePourUnIndicateur(
            indicateurId,
            habilitations,
            ProfilEnum.SERVICES_DECONCENTRES_DEPARTEMENT,
            jalon,
            dateDerniereExecutionDatajobs,
          );

        // Then
        expect(result["DEPT-02"].valeurAvancement).toEqual(110);
        expect(result["DEPT-02"].dateValeurAvancement).toEqual(
          new Date("2026-01-12").toLocaleString(),
        );
        expect(result["DEPT-02"].proposition).toBeNull();
      },
    );

    it("Quand il existe une proposition de valeur d'avancement [CREEE, MODIFIEE, SUPPRIMEE, CREEE], retourne les détails des indicateurs pour un chantier, territoire et nouvelle proposition", async () => {
      // Given
      const chantiersIds = ["CH-001"];
      const indicateurId = "IND-001";
      const territoireCodes = ["DEPT-02", "DEPT-01"];
      const jalon = 2025;
      const habilitations: Habilitations = {
        gestionUtilisateur: {
          chantiers: chantiersIds,
          territoires: territoireCodes,
          périmètres: [],
        },
        lecture: {
          chantiers: chantiersIds,
          territoires: territoireCodes,
          périmètres: [],
        },
        saisieCommentaire: {
          chantiers: chantiersIds,
          territoires: territoireCodes,
          périmètres: [],
        },
        saisieIndicateur: {
          chantiers: chantiersIds,
          territoires: territoireCodes,
          périmètres: [],
        },
        responsabilite: {
          chantiers: chantiersIds,
          territoires: territoireCodes,
          périmètres: [],
        },
      };

      await prisma.chantier_identite.createMany({
        data: [
          {
            id: "CH-001",
            nom: "Chantier 001",
            ministeres: ["1009"],
            ministeres_acronymes: ["MINA"],
          },
        ],
      });

      await prisma.chantier_territoire.createMany({
        data: [
          {
            id: "CH-001",
            maille: "DEPT",
            code_insee: "02",
            territoire_code: "DEPT-02",
            zone_id: "FRANCE",
          },
          {
            id: "CH-001",
            maille: "DEPT",
            code_insee: "01",
            territoire_code: "DEPT-01",
            zone_id: "D01",
          },
        ],
      });

      await prisma.indicateur_identite.createMany({
        data: [
          {
            id: "IND-001",
            nom: "Indicateur 001",
            chantier_id: "CH-001",
            dernier_import_date_indic: new Date("2026-01-12"),
            type_id: "IMPACT",
            unite_mesure: "kg",
          },
        ],
      });

      await prisma.indicateur_territoire.createMany({
        data: [
          {
            id: "IND-001",
            chantier_id: "CH-001",
            maille: "DEPT",
            code_insee: "02",
            territoire_code: "DEPT-02",
            zone_id: "D02",
            evolution_valeur_actuelle: [
              {
                date: new Date("2026-01-12"),
                valeur: 100,
              },
              {
                date: new Date("2026-01-14"),
                valeur: 110,
              },
            ],
          },
          {
            id: "IND-001",
            chantier_id: "CH-001",
            maille: "DEPT",
            territoire_code: "DEPT-01",
            code_insee: "01",
            zone_id: "D01",
            valeur_actuelle_mandat: 10,
            date_valeur_actuelle_mandat: new Date("2025-05-06"),
          },
        ],
      });

      await prisma.indicateur_territoire_jalon.createMany({
        data: [
          {
            id: "IND-001",
            maille: "DEPT",
            code_insee: "02",
            territoire_code: "DEPT-02",
            jalon: 2025,
            zone_id: "D02",
            valeur_actuelle: 110,
            date_valeur_actuelle: new Date("2026-01-12"),
          },
        ],
      });

      await prisma.utilisateur.create({
        data: {
          email: "jane.doe@test.com",
          nom: "Doe",
          prenom: "Jane",
          id: "550e8400-e29b-41d4-a716-446655440001",
          date_creation: new Date().toISOString(),
          profil: {
            connect: {
              code: ProfilEnum.DITP_ADMIN,
            },
          },
        },
      });

      await prisma.indicateur_territoire_valeur_evenement.createMany({
        data: [
          {
            id: "550e8400-e29b-41d4-a716-446655440000",
            indic_id: "IND-001",
            territoire_code: "DEPT-02",
            type_valeur: "VALEUR_AVANCEMENT",
            donnees_complementaires: {},
            type_evenement: EvenementValeurEnum.VALEUR_CREEE,
            date_valeur: new Date("2026-01-12"),
            ordre: 1,
            date_modification: new Date("2026-01-12"),
            date_creation: new Date("2026-01-12"),
            id_auteur_modification: "550e8400-e29b-41d4-a716-446655440001",
            correlation_id: "550e8400-e29b-41d4-a716-446655440002",
            valeur: 100,
          },
          {
            id: "550e8400-e29b-41d4-a716-446655440001",
            indic_id: "IND-001",
            territoire_code: "DEPT-02",
            type_valeur: "VALEUR_AVANCEMENT",
            donnees_complementaires: {},
            type_evenement: EvenementValeurEnum.VALEUR_MODIFIEE,
            date_valeur: new Date("2026-01-12"),
            ordre: 2,
            date_modification: new Date("2026-01-12"),
            date_creation: new Date("2026-01-12"),
            id_auteur_modification: "550e8400-e29b-41d4-a716-446655440001",
            correlation_id: "550e8400-e29b-41d4-a716-446655440002",
            valeur: 110,
          },
          {
            id: "550e8400-e29b-41d4-a716-446655440002",
            indic_id: "IND-001",
            territoire_code: "DEPT-02",
            type_valeur: "VALEUR_AVANCEMENT",
            donnees_complementaires: {
              motif: "Motif de la proposition",
              source_donnee_methode_calcul:
                "Source de la donnée et méthode de calcul",
            },
            type_evenement: EvenementValeurEnum.PROPOSITION_VALEUR_CREEE,
            date_valeur: new Date("2026-01-12"),
            ordre: 3,
            date_modification: new Date("2026-01-12"),
            date_creation: new Date("2026-01-12"),
            id_auteur_modification: "550e8400-e29b-41d4-a716-446655440001",
            correlation_id: "550e8400-e29b-41d4-a716-446655440002",
            valeur: 120,
          },
          {
            id: "550e8400-e29b-41d4-a716-446655440003",
            indic_id: "IND-001",
            territoire_code: "DEPT-02",
            type_valeur: "VALEUR_AVANCEMENT",
            donnees_complementaires: {},
            type_evenement: EvenementValeurEnum.PROPOSITION_VALEUR_MODIFIEE,
            date_valeur: new Date("2026-01-12"),
            ordre: 4,
            date_modification: new Date("2026-01-12"),
            date_creation: new Date("2026-01-12"),
            id_auteur_modification: "550e8400-e29b-41d4-a716-446655440001",
            correlation_id: "550e8400-e29b-41d4-a716-446655440002",
            valeur: 140,
          },

          {
            id: "550e8400-e29b-41d4-a716-446655440004",
            indic_id: "IND-001",
            territoire_code: "DEPT-02",
            type_valeur: "VALEUR_AVANCEMENT",
            donnees_complementaires: {},
            type_evenement: EvenementValeurEnum.PROPOSITION_VALEUR_SUPPRIMEE,
            date_valeur: new Date("2026-01-12"),
            ordre: 5,
            date_modification: new Date("2026-01-12"),
            date_creation: new Date("2026-01-12"),
            id_auteur_modification: "550e8400-e29b-41d4-a716-446655440001",
            correlation_id: "550e8400-e29b-41d4-a716-446655440002",
            valeur: 140,
          },
          {
            id: "550e8400-e29b-41d4-a716-446655440005",
            indic_id: "IND-001",
            territoire_code: "DEPT-02",
            type_valeur: "VALEUR_AVANCEMENT",
            donnees_complementaires: {
              motif: "Motif de la proposition 2",
              source_donnee_methode_calcul:
                "Source de la donnée et méthode de calcul 2",
            },
            type_evenement: EvenementValeurEnum.PROPOSITION_VALEUR_CREEE,
            date_valeur: new Date("2026-01-12"),
            ordre: 6,
            date_modification: new Date("2026-01-12"),
            date_creation: new Date("2026-01-12"),
            id_auteur_modification: "550e8400-e29b-41d4-a716-446655440001",
            correlation_id: "550e8400-e29b-41d4-a716-446655440002",
            valeur: 150,
          },
        ],
      });

      // When
      const result =
        await prismaIndicateurRepository.récupérerDétailsTerritoirePourUnIndicateur(
          indicateurId,
          habilitations,
          ProfilEnum.SERVICES_DECONCENTRES_DEPARTEMENT,
          jalon,
          dateDerniereExecutionDatajobs,
        );

      // Then
      expect(result["DEPT-02"].valeurAvancement).toEqual(110);
      expect(result["DEPT-02"].dateValeurAvancement).toEqual(
        new Date("2026-01-12").toLocaleString(),
      );
      expect(result["DEPT-02"].proposition).toEqual({
        valeurAvancement: 150,
        tauxAvancement: null,
        tauxAvancementIntermediaire: null,
        statutTauxAvancement: "CALCULE",
        auteur: "Jane Doe",
        dateProposition: "2026-01-12T00:00:00.000Z",
        motif: "Motif de la proposition 2",
        sourceDonneeEtMethodeCalcul:
          "Source de la donnée et méthode de calcul 2",
      });
    });

    it("lorsque le dernier évènement en date est de type PROPOSITION_VALEUR_REFUSEE, le propositionStatutTerritoire est null et le propositionStatutDirectionProjet est PROPOSITION_VALEUR_REFUSEE avec la date de l'événement", async () => {
      // Given
      const chantiersIds = ["CH-001"];
      const indicateurId = "IND-001";
      const territoireCodes = ["DEPT-02", "DEPT-01"];
      const jalon = 2025;
      const habilitations: Habilitations = {
        gestionUtilisateur: {
          chantiers: chantiersIds,
          territoires: territoireCodes,
          périmètres: [],
        },
        lecture: {
          chantiers: chantiersIds,
          territoires: territoireCodes,
          périmètres: [],
        },
        saisieCommentaire: {
          chantiers: chantiersIds,
          territoires: territoireCodes,
          périmètres: [],
        },
        saisieIndicateur: {
          chantiers: chantiersIds,
          territoires: territoireCodes,
          périmètres: [],
        },
        responsabilite: {
          chantiers: chantiersIds,
          territoires: territoireCodes,
          périmètres: [],
        },
      };

      await prisma.chantier_identite.createMany({
        data: [
          {
            id: "CH-001",
            nom: "Chantier 001",
            ministeres: ["1009"],
            ministeres_acronymes: ["MINA"],
          },
        ],
      });

      await prisma.chantier_territoire.createMany({
        data: [
          {
            id: "CH-001",
            maille: "DEPT",
            code_insee: "02",
            territoire_code: "DEPT-02",
            zone_id: "FRANCE",
          },
          {
            id: "CH-001",
            maille: "DEPT",
            code_insee: "01",
            territoire_code: "DEPT-01",
            zone_id: "D01",
          },
        ],
      });

      await prisma.indicateur_identite.createMany({
        data: [
          {
            id: "IND-001",
            nom: "Indicateur 001",
            chantier_id: "CH-001",
            dernier_import_date_indic: new Date("2026-01-12"),
            type_id: "IMPACT",
            unite_mesure: "kg",
          },
        ],
      });

      await prisma.indicateur_territoire.createMany({
        data: [
          {
            id: "IND-001",
            chantier_id: "CH-001",
            maille: "DEPT",
            code_insee: "02",
            territoire_code: "DEPT-02",
            zone_id: "D02",
            date_valeur_actuelle_mandat: new Date("2026-01-12"),
            evolution_valeur_actuelle: [
              {
                date: new Date("2026-01-12"),
                valeur: 100,
              },
              {
                date: new Date("2026-01-14"),
                valeur: 110,
              },
            ],
          },
          {
            id: "IND-001",
            chantier_id: "CH-001",
            maille: "DEPT",
            territoire_code: "DEPT-01",
            code_insee: "01",
            zone_id: "D01",
            valeur_actuelle_mandat: 10,
            date_valeur_actuelle_mandat: new Date("2025-05-06"),
          },
        ],
      });

      await prisma.indicateur_territoire_jalon.createMany({
        data: [
          {
            id: "IND-001",
            maille: "DEPT",
            code_insee: "02",
            territoire_code: "DEPT-02",
            jalon: 2025,
            zone_id: "D02",
            valeur_actuelle: 110,
            date_valeur_actuelle: new Date("2026-01-12"),
          },
        ],
      });

      await prisma.utilisateur.create({
        data: {
          email: "jane.doe@test.com",
          nom: "Doe",
          prenom: "Jane",
          id: "550e8400-e29b-41d4-a716-446655440001",
          date_creation: new Date().toISOString(),
          profil: {
            connect: {
              code: ProfilEnum.DITP_ADMIN,
            },
          },
        },
      });

      await prisma.indicateur_territoire_valeur_evenement.createMany({
        data: [
          {
            id: "550e8400-e29b-41d4-a716-446655440000",
            indic_id: "IND-001",
            territoire_code: "DEPT-02",
            type_valeur: "VALEUR_AVANCEMENT",
            donnees_complementaires: {},
            type_evenement: EvenementValeurEnum.PROPOSITION_VALEUR_REFUSEE,
            date_valeur: new Date("2026-01-12"),
            ordre: 2,
            date_modification: new Date("2026-01-12"),
            date_creation: new Date("2026-01-12"),
            id_auteur_modification: "550e8400-e29b-41d4-a716-446655440001",
            correlation_id: "550e8400-e29b-41d4-a716-446655440002",
            valeur: 100,
          },
          {
            id: "d2d4153c-8561-42d5-8310-cae96337fd0a",
            indic_id: "IND-001",
            territoire_code: "DEPT-02",
            type_valeur: "VALEUR_AVANCEMENT",
            donnees_complementaires: {},
            type_evenement: EvenementValeurEnum.PROPOSITION_VALEUR_CREEE,
            date_valeur: new Date("2026-01-12"),
            ordre: 1,
            date_modification: new Date("2026-01-12"),
            date_creation: new Date("2026-01-12"),
            id_auteur_modification: "550e8400-e29b-41d4-a716-446655440001",
            correlation_id: "550e8400-e29b-41d4-a716-446655440002",
            valeur: 100,
          },
        ],
      });

      // When
      const result =
        await prismaIndicateurRepository.récupérerDétailsTerritoirePourUnIndicateur(
          indicateurId,
          habilitations,
          ProfilEnum.SERVICES_DECONCENTRES_DEPARTEMENT,
          jalon,
          dateDerniereExecutionDatajobs,
        );

      // Then

      expect(result["DEPT-02"].propositionStatutTerritoire).toBeNull();
      expect(result["DEPT-02"].propositionStatutDirectionProjet).toEqual({
        statut: "PROPOSITION_VALEUR_REFUSEE",
        date: "2026-01-12",
        dateTime: "2026-01-12T00:00:00.000Z",
      });
    });

    it("lorsque le dernier évènement en date est de type PROPOSITION_VALEUR_ACCUSEE_RECEPTION suivi de PROPOSITION_VALEUR_CREEE, le propositionStatutTerritoire est PROPOSITION_VALEUR_CREEE", async () => {
      // Given
      const chantiersIds = ["CH-001"];
      const indicateurId = "IND-001";
      const territoireCodes = ["DEPT-02", "DEPT-01"];
      const jalon = 2025;
      const habilitations: Habilitations = {
        gestionUtilisateur: {
          chantiers: chantiersIds,
          territoires: territoireCodes,
          périmètres: [],
        },
        lecture: {
          chantiers: chantiersIds,
          territoires: territoireCodes,
          périmètres: [],
        },
        saisieCommentaire: {
          chantiers: chantiersIds,
          territoires: territoireCodes,
          périmètres: [],
        },
        saisieIndicateur: {
          chantiers: chantiersIds,
          territoires: territoireCodes,
          périmètres: [],
        },
        responsabilite: {
          chantiers: chantiersIds,
          territoires: territoireCodes,
          périmètres: [],
        },
      };

      await prisma.chantier_identite.createMany({
        data: [
          {
            id: "CH-001",
            nom: "Chantier 001",
            ministeres: ["1009"],
            ministeres_acronymes: ["MINA"],
          },
        ],
      });

      await prisma.chantier_territoire.createMany({
        data: [
          {
            id: "CH-001",
            maille: "DEPT",
            code_insee: "02",
            territoire_code: "DEPT-02",
            zone_id: "FRANCE",
          },
          {
            id: "CH-001",
            maille: "DEPT",
            code_insee: "01",
            territoire_code: "DEPT-01",
            zone_id: "D01",
          },
        ],
      });

      await prisma.indicateur_identite.createMany({
        data: [
          {
            id: "IND-001",
            nom: "Indicateur 001",
            chantier_id: "CH-001",
            dernier_import_date_indic: new Date("2026-01-12"),
            type_id: "IMPACT",
            unite_mesure: "kg",
          },
        ],
      });

      await prisma.indicateur_territoire.createMany({
        data: [
          {
            id: "IND-001",
            chantier_id: "CH-001",
            maille: "DEPT",
            code_insee: "02",
            territoire_code: "DEPT-02",
            zone_id: "D02",
            date_valeur_actuelle_mandat: new Date("2026-01-12"),
            evolution_valeur_actuelle: [
              {
                date: new Date("2026-01-12"),
                valeur: 100,
              },
              {
                date: new Date("2026-01-14"),
                valeur: 110,
              },
            ],
          },
          {
            id: "IND-001",
            chantier_id: "CH-001",
            maille: "DEPT",
            territoire_code: "DEPT-01",
            code_insee: "01",
            zone_id: "D01",
            valeur_actuelle_mandat: 10,
            date_valeur_actuelle_mandat: new Date("2025-05-06"),
          },
        ],
      });

      await prisma.indicateur_territoire_jalon.createMany({
        data: [
          {
            id: "IND-001",
            maille: "DEPT",
            code_insee: "02",
            territoire_code: "DEPT-02",
            jalon: 2025,
            zone_id: "D02",
            valeur_actuelle: 110,
            date_valeur_actuelle: new Date("2026-01-12"),
          },
        ],
      });

      await prisma.utilisateur.create({
        data: {
          email: "jane.doe@test.com",
          nom: "Doe",
          prenom: "Jane",
          id: "550e8400-e29b-41d4-a716-446655440001",
          date_creation: new Date().toISOString(),
          profil: {
            connect: {
              code: ProfilEnum.DITP_ADMIN,
            },
          },
        },
      });

      await prisma.indicateur_territoire_valeur_evenement.createMany({
        data: [
          {
            id: "550e8400-e29b-41d4-a716-446655440100",
            indic_id: "IND-001",
            territoire_code: "DEPT-02",
            type_valeur: "VALEUR_AVANCEMENT",
            donnees_complementaires: {},
            type_evenement: EvenementValeurEnum.PROPOSITION_VALEUR_CREEE,
            date_valeur: new Date("2026-01-12"),
            ordre: 1,
            date_modification: new Date("2026-01-12"),
            date_creation: new Date("2026-01-12"),
            id_auteur_modification: "550e8400-e29b-41d4-a716-446655440001",
            correlation_id: "550e8400-e29b-41d4-a716-446655440003",
            valeur: 100,
          },
          {
            id: "550e8400-e29b-41d4-a716-446655440101",
            indic_id: "IND-001",
            territoire_code: "DEPT-02",
            type_valeur: "VALEUR_AVANCEMENT",
            donnees_complementaires: {},
            type_evenement:
              EvenementValeurEnum.PROPOSITION_VALEUR_ACCUSEE_RECEPTION,
            date_valeur: new Date("2026-01-12"),
            ordre: 2,
            date_modification: new Date("2026-01-12"),
            date_creation: new Date("2026-01-12"),
            id_auteur_modification: "550e8400-e29b-41d4-a716-446655440001",
            correlation_id: "550e8400-e29b-41d4-a716-446655440003",
            valeur: 100,
          },
        ],
      });

      // When
      const result =
        await prismaIndicateurRepository.récupérerDétailsTerritoirePourUnIndicateur(
          indicateurId,
          habilitations,
          ProfilEnum.SERVICES_DECONCENTRES_DEPARTEMENT,
          jalon,
          dateDerniereExecutionDatajobs,
        );

      // Then
      expect(result["DEPT-02"].propositionStatutTerritoire).toEqual({
        statut: "PROPOSITION_VALEUR_CREEE",
        date: "2026-01-12",
        dateTime: "2026-01-12T00:00:00.000Z",
      });
      expect(result["DEPT-02"].propositionStatutDirectionProjet).toEqual({
        statut: "PROPOSITION_VALEUR_ACCUSEE_RECEPTION",
        date: "2026-01-12",
        dateTime: "2026-01-12T00:00:00.000Z",
      });
    });

    it("lorsque le dernier évènement en date est de type PROPOSITION_VALEUR_ACCUSEE_RECEPTION suivi de PROPOSITION_VALEUR_MODIFIEE, le propositionStatutTerritoire est PROPOSITION_VALEUR_MODIFIEE", async () => {
      // Given
      const chantiersIds = ["CH-001"];
      const indicateurId = "IND-001";
      const territoireCodes = ["DEPT-02", "DEPT-01"];
      const jalon = 2025;
      const habilitations: Habilitations = {
        gestionUtilisateur: {
          chantiers: chantiersIds,
          territoires: territoireCodes,
          périmètres: [],
        },
        lecture: {
          chantiers: chantiersIds,
          territoires: territoireCodes,
          périmètres: [],
        },
        saisieCommentaire: {
          chantiers: chantiersIds,
          territoires: territoireCodes,
          périmètres: [],
        },
        saisieIndicateur: {
          chantiers: chantiersIds,
          territoires: territoireCodes,
          périmètres: [],
        },
        responsabilite: {
          chantiers: chantiersIds,
          territoires: territoireCodes,
          périmètres: [],
        },
      };

      await prisma.chantier_identite.createMany({
        data: [
          {
            id: "CH-001",
            nom: "Chantier 001",
            ministeres: ["1009"],
            ministeres_acronymes: ["MINA"],
          },
        ],
      });

      await prisma.chantier_territoire.createMany({
        data: [
          {
            id: "CH-001",
            maille: "DEPT",
            code_insee: "02",
            territoire_code: "DEPT-02",
            zone_id: "FRANCE",
          },
          {
            id: "CH-001",
            maille: "DEPT",
            code_insee: "01",
            territoire_code: "DEPT-01",
            zone_id: "D01",
          },
        ],
      });

      await prisma.indicateur_identite.createMany({
        data: [
          {
            id: "IND-001",
            nom: "Indicateur 001",
            chantier_id: "CH-001",
            dernier_import_date_indic: new Date("2026-01-12"),
            type_id: "IMPACT",
            unite_mesure: "kg",
          },
        ],
      });

      await prisma.indicateur_territoire.createMany({
        data: [
          {
            id: "IND-001",
            chantier_id: "CH-001",
            maille: "DEPT",
            code_insee: "02",
            territoire_code: "DEPT-02",
            zone_id: "D02",
            date_valeur_actuelle_mandat: new Date("2026-01-12"),
            evolution_valeur_actuelle: [
              {
                date: new Date("2026-01-12"),
                valeur: 100,
              },
              {
                date: new Date("2026-01-14"),
                valeur: 110,
              },
            ],
          },
          {
            id: "IND-001",
            chantier_id: "CH-001",
            maille: "DEPT",
            territoire_code: "DEPT-01",
            code_insee: "01",
            zone_id: "D01",
            valeur_actuelle_mandat: 10,
            date_valeur_actuelle_mandat: new Date("2025-05-06"),
          },
        ],
      });

      await prisma.indicateur_territoire_jalon.createMany({
        data: [
          {
            id: "IND-001",
            maille: "DEPT",
            code_insee: "02",
            territoire_code: "DEPT-02",
            jalon: 2025,
            zone_id: "D02",
            valeur_actuelle: 110,
            date_valeur_actuelle: new Date("2026-01-12"),
          },
        ],
      });

      await prisma.utilisateur.create({
        data: {
          email: "jane.doe@test.com",
          nom: "Doe",
          prenom: "Jane",
          id: "550e8400-e29b-41d4-a716-446655440003",
          date_creation: new Date().toISOString(),
          profil: {
            connect: {
              code: ProfilEnum.DITP_ADMIN,
            },
          },
        },
      });

      await prisma.indicateur_territoire_valeur_evenement.createMany({
        data: [
          {
            id: "550e8400-e29b-41d4-a716-446655440200",
            indic_id: "IND-001",
            territoire_code: "DEPT-02",
            type_valeur: "VALEUR_AVANCEMENT",
            donnees_complementaires: {},
            type_evenement: EvenementValeurEnum.PROPOSITION_VALEUR_CREEE,
            date_valeur: new Date("2026-01-12"),
            ordre: 1,
            date_modification: new Date("2026-01-12"),
            date_creation: new Date("2026-01-12"),
            id_auteur_modification: "550e8400-e29b-41d4-a716-446655440003",
            correlation_id: "550e8400-e29b-41d4-a716-446655440004",
            valeur: 100,
          },
          {
            id: "4bbe27d7-34a5-4cb9-b3bb-f681abe5544b",
            indic_id: "IND-001",
            territoire_code: "DEPT-02",
            type_valeur: "VALEUR_AVANCEMENT",
            donnees_complementaires: {},
            type_evenement: EvenementValeurEnum.PROPOSITION_VALEUR_MODIFIEE,
            date_valeur: new Date("2026-01-12"),
            ordre: 2,
            date_modification: new Date("2026-01-12"),
            date_creation: new Date("2026-01-12"),
            id_auteur_modification: "550e8400-e29b-41d4-a716-446655440003",
            correlation_id: "550e8400-e29b-41d4-a716-446655440004",
            valeur: 100,
          },
          {
            id: "e617826b-0f39-4f64-a409-de83c65f2d2d",
            indic_id: "IND-001",
            territoire_code: "DEPT-02",
            type_valeur: "VALEUR_AVANCEMENT",
            donnees_complementaires: {},
            type_evenement:
              EvenementValeurEnum.PROPOSITION_VALEUR_ACCUSEE_RECEPTION,
            date_valeur: new Date("2026-01-12"),
            ordre: 3,
            date_modification: new Date("2026-01-12"),
            date_creation: new Date("2026-01-12"),
            id_auteur_modification: "550e8400-e29b-41d4-a716-446655440003",
            correlation_id: "550e8400-e29b-41d4-a716-446655440004",
            valeur: 100,
          },
        ],
      });

      // When
      const result =
        await prismaIndicateurRepository.récupérerDétailsTerritoirePourUnIndicateur(
          indicateurId,
          habilitations,
          ProfilEnum.SERVICES_DECONCENTRES_DEPARTEMENT,
          jalon,
          dateDerniereExecutionDatajobs,
        );

      // Then
      expect(result["DEPT-02"].propositionStatutTerritoire).toEqual({
        statut: "PROPOSITION_VALEUR_MODIFIEE",
        date: "2026-01-12",
        dateTime: "2026-01-12T00:00:00.000Z",
      });
      expect(result["DEPT-02"].propositionStatutDirectionProjet).toEqual({
        statut: "PROPOSITION_VALEUR_ACCUSEE_RECEPTION",
        date: "2026-01-12",
        dateTime: "2026-01-12T00:00:00.000Z",
      });
    });

    it("lorsque le dernier évènement en date est de type PROPOSITION_VALEUR_SUPPRIMEE, le propositionStatutTerritoire est PROPOSITION_VALEUR_SUPPRIMEE et le propositionStatutDirectionProjet est null", async () => {
      // Given
      const chantiersIds = ["CH-001"];
      const indicateurId = "IND-001";
      const territoireCodes = ["DEPT-02", "DEPT-01"];
      const jalon = 2025;
      const habilitations: Habilitations = {
        gestionUtilisateur: {
          chantiers: chantiersIds,
          territoires: territoireCodes,
          périmètres: [],
        },
        lecture: {
          chantiers: chantiersIds,
          territoires: territoireCodes,
          périmètres: [],
        },
        saisieCommentaire: {
          chantiers: chantiersIds,
          territoires: territoireCodes,
          périmètres: [],
        },
        saisieIndicateur: {
          chantiers: chantiersIds,
          territoires: territoireCodes,
          périmètres: [],
        },
        responsabilite: {
          chantiers: chantiersIds,
          territoires: territoireCodes,
          périmètres: [],
        },
      };

      await prisma.chantier_identite.createMany({
        data: [
          {
            id: "CH-001",
            nom: "Chantier 001",
            ministeres: ["1009"],
            ministeres_acronymes: ["MINA"],
          },
        ],
      });

      await prisma.chantier_territoire.createMany({
        data: [
          {
            id: "CH-001",
            maille: "DEPT",
            code_insee: "02",
            territoire_code: "DEPT-02",
            zone_id: "FRANCE",
          },
          {
            id: "CH-001",
            maille: "DEPT",
            code_insee: "01",
            territoire_code: "DEPT-01",
            zone_id: "D01",
          },
        ],
      });

      await prisma.indicateur_identite.createMany({
        data: [
          {
            id: "IND-001",
            nom: "Indicateur 001",
            chantier_id: "CH-001",
            dernier_import_date_indic: new Date("2026-01-12"),
            type_id: "IMPACT",
            unite_mesure: "kg",
          },
        ],
      });

      await prisma.indicateur_territoire.createMany({
        data: [
          {
            id: "IND-001",
            chantier_id: "CH-001",
            maille: "DEPT",
            code_insee: "02",
            territoire_code: "DEPT-02",
            zone_id: "D02",
            date_valeur_actuelle_mandat: new Date("2026-01-12"),
            evolution_valeur_actuelle: [
              {
                date: new Date("2026-01-12"),
                valeur: 100,
              },
              {
                date: new Date("2026-01-14"),
                valeur: 110,
              },
            ],
          },
          {
            id: "IND-001",
            chantier_id: "CH-001",
            maille: "DEPT",
            territoire_code: "DEPT-01",
            code_insee: "01",
            zone_id: "D01",
            valeur_actuelle_mandat: 10,
            date_valeur_actuelle_mandat: new Date("2025-05-06"),
          },
        ],
      });

      await prisma.indicateur_territoire_jalon.createMany({
        data: [
          {
            id: "IND-001",
            maille: "DEPT",
            code_insee: "02",
            territoire_code: "DEPT-02",
            jalon: 2025,
            zone_id: "D02",
            valeur_actuelle: 110,
            date_valeur_actuelle: new Date("2026-01-12"),
          },
        ],
      });

      await prisma.utilisateur.create({
        data: {
          email: "jane.doe4@test.com",
          nom: "Doe",
          prenom: "Jane",
          id: "550e8400-e29b-41d4-a716-446655440004",
          date_creation: new Date().toISOString(),
          profil: {
            connect: {
              code: ProfilEnum.DITP_ADMIN,
            },
          },
        },
      });

      await prisma.indicateur_territoire_valeur_evenement.createMany({
        data: [
          {
            id: "550e8400-e29b-41d4-a716-446655440300",
            indic_id: "IND-001",
            territoire_code: "DEPT-02",
            type_valeur: "VALEUR_AVANCEMENT",
            donnees_complementaires: {},
            type_evenement: EvenementValeurEnum.PROPOSITION_VALEUR_CREEE,
            date_valeur: new Date("2026-01-12"),
            ordre: 1,
            date_modification: new Date("2026-01-12"),
            date_creation: new Date("2026-01-12"),
            id_auteur_modification: "550e8400-e29b-41d4-a716-446655440004",
            correlation_id: "550e8400-e29b-41d4-a716-446655440005",
            valeur: 100,
          },
          {
            id: "550e8400-e29b-41d4-a716-446655440301",
            indic_id: "IND-001",
            territoire_code: "DEPT-02",
            type_valeur: "VALEUR_AVANCEMENT",
            donnees_complementaires: {},
            type_evenement: EvenementValeurEnum.PROPOSITION_VALEUR_SUPPRIMEE,
            date_valeur: new Date("2026-01-12"),
            ordre: 2,
            date_modification: new Date("2026-01-12"),
            date_creation: new Date("2026-01-12"),
            id_auteur_modification: "550e8400-e29b-41d4-a716-446655440004",
            correlation_id: "550e8400-e29b-41d4-a716-446655440005",
            valeur: 100,
          },
        ],
      });

      // When
      const result =
        await prismaIndicateurRepository.récupérerDétailsTerritoirePourUnIndicateur(
          indicateurId,
          habilitations,
          ProfilEnum.SERVICES_DECONCENTRES_DEPARTEMENT,
          jalon,
          dateDerniereExecutionDatajobs,
        );

      // Then
      expect(result["DEPT-02"].propositionStatutTerritoire).toEqual({
        statut: "PROPOSITION_VALEUR_SUPPRIMEE",
        date: "2026-01-12",
        dateTime: "2026-01-12T00:00:00.000Z",
      });
      expect(result["DEPT-02"].propositionStatutDirectionProjet).toBeNull();
    });

    it("lorsque le dernier évènement en date est de type PROPOSITION_VALEUR_CREEE, le propositionStatutTerritoire est PROPOSITION_VALEUR_CREEE et le propositionStatutDirectionProjet est null", async () => {
      // Given
      const chantiersIds = ["CH-001"];
      const indicateurId = "IND-001";
      const territoireCodes = ["DEPT-02", "DEPT-01"];
      const jalon = 2025;
      const habilitations: Habilitations = {
        gestionUtilisateur: {
          chantiers: chantiersIds,
          territoires: territoireCodes,
          périmètres: [],
        },
        lecture: {
          chantiers: chantiersIds,
          territoires: territoireCodes,
          périmètres: [],
        },
        saisieCommentaire: {
          chantiers: chantiersIds,
          territoires: territoireCodes,
          périmètres: [],
        },
        saisieIndicateur: {
          chantiers: chantiersIds,
          territoires: territoireCodes,
          périmètres: [],
        },
        responsabilite: {
          chantiers: chantiersIds,
          territoires: territoireCodes,
          périmètres: [],
        },
      };

      await prisma.chantier_identite.createMany({
        data: [
          {
            id: "CH-001",
            nom: "Chantier 001",
            ministeres: ["1009"],
            ministeres_acronymes: ["MINA"],
          },
        ],
      });

      await prisma.chantier_territoire.createMany({
        data: [
          {
            id: "CH-001",
            maille: "DEPT",
            code_insee: "02",
            territoire_code: "DEPT-02",
            zone_id: "FRANCE",
          },
          {
            id: "CH-001",
            maille: "DEPT",
            code_insee: "01",
            territoire_code: "DEPT-01",
            zone_id: "D01",
          },
        ],
      });

      await prisma.indicateur_identite.createMany({
        data: [
          {
            id: "IND-001",
            nom: "Indicateur 001",
            chantier_id: "CH-001",
            dernier_import_date_indic: new Date("2026-01-12"),
            type_id: "IMPACT",
            unite_mesure: "kg",
          },
        ],
      });

      await prisma.indicateur_territoire.createMany({
        data: [
          {
            id: "IND-001",
            chantier_id: "CH-001",
            maille: "DEPT",
            code_insee: "02",
            territoire_code: "DEPT-02",
            zone_id: "D02",
            date_valeur_actuelle_mandat: new Date("2026-01-12"),
            evolution_valeur_actuelle: [
              {
                date: new Date("2026-01-12"),
                valeur: 100,
              },
              {
                date: new Date("2026-01-14"),
                valeur: 110,
              },
            ],
          },
          {
            id: "IND-001",
            chantier_id: "CH-001",
            maille: "DEPT",
            territoire_code: "DEPT-01",
            code_insee: "01",
            zone_id: "D01",
            valeur_actuelle_mandat: 10,
            date_valeur_actuelle_mandat: new Date("2025-05-06"),
          },
        ],
      });

      await prisma.indicateur_territoire_jalon.createMany({
        data: [
          {
            id: "IND-001",
            maille: "DEPT",
            code_insee: "02",
            territoire_code: "DEPT-02",
            jalon: 2025,
            zone_id: "D02",
            valeur_actuelle: 110,
            date_valeur_actuelle: new Date("2026-01-12"),
          },
        ],
      });

      await prisma.utilisateur.create({
        data: {
          email: "jane.doe5@test.com",
          nom: "Doe",
          prenom: "Jane",
          id: "550e8400-e29b-41d4-a716-446655440005",
          date_creation: new Date().toISOString(),
          profil: {
            connect: {
              code: ProfilEnum.DITP_ADMIN,
            },
          },
        },
      });

      await prisma.indicateur_territoire_valeur_evenement.createMany({
        data: [
          {
            id: "550e8400-e29b-41d4-a716-446655440400",
            indic_id: "IND-001",
            territoire_code: "DEPT-02",
            type_valeur: "VALEUR_AVANCEMENT",
            donnees_complementaires: {},
            type_evenement: EvenementValeurEnum.PROPOSITION_VALEUR_CREEE,
            date_valeur: new Date("2026-01-12"),
            ordre: 1,
            date_modification: new Date("2026-01-12"),
            date_creation: new Date("2026-01-12"),
            id_auteur_modification: "550e8400-e29b-41d4-a716-446655440005",
            correlation_id: "550e8400-e29b-41d4-a716-446655440006",
            valeur: 100,
          },
        ],
      });

      // When
      const result =
        await prismaIndicateurRepository.récupérerDétailsTerritoirePourUnIndicateur(
          indicateurId,
          habilitations,
          ProfilEnum.SERVICES_DECONCENTRES_DEPARTEMENT,
          jalon,
          dateDerniereExecutionDatajobs,
        );

      // Then
      expect(result["DEPT-02"].propositionStatutTerritoire).toEqual({
        statut: "PROPOSITION_VALEUR_CREEE",
        date: "2026-01-12",
        dateTime: "2026-01-12T00:00:00.000Z",
      });
      expect(result["DEPT-02"].propositionStatutDirectionProjet).toBeNull();
    });

    it("lorsque le dernier évènement en date est de type PROPOSITION_VALEUR_MODIFIEE, le propositionStatutTerritoire est PROPOSITION_VALEUR_MODIFIEE et le propositionStatutDirectionProjet est null", async () => {
      // Given
      const chantiersIds = ["CH-001"];
      const indicateurId = "IND-001";
      const territoireCodes = ["DEPT-02", "DEPT-01"];
      const jalon = 2025;
      const habilitations: Habilitations = {
        gestionUtilisateur: {
          chantiers: chantiersIds,
          territoires: territoireCodes,
          périmètres: [],
        },
        lecture: {
          chantiers: chantiersIds,
          territoires: territoireCodes,
          périmètres: [],
        },
        saisieCommentaire: {
          chantiers: chantiersIds,
          territoires: territoireCodes,
          périmètres: [],
        },
        saisieIndicateur: {
          chantiers: chantiersIds,
          territoires: territoireCodes,
          périmètres: [],
        },
        responsabilite: {
          chantiers: chantiersIds,
          territoires: territoireCodes,
          périmètres: [],
        },
      };

      await prisma.chantier_identite.createMany({
        data: [
          {
            id: "CH-001",
            nom: "Chantier 001",
            ministeres: ["1009"],
            ministeres_acronymes: ["MINA"],
          },
        ],
      });

      await prisma.chantier_territoire.createMany({
        data: [
          {
            id: "CH-001",
            maille: "DEPT",
            code_insee: "02",
            territoire_code: "DEPT-02",
            zone_id: "FRANCE",
          },
          {
            id: "CH-001",
            maille: "DEPT",
            code_insee: "01",
            territoire_code: "DEPT-01",
            zone_id: "D01",
          },
        ],
      });

      await prisma.indicateur_identite.createMany({
        data: [
          {
            id: "IND-001",
            nom: "Indicateur 001",
            chantier_id: "CH-001",
            dernier_import_date_indic: new Date("2026-01-12"),
            type_id: "IMPACT",
            unite_mesure: "kg",
          },
        ],
      });

      await prisma.indicateur_territoire.createMany({
        data: [
          {
            id: "IND-001",
            chantier_id: "CH-001",
            maille: "DEPT",
            code_insee: "02",
            territoire_code: "DEPT-02",
            zone_id: "D02",
            date_valeur_actuelle_mandat: new Date("2026-01-12"),
            evolution_valeur_actuelle: [
              {
                date: new Date("2026-01-12"),
                valeur: 100,
              },
              {
                date: new Date("2026-01-14"),
                valeur: 110,
              },
            ],
          },
          {
            id: "IND-001",
            chantier_id: "CH-001",
            maille: "DEPT",
            territoire_code: "DEPT-01",
            code_insee: "01",
            zone_id: "D01",
            valeur_actuelle_mandat: 10,
            date_valeur_actuelle_mandat: new Date("2025-05-06"),
          },
        ],
      });

      await prisma.indicateur_territoire_jalon.createMany({
        data: [
          {
            id: "IND-001",
            maille: "DEPT",
            code_insee: "02",
            territoire_code: "DEPT-02",
            jalon: 2025,
            zone_id: "D02",
            valeur_actuelle: 110,
            date_valeur_actuelle: new Date("2026-01-12"),
          },
        ],
      });

      await prisma.utilisateur.create({
        data: {
          email: "jane.doe6@test.com",
          nom: "Doe",
          prenom: "Jane",
          id: "550e8400-e29b-41d4-a716-446655440006",
          date_creation: new Date().toISOString(),
          profil: {
            connect: {
              code: ProfilEnum.DITP_ADMIN,
            },
          },
        },
      });

      await prisma.indicateur_territoire_valeur_evenement.createMany({
        data: [
          {
            id: "207aed34-158a-46b5-80d1-acebb72cd7e3",
            indic_id: "IND-001",
            territoire_code: "DEPT-02",
            type_valeur: "VALEUR_AVANCEMENT",
            donnees_complementaires: {},
            type_evenement: EvenementValeurEnum.PROPOSITION_VALEUR_MODIFIEE,
            date_valeur: new Date("2026-01-12"),
            ordre: 3,
            date_modification: new Date("2026-01-12"),
            date_creation: new Date("2026-01-12"),
            id_auteur_modification: "550e8400-e29b-41d4-a716-446655440006",
            correlation_id: "550e8400-e29b-41d4-a716-446655440007",
            valeur: 90,
          },
          {
            id: "550e8400-e29b-41d4-a716-446655440500",
            indic_id: "IND-001",
            territoire_code: "DEPT-02",
            type_valeur: "VALEUR_AVANCEMENT",
            donnees_complementaires: {},
            type_evenement: EvenementValeurEnum.PROPOSITION_VALEUR_MODIFIEE,
            date_valeur: new Date("2026-01-12"),
            ordre: 2,
            date_modification: new Date("2026-01-12"),
            date_creation: new Date("2026-01-12"),
            id_auteur_modification: "550e8400-e29b-41d4-a716-446655440006",
            correlation_id: "550e8400-e29b-41d4-a716-446655440007",
            valeur: 100,
          },
          {
            id: "3c9316d9-de73-439b-bf62-75fb280860b6",
            indic_id: "IND-001",
            territoire_code: "DEPT-02",
            type_valeur: "VALEUR_AVANCEMENT",
            donnees_complementaires: {},
            type_evenement: EvenementValeurEnum.PROPOSITION_VALEUR_CREEE,
            date_valeur: new Date("2026-01-12"),
            ordre: 1,
            date_modification: new Date("2026-01-12"),
            date_creation: new Date("2026-01-12"),
            id_auteur_modification: "550e8400-e29b-41d4-a716-446655440006",
            correlation_id: "550e8400-e29b-41d4-a716-446655440007",
            valeur: 10,
          },
        ],
      });

      // When
      const result =
        await prismaIndicateurRepository.récupérerDétailsTerritoirePourUnIndicateur(
          indicateurId,
          habilitations,
          ProfilEnum.SERVICES_DECONCENTRES_DEPARTEMENT,
          jalon,
          dateDerniereExecutionDatajobs,
        );

      // Then
      expect(result["DEPT-02"].propositionStatutTerritoire).toEqual({
        statut: "PROPOSITION_VALEUR_MODIFIEE",
        date: "2026-01-12",
        dateTime: "2026-01-12T00:00:00.000Z",
      });
      expect(result["DEPT-02"].propositionStatutDirectionProjet).toBeNull();
    });

    it("s'assure que les événements sur différentes dates ne s'impactent pas mutuellement", async () => {
      // Given
      const chantiersIds = ["CH-001"];
      const indicateurId = "IND-001";
      const territoireCodes = ["DEPT-02", "DEPT-01"];
      const jalon = 2025;
      const habilitations: Habilitations = {
        gestionUtilisateur: {
          chantiers: chantiersIds,
          territoires: territoireCodes,
          périmètres: [],
        },
        lecture: {
          chantiers: chantiersIds,
          territoires: territoireCodes,
          périmètres: [],
        },
        saisieCommentaire: {
          chantiers: chantiersIds,
          territoires: territoireCodes,
          périmètres: [],
        },
        saisieIndicateur: {
          chantiers: chantiersIds,
          territoires: territoireCodes,
          périmètres: [],
        },
        responsabilite: {
          chantiers: chantiersIds,
          territoires: territoireCodes,
          périmètres: [],
        },
      };

      await prisma.chantier_identite.createMany({
        data: [
          {
            id: "CH-001",
            nom: "Chantier 001",
            ministeres: ["1009"],
            ministeres_acronymes: ["MINA"],
          },
        ],
      });

      await prisma.chantier_territoire.createMany({
        data: [
          {
            id: "CH-001",
            maille: "DEPT",
            code_insee: "02",
            territoire_code: "DEPT-02",
            zone_id: "FRANCE",
          },
          {
            id: "CH-001",
            maille: "DEPT",
            code_insee: "01",
            territoire_code: "DEPT-01",
            zone_id: "D01",
          },
        ],
      });

      await prisma.indicateur_identite.createMany({
        data: [
          {
            id: "IND-001",
            nom: "Indicateur 001",
            chantier_id: "CH-001",
            dernier_import_date_indic: new Date("2026-01-12"),
            type_id: "IMPACT",
            unite_mesure: "kg",
          },
        ],
      });

      await prisma.indicateur_territoire.createMany({
        data: [
          {
            id: "IND-001",
            chantier_id: "CH-001",
            maille: "DEPT",
            code_insee: "02",
            territoire_code: "DEPT-02",
            zone_id: "D02",
            date_valeur_actuelle_mandat: new Date("2026-01-12"),
            evolution_valeur_actuelle: [
              {
                date: new Date("2026-01-12"),
                valeur: 100,
              },
              {
                date: new Date("2026-01-14"),
                valeur: 110,
              },
            ],
          },
          {
            id: "IND-001",
            chantier_id: "CH-001",
            maille: "DEPT",
            territoire_code: "DEPT-01",
            code_insee: "01",
            zone_id: "D01",
            valeur_actuelle_mandat: 10,
            date_valeur_actuelle_mandat: new Date("2025-05-06"),
          },
        ],
      });

      await prisma.indicateur_territoire_jalon.createMany({
        data: [
          {
            id: "IND-001",
            maille: "DEPT",
            code_insee: "02",
            territoire_code: "DEPT-02",
            jalon: 2025,
            zone_id: "D02",
            valeur_actuelle: 110,
            date_valeur_actuelle: new Date("2026-01-12"),
          },
        ],
      });

      await prisma.utilisateur.create({
        data: {
          email: "jane.doe7@test.com",
          nom: "Doe",
          prenom: "Jane",
          id: "550e8400-e29b-41d4-a716-446655440007",
          date_creation: new Date().toISOString(),
          profil: {
            connect: {
              code: ProfilEnum.DITP_ADMIN,
            },
          },
        },
      });

      await prisma.indicateur_territoire_valeur_evenement.createMany({
        data: [
          // Événement sur une date antérieure - ne devrait pas impacter
          {
            id: "550e8400-e29b-41d4-a716-446655440600",
            indic_id: "IND-001",
            territoire_code: "DEPT-02",
            type_valeur: "VALEUR_AVANCEMENT",
            donnees_complementaires: {},
            type_evenement:
              EvenementValeurEnum.PROPOSITION_VALEUR_ACCUSEE_RECEPTION,
            date_valeur: new Date("2026-01-10"),
            ordre: 1,
            date_modification: new Date("2026-01-10"),
            date_creation: new Date("2026-01-10"),
            id_auteur_modification: "550e8400-e29b-41d4-a716-446655440007",
            correlation_id: "550e8400-e29b-41d4-a716-446655440008",
            valeur: 80,
          },
          // Événements sur la date la plus récente (date_valeur_actuelle)
          {
            id: "550e8400-e29b-41d4-a716-446655440601",
            indic_id: "IND-001",
            territoire_code: "DEPT-02",
            type_valeur: "VALEUR_AVANCEMENT",
            donnees_complementaires: {},
            type_evenement: EvenementValeurEnum.PROPOSITION_VALEUR_CREEE,
            date_valeur: new Date("2026-01-12"),
            ordre: 1,
            date_modification: new Date("2026-01-12"),
            date_creation: new Date("2026-01-12"),
            id_auteur_modification: "550e8400-e29b-41d4-a716-446655440007",
            correlation_id: "550e8400-e29b-41d4-a716-446655440008",
            valeur: 100,
          },
        ],
      });

      // When
      const result =
        await prismaIndicateurRepository.récupérerDétailsTerritoirePourUnIndicateur(
          indicateurId,
          habilitations,
          ProfilEnum.SERVICES_DECONCENTRES_DEPARTEMENT,
          jalon,
          dateDerniereExecutionDatajobs,
        );

      // Then
      // Seuls les événements de la date la plus récente (2026-01-15) sont pris en compte
      expect(result["DEPT-02"].propositionStatutTerritoire).toEqual({
        statut: "PROPOSITION_VALEUR_CREEE",
        date: "2026-01-12",
        dateTime: "2026-01-12T00:00:00.000Z",
      });
      expect(result["DEPT-02"].propositionStatutDirectionProjet).toBeNull();
    });

    it("calcule le statutTauxAvancement EN_COURS quand la date de création de la proposition est postérieure à la dernière exécution des datajobs", async () => {
      // Given
      const chantiersIds = ["CH-001"];
      const indicateurId = "IND-001";
      const territoireCodes = ["DEPT-02"];
      const jalon = 2025;
      const habilitations: Habilitations = {
        gestionUtilisateur: {
          chantiers: chantiersIds,
          territoires: territoireCodes,
          périmètres: [],
        },
        lecture: {
          chantiers: chantiersIds,
          territoires: territoireCodes,
          périmètres: [],
        },
        saisieCommentaire: {
          chantiers: chantiersIds,
          territoires: territoireCodes,
          périmètres: [],
        },
        saisieIndicateur: {
          chantiers: chantiersIds,
          territoires: territoireCodes,
          périmètres: [],
        },
        responsabilite: {
          chantiers: chantiersIds,
          territoires: territoireCodes,
          périmètres: [],
        },
      };

      await prisma.chantier_identite.createMany({
        data: [
          {
            id: "CH-001",
            nom: "Chantier 001",
            ministeres: ["1009"],
            ministeres_acronymes: ["MINA"],
          },
        ],
      });

      await prisma.chantier_territoire.createMany({
        data: [
          {
            id: "CH-001",
            maille: "DEPT",
            code_insee: "02",
            territoire_code: "DEPT-02",
            zone_id: "FRANCE",
          },
        ],
      });

      await prisma.indicateur_identite.createMany({
        data: [
          {
            id: "IND-001",
            nom: "Indicateur 001",
            chantier_id: "CH-001",
            dernier_import_date_indic: new Date("2026-01-12"),
            type_id: "IMPACT",
            unite_mesure: "kg",
            statut: "PUBLIE",
          },
        ],
      });

      await prisma.indicateur_territoire.createMany({
        data: [
          {
            id: "IND-001",
            chantier_id: "CH-001",
            maille: "DEPT",
            code_insee: "02",
            territoire_code: "DEPT-02",
            zone_id: "D02",
          },
        ],
      });

      await prisma.utilisateur.create({
        data: {
          email: "jane.doe@test.com",
          nom: "Jane",
          prenom: "Doe",
          id: "550e8400-e29b-41d4-a716-446655440001",
          date_creation: new Date().toISOString(),
          profil: {
            connect: {
              code: ProfilEnum.DITP_ADMIN,
            },
          },
        },
      });

      await prisma.indicateur_territoire_valeur_evenement.createMany({
        data: [
          {
            id: "550e8400-e29b-41d4-a716-446655440000",
            indic_id: "IND-001",
            territoire_code: "DEPT-02",
            type_valeur: "VALEUR_AVANCEMENT",
            donnees_complementaires: {},
            type_evenement: EvenementValeurEnum.PROPOSITION_VALEUR_CREEE,
            date_valeur: new Date("2026-01-12"),
            ordre: 1,
            date_modification: new Date("2026-02-13"),
            date_creation: new Date("2026-02-13"), // Postérieure à la dernière exécution des datajobs
            id_auteur_modification: "550e8400-e29b-41d4-a716-446655440001",
            correlation_id: "550e8400-e29b-41d4-a716-446655440002",
            valeur: 100,
          },
        ],
      });

      // When
      const result =
        await prismaIndicateurRepository.récupérerDétailsTerritoirePourUnIndicateur(
          indicateurId,
          habilitations,
          ProfilEnum.SERVICES_DECONCENTRES_DEPARTEMENT,
          jalon,
          dateDerniereExecutionDatajobs,
        );

      // Then
      expect(result["DEPT-02"].proposition?.statutTauxAvancement).toEqual(
        "EN_COURS",
      );
    });

    it("calcule le statutTauxAvancement CALCULE quand la date de création de la proposition est antérieure à la dernière exécution des datajobs", async () => {
      // Given
      const chantiersIds = ["CH-001"];
      const indicateurId = "IND-001";
      const territoireCodes = ["DEPT-02"];
      const jalon = 2025;
      const habilitations: Habilitations = {
        gestionUtilisateur: {
          chantiers: chantiersIds,
          territoires: territoireCodes,
          périmètres: [],
        },
        lecture: {
          chantiers: chantiersIds,
          territoires: territoireCodes,
          périmètres: [],
        },
        saisieCommentaire: {
          chantiers: chantiersIds,
          territoires: territoireCodes,
          périmètres: [],
        },
        saisieIndicateur: {
          chantiers: chantiersIds,
          territoires: territoireCodes,
          périmètres: [],
        },
        responsabilite: {
          chantiers: chantiersIds,
          territoires: territoireCodes,
          périmètres: [],
        },
      };

      await prisma.chantier_identite.createMany({
        data: [
          {
            id: "CH-001",
            nom: "Chantier 001",
            ministeres: ["1009"],
            ministeres_acronymes: ["MINA"],
          },
        ],
      });

      await prisma.chantier_territoire.createMany({
        data: [
          {
            id: "CH-001",
            maille: "DEPT",
            code_insee: "02",
            territoire_code: "DEPT-02",
            zone_id: "FRANCE",
          },
        ],
      });

      await prisma.indicateur_identite.createMany({
        data: [
          {
            id: "IND-001",
            nom: "Indicateur 001",
            chantier_id: "CH-001",
            dernier_import_date_indic: new Date("2026-01-12"),
            type_id: "IMPACT",
            unite_mesure: "kg",
            statut: "PUBLIE",
          },
        ],
      });

      await prisma.indicateur_territoire.createMany({
        data: [
          {
            id: "IND-001",
            chantier_id: "CH-001",
            maille: "DEPT",
            code_insee: "02",
            territoire_code: "DEPT-02",
            zone_id: "D02",
          },
        ],
      });

      await prisma.utilisateur.create({
        data: {
          email: "jane.doe@test.com",
          nom: "Jane",
          prenom: "Doe",
          id: "550e8400-e29b-41d4-a716-446655440001",
          date_creation: new Date().toISOString(),
          profil: {
            connect: {
              code: ProfilEnum.DITP_ADMIN,
            },
          },
        },
      });

      await prisma.indicateur_territoire_valeur_evenement.createMany({
        data: [
          {
            id: "550e8400-e29b-41d4-a716-446655440000",
            indic_id: "IND-001",
            territoire_code: "DEPT-02",
            type_valeur: "VALEUR_AVANCEMENT",
            donnees_complementaires: {},
            type_evenement: EvenementValeurEnum.PROPOSITION_VALEUR_CREEE,
            date_valeur: new Date("2026-01-12"),
            ordre: 1,
            date_modification: new Date("2026-01-12"),
            date_creation: new Date("2026-01-12"),
            id_auteur_modification: "550e8400-e29b-41d4-a716-446655440001",
            correlation_id: "550e8400-e29b-41d4-a716-446655440002",
            valeur: 100,
          },
        ],
      });

      // When
      const result =
        await prismaIndicateurRepository.récupérerDétailsTerritoirePourUnIndicateur(
          indicateurId,
          habilitations,
          ProfilEnum.SERVICES_DECONCENTRES_DEPARTEMENT,
          jalon,
          dateDerniereExecutionDatajobs,
        );

      // Then
      expect(result["DEPT-02"].proposition?.statutTauxAvancement).toEqual(
        "CALCULE",
      );
    });
  });
});
