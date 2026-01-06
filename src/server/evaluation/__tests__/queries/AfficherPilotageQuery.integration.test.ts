import { AfficherPilotageQuery } from "@/server/evaluation/queries/AfficherPilotageQuery";
import { PrismaPilote } from "@/server/db/PrismaPilote";
import { prisma } from "@/server/db/prisma";

describe("#AfficherPilotageQuery", () => {
  let query: AfficherPilotageQuery;
  const prismaPilote = new PrismaPilote();

  beforeEach(() => {
    query = new AfficherPilotageQuery({ prisma: prismaPilote });
  });

  describe("run", () => {
    it("doit retourner les fiches sans les évaluations quand elles n'existent pas", async () => {
      // Given
      const critere1Id = "9db7282a-9048-425a-a4f8-c3d60be6153b";
      const critere2Id = "f39ee3b9-cceb-429c-b1bd-6e6e2d4104ca";
      const rattachementCode = "REG-75";
      const objectif1Id = "66b7dca2-8135-44ad-b621-00e5577de68c";
      const objectif2Id = "f4871fc7-f71e-403a-a16c-d6a663b38e37";
      const ficheEvaluationId = "c087c37f-f7a3-4044-927a-dd99c6d3993e";
      const etapeEvaluationId = "5fc648d8-2900-4032-871e-730e06a1477c";

      await prisma.referentiel_critere.createMany({
        data: [
          {
            id: critere1Id,
            libelle: "Critère 1",
            descriptif: "Description critère 1",
            type: "COMMUNICATION",
          },
          {
            id: critere2Id,
            libelle: "Critère 2",
            descriptif: "Description critère 2",
            type: "SERVICES_PUBLICS",
          },
        ],
      });

      await prisma.referentiel_rattachement.create({
        data: {
          code: rattachementCode,
          groupe: "Groupe A",
          ordre: 1,
          libelle: "Rattachement 1",
          objectifs: {
            create: [
              {
                id: objectif1Id,
                libelle: "Objectif 1",
                descriptif: "Description objectif 1",
                jalon: 2025,
                indicateur_cible: "75% de taux de réussite",
              },
              {
                id: objectif2Id,
                libelle: "Objectif 2",
                descriptif: "Description objectif 2",
                jalon: 2025,
                indicateur_cible: "Réduction de 30% des coûts",
              },
            ],
          },
        },
      });

      await prisma.fiche_evaluation.create({
        data: {
          id: ficheEvaluationId,
          jalon: 2025,
          etape_courante: "AUTO_EVALUATION",
          rattachement_code: rattachementCode,
          etape_evaluations: {
            create: {
              id: etapeEvaluationId,
              type: "AUTO_EVALUATION",
            },
          },
        },
      });

      // When
      const result = await query.run();

      // Then
      expect(result.criteres).toEqual([
        {
          id: critere1Id,
          libelle: "Critère 1",
          descriptif: "Description critère 1",
          type: "COMMUNICATION",
          sousCriteres: [],
        },
        {
          id: critere2Id,
          libelle: "Critère 2",
          descriptif: "Description critère 2",
          type: "SERVICES_PUBLICS",
          sousCriteres: [],
        },
      ]);
      expect(result.fichesEvaluation).toEqual([
        {
          id: ficheEvaluationId,
          jalon: 2025,
          etapeCourante: "AUTO_EVALUATION",
          readOnly: false,
          rattachement: {
            code: rattachementCode,
            libelle: "Rattachement 1",
            groupe: "Groupe A",
            ordre: 1,
          },
          noteObjectifsCollectifs: null,
          evaluationsParCritereEtEtape: {
            [critere1Id]: {
              AUTO_EVALUATION: null,
              CONSOLIDATION: null,
              INSTRUCTION: null,
            },
            [critere2Id]: {
              AUTO_EVALUATION: null,
              CONSOLIDATION: null,
              INSTRUCTION: null,
            },
          },
          objectifs: [
            {
              id: objectif1Id,
              libelle: "Objectif 1",
              evaluations: {
                AUTO_EVALUATION: null,
                CONSOLIDATION: null,
                INSTRUCTION: null,
              },
            },
            {
              id: objectif2Id,
              libelle: "Objectif 2",
              evaluations: {
                AUTO_EVALUATION: null,
                CONSOLIDATION: null,
                INSTRUCTION: null,
              },
            },
          ],
        },
      ]);
    });

    it("doit retourner les évaluations des critères et des objectifs quand elles existent", async () => {
      // Given
      const critereId = "98ae4279-8bc9-425b-9f33-41cd6698de93";
      const rattachementCode = "REG-84";
      const objectifId = "6af165bc-54bb-4bce-94d9-8a0f042f3154";
      const ficheEvaluationId = "011aff78-39bb-462f-ae6f-130d4295330c";
      const etapeAutoEvaluationId = "74196334-2da2-4068-a7ca-cc2dfd56fa3d";
      const etapeConsolidationId = "a5b6c7d8-e9f0-1234-5678-901234567890";
      const etapeInstructionId = "b6c7d8e9-f0a1-2345-6789-012345678901";
      const utilisateurId = "075b92b7-139c-4f2f-a059-530254351fd6";

      await prisma.utilisateur.create({
        data: {
          id: utilisateurId,
          email: "test@example.com",
          nom: "Test",
          prenom: "User",
          date_creation: new Date(),
          profilCode: "DITP_ADMIN",
        },
      });

      await prisma.referentiel_critere.create({
        data: {
          id: critereId,
          libelle: "Critère test",
          descriptif: "Description critère test",
          type: "SIMPLIFICATION",
        },
      });

      await prisma.referentiel_rattachement.create({
        data: {
          code: rattachementCode,
          groupe: "Groupe B",
          ordre: 1,
          libelle: "Rattachement test",
          objectifs: {
            create: {
              id: objectifId,
              libelle: "Objectif test",
              descriptif: "Description objectif test",
              jalon: 1,
              indicateur_cible: "500 agents formés",
            },
          },
        },
      });

      await prisma.fiche_evaluation.create({
        data: {
          id: ficheEvaluationId,
          jalon: 1,
          etape_courante: "CONSOLIDATION",
          rattachement_code: rattachementCode,
          etape_evaluations: {
            create: [
              {
                id: etapeAutoEvaluationId,
                type: "AUTO_EVALUATION",
              },
              {
                id: etapeConsolidationId,
                type: "CONSOLIDATION",
              },
              {
                id: etapeInstructionId,
                type: "INSTRUCTION",
              },
            ],
          },
        },
      });

      await prisma.evaluation_objectif.createMany({
        data: [
          {
            id: "f7da2fb6-7de4-472d-9dd8-ad5dcb0f3483",
            etape_evaluation_id: etapeAutoEvaluationId,
            objectif_id: objectifId,
            auteur_id: utilisateurId,
            note: 4,
            commentaire: "Bon objectif",
          },
          {
            id: "15effe71-cf6a-4d5d-b72f-4d2bb0cbf2a4",
            etape_evaluation_id: etapeConsolidationId,
            objectif_id: objectifId,
            auteur_id: utilisateurId,
            note: 5,
            commentaire: "Excellent objectif",
          },
          {
            id: "1f60ff7e-112d-4510-a3ef-b1ce7b033ec0",
            etape_evaluation_id: etapeInstructionId,
            objectif_id: objectifId,
            auteur_id: utilisateurId,
            note: 3,
            commentaire: "Objectif instruction",
          },
        ],
      });

      await prisma.evaluation_critere.createMany({
        data: [
          {
            id: "c6ee0317-2855-4b0e-ba98-277cc3d67b88",
            etape_evaluation_id: etapeAutoEvaluationId,
            critere_id: critereId,
            auteur_id: utilisateurId,
            note: 3,
            commentaire: "Critère acceptable",
          },
          {
            id: "ec47a05d-ed93-4ab8-b3e7-797c546e58b8",
            etape_evaluation_id: etapeConsolidationId,
            critere_id: critereId,
            auteur_id: utilisateurId,
            note: 4,
            commentaire: "Critère bon",
          },
          {
            id: "5a60fdf4-e7c7-4036-b4ae-2e6f389b3fa7",
            etape_evaluation_id: etapeInstructionId,
            critere_id: critereId,
            auteur_id: utilisateurId,
            note: 5,
            commentaire: "Critère excellent",
          },
        ],
      });

      // When
      const result = await query.run();

      // Then
      expect(result.criteres).toEqual([
        {
          id: critereId,
          libelle: "Critère test",
          descriptif: "Description critère test",
          type: "SIMPLIFICATION",
          sousCriteres: [],
        },
      ]);
      expect(result.fichesEvaluation).toEqual([
        {
          id: ficheEvaluationId,
          jalon: 1,
          etapeCourante: "CONSOLIDATION",
          readOnly: false,
          rattachement: {
            code: rattachementCode,
            libelle: "Rattachement test",
            groupe: "Groupe B",
            ordre: 1,
          },
          noteObjectifsCollectifs: null,
          evaluationsParCritereEtEtape: {
            [critereId]: {
              AUTO_EVALUATION: 3,
              CONSOLIDATION: 4,
              INSTRUCTION: 5,
            },
          },
          objectifs: [
            {
              id: objectifId,
              libelle: "Objectif test",
              evaluations: {
                AUTO_EVALUATION: 4,
                CONSOLIDATION: 5,
                INSTRUCTION: 3,
              },
            },
          ],
        },
      ]);
    });

    it("doit remonter tous les critères", async () => {
      // Given
      const critere1Id = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";
      const critere2Id = "b2c3d4e5-f6a7-8901-bcde-f12345678901";
      const critere3Id = "c3d4e5f6-a7b8-9012-cdef-123456789012";
      const rattachementCode = "REG-86";
      const ficheEvaluationId = "d4e5f6a7-b8c9-0123-def1-234567890123";
      const etapeEvaluationId = "e5f6a7b8-c9d0-1234-ef12-345678901234";

      await prisma.referentiel_critere.createMany({
        data: [
          {
            id: critere1Id,
            libelle: "Critère A",
            descriptif: "Description critère A",
            type: "COMMUNICATION",
          },
          {
            id: critere2Id,
            libelle: "Critère B",
            descriptif: "Description critère B",
            type: "SERVICES_PUBLICS",
          },
          {
            id: critere3Id,
            libelle: "Critère C",
            descriptif: "Description critère C",
            type: "SIMPLIFICATION",
          },
        ],
      });

      await prisma.referentiel_rattachement.create({
        data: {
          code: rattachementCode,
          groupe: "Groupe C",
          ordre: 1,
          libelle: "Rattachement critères",
        },
      });

      await prisma.fiche_evaluation.create({
        data: {
          id: ficheEvaluationId,
          jalon: 2025,
          etape_courante: "AUTO_EVALUATION",
          rattachement_code: rattachementCode,
          etape_evaluations: {
            create: {
              id: etapeEvaluationId,
              type: "AUTO_EVALUATION",
            },
          },
        },
      });

      // When
      const result = await query.run();

      // Then
      expect(result.criteres).toEqual([
        {
          id: critere1Id,
          libelle: "Critère A",
          descriptif: "Description critère A",
          type: "COMMUNICATION",
          sousCriteres: [],
        },
        {
          id: critere2Id,
          libelle: "Critère B",
          descriptif: "Description critère B",
          type: "SERVICES_PUBLICS",
          sousCriteres: [],
        },
        {
          id: critere3Id,
          libelle: "Critère C",
          descriptif: "Description critère C",
          type: "SIMPLIFICATION",
          sousCriteres: [],
        },
      ]);
      expect(result.fichesEvaluation[0].evaluationsParCritereEtEtape).toEqual({
        [critere1Id]: {
          AUTO_EVALUATION: null,
          CONSOLIDATION: null,
          INSTRUCTION: null,
        },
        [critere2Id]: {
          AUTO_EVALUATION: null,
          CONSOLIDATION: null,
          INSTRUCTION: null,
        },
        [critere3Id]: {
          AUTO_EVALUATION: null,
          CONSOLIDATION: null,
          INSTRUCTION: null,
        },
      });
    });

    it("doit remonter uniquement les objectifs liés au rattachement", async () => {
      // Given
      const critereId = "f6a7b8c9-d0e1-2345-f123-456789012345";
      const rattachement1Code = "REG-87";
      const rattachement2Code = "REG-88";
      const objectif1Id = "a7b8c9d0-e1f2-3456-1234-567890123456";
      const objectif2Id = "b8c9d0e1-f2a3-4567-2345-678901234567";
      const objectif3Id = "c9d0e1f2-a3b4-5678-3456-789012345678";
      const fiche1Id = "d0e1f2a3-b4c5-6789-4567-890123456789";
      const fiche2Id = "e1f2a3b4-c5d6-7890-5678-901234567890";
      const etapeEvaluation1Id = "f2a3b4c5-d6e7-8901-6789-012345678901";
      const etapeEvaluation2Id = "a3b4c5d6-e7f8-9012-7890-123456789012";

      await prisma.referentiel_critere.create({
        data: {
          id: critereId,
          libelle: "Critère objectifs",
          descriptif: "Description critère objectifs",
          type: "FEUILLE_DE_ROUTE",
        },
      });

      await prisma.referentiel_rattachement.create({
        data: {
          code: rattachement1Code,
          groupe: "Groupe D",
          ordre: 1,
          libelle: "Rattachement 1",
          objectifs: {
            create: [
              {
                id: objectif1Id,
                libelle: "Objectif rattachement 1 - A",
                descriptif: "Description objectif 1A",
                jalon: 2025,
                indicateur_cible: "Cible 1A",
              },
              {
                id: objectif2Id,
                libelle: "Objectif rattachement 1 - B",
                descriptif: "Description objectif 1B",
                jalon: 2025,
                indicateur_cible: "Cible 1B",
              },
            ],
          },
        },
      });

      await prisma.referentiel_rattachement.create({
        data: {
          code: rattachement2Code,
          groupe: "Groupe E",
          ordre: 1,
          libelle: "Rattachement 2",
          objectifs: {
            create: {
              id: objectif3Id,
              libelle: "Objectif rattachement 2",
              descriptif: "Description objectif 2",
              jalon: 2025,
              indicateur_cible: "Cible 2",
            },
          },
        },
      });

      await prisma.fiche_evaluation.createMany({
        data: [
          {
            id: fiche1Id,
            jalon: 2025,
            etape_courante: "AUTO_EVALUATION",
            rattachement_code: rattachement1Code,
          },
          {
            id: fiche2Id,
            jalon: 2025,
            etape_courante: "AUTO_EVALUATION",
            rattachement_code: rattachement2Code,
          },
        ],
      });

      await prisma.etape_evaluation.createMany({
        data: [
          {
            id: etapeEvaluation1Id,
            fiche_evaluation_id: fiche1Id,
            type: "AUTO_EVALUATION",
          },
          {
            id: etapeEvaluation2Id,
            fiche_evaluation_id: fiche2Id,
            type: "AUTO_EVALUATION",
          },
        ],
      });

      // When
      const result = await query.run();

      // Then
      const fiche1 = result.fichesEvaluation.find(
        (fiche) => fiche.id === fiche1Id,
      );
      const fiche2 = result.fichesEvaluation.find(
        (fiche) => fiche.id === fiche2Id,
      );

      expect(fiche1?.objectifs).toEqual([
        {
          id: objectif1Id,
          libelle: "Objectif rattachement 1 - A",
          evaluations: {
            AUTO_EVALUATION: null,
            CONSOLIDATION: null,
            INSTRUCTION: null,
          },
        },
        {
          id: objectif2Id,
          libelle: "Objectif rattachement 1 - B",
          evaluations: {
            AUTO_EVALUATION: null,
            CONSOLIDATION: null,
            INSTRUCTION: null,
          },
        },
      ]);

      expect(fiche2?.objectifs).toEqual([
        {
          id: objectif3Id,
          libelle: "Objectif rattachement 2",
          evaluations: {
            AUTO_EVALUATION: null,
            CONSOLIDATION: null,
            INSTRUCTION: null,
          },
        },
      ]);
    });

    it("doit retourner des listes vides quand aucune fiche ni critère n'existe", async () => {
      // When
      const result = await query.run();

      // Then
      expect(result.criteres).toEqual([]);
      expect(result.fichesEvaluation).toEqual([]);
    });

    it("doit ordonner les fiches par groupe puis par ordre du rattachement", async () => {
      // Given
      const critereId = "b4c5d6e7-f8a9-0123-8901-234567890123";
      const rattachement1Code = "REG-01";
      const rattachement2Code = "REG-02";
      const rattachement3Code = "REG-03";
      const rattachement4Code = "REG-04";
      const fiche1Id = "c5d6e7f8-a9b0-1234-9012-345678901234";
      const fiche2Id = "d6e7f8a9-b0c1-2345-0123-456789012345";
      const fiche3Id = "e7f8a9b0-c1d2-3456-1234-567890123456";
      const fiche4Id = "f8a9b0c1-d2e3-4567-2345-678901234567";

      await prisma.referentiel_critere.create({
        data: {
          id: critereId,
          libelle: "Critère ordre",
          descriptif: "Description critère ordre",
          type: "COMMUNICATION",
        },
      });

      await prisma.referentiel_rattachement.createMany({
        data: [
          {
            code: rattachement1Code,
            groupe: "Groupe B",
            ordre: 2,
            libelle: "Rattachement B2",
          },
          {
            code: rattachement2Code,
            groupe: "Groupe A",
            ordre: 2,
            libelle: "Rattachement A2",
          },
          {
            code: rattachement3Code,
            groupe: "Groupe B",
            ordre: 1,
            libelle: "Rattachement B1",
          },
          {
            code: rattachement4Code,
            groupe: "Groupe A",
            ordre: 1,
            libelle: "Rattachement A1",
          },
        ],
      });

      await prisma.fiche_evaluation.createMany({
        data: [
          {
            id: fiche1Id,
            jalon: 2025,
            etape_courante: "AUTO_EVALUATION",
            rattachement_code: rattachement1Code,
          },
          {
            id: fiche2Id,
            jalon: 2025,
            etape_courante: "AUTO_EVALUATION",
            rattachement_code: rattachement2Code,
          },
          {
            id: fiche3Id,
            jalon: 2025,
            etape_courante: "AUTO_EVALUATION",
            rattachement_code: rattachement3Code,
          },
          {
            id: fiche4Id,
            jalon: 2025,
            etape_courante: "AUTO_EVALUATION",
            rattachement_code: rattachement4Code,
          },
        ],
      });

      // When
      const result = await query.run();

      // Then
      expect(result.fichesEvaluation.map((fiche) => fiche.id)).toEqual([
        fiche4Id,
        fiche2Id,
        fiche3Id,
        fiche1Id,
      ]);
      expect(
        result.fichesEvaluation.map((fiche) => fiche.rattachement),
      ).toEqual([
        {
          code: rattachement4Code,
          libelle: "Rattachement A1",
          groupe: "Groupe A",
          ordre: 1,
        },
        {
          code: rattachement2Code,
          libelle: "Rattachement A2",
          groupe: "Groupe A",
          ordre: 2,
        },
        {
          code: rattachement3Code,
          libelle: "Rattachement B1",
          groupe: "Groupe B",
          ordre: 1,
        },
        {
          code: rattachement1Code,
          libelle: "Rattachement B2",
          groupe: "Groupe B",
          ordre: 2,
        },
      ]);
    });

    it("doit calculer la noteObjectifsCollectifs comme moyenne des taux d'avancement des chantiers", async () => {
      // Given
      const critereId = "8a9b0c1d-2e3f-4567-8901-234567890123";
      const rattachementCode = "DEPT-91";
      const ficheEvaluationId = "9b0c1d2e-3f4a-5678-9012-345678901234";
      const jalon = 2025;

      await prisma.ministere.create({
        data: {
          id: "MIN-TEST",
          acronyme: "TEST",
          nom: "Ministère Test",
          icone: "icone-test.svg",
        },
      });

      await prisma.referentiel_critere.create({
        data: {
          id: critereId,
          libelle: "Critère test objectifs collectifs",
          descriptif: "Description critère test",
          type: "SERVICES_PUBLICS",
        },
      });

      await prisma.referentiel_rattachement.create({
        data: {
          code: rattachementCode,
          groupe: "Groupe Test",
          ordre: 1,
          libelle: "Rattachement Test",
        },
      });

      await prisma.chantier_identite.createMany({
        data: [
          {
            id: "CH-201",
            nom: "Chantier Test 1",
            ministeres: ["MIN-TEST"],
          },
          {
            id: "CH-202",
            nom: "Chantier Test 2",
            ministeres: ["MIN-TEST"],
          },
          {
            id: "CH-203",
            nom: "Chantier Test 3",
            ministeres: ["MIN-TEST"],
          },
        ],
      });

      await prisma.fiche_evaluation.create({
        data: {
          id: ficheEvaluationId,
          jalon: jalon,
          etape_courante: "AUTO_EVALUATION",
          rattachement_code: rattachementCode,
        },
      });

      await prisma.chantier_territoire.createMany({
        data: [
          {
            id: "CH-201",
            territoire_code: rattachementCode,
            code_insee: "91",
            maille: "DEPT",
            zone_id: "zone-test",
          },
          {
            id: "CH-202",
            territoire_code: rattachementCode,
            code_insee: "91",
            maille: "DEPT",
            zone_id: "zone-test",
          },
          {
            id: "CH-203",
            territoire_code: rattachementCode,
            code_insee: "91",
            maille: "DEPT",
            zone_id: "zone-test",
          },
        ],
      });

      await prisma.chantier_territoire_jalon.createMany({
        data: [
          {
            id: "CH-201",
            territoire_code: rattachementCode,
            code_insee: "91",
            maille: "DEPT",
            zone_id: "zone-test",
            jalon: jalon,
          },
          {
            id: "CH-202",
            territoire_code: rattachementCode,
            code_insee: "91",
            maille: "DEPT",
            zone_id: "zone-test",
            jalon: jalon,
          },
          {
            id: "CH-203",
            territoire_code: rattachementCode,
            code_insee: "91",
            maille: "DEPT",
            zone_id: "zone-test",
            jalon: jalon,
          },
        ],
      });

      await prisma.chantier_evaluation.createMany({
        data: [
          {
            id: "CH-201",
            territoire_code: rattachementCode,
            code_insee: "91",
            maille: "DEPT",
            zone_id: "zone-test",
            taux_avancement: 70.0,
            date_calcul: new Date("2025-02-15"),
            jalon: jalon,
          },
          {
            id: "CH-202",
            territoire_code: rattachementCode,
            code_insee: "91",
            maille: "DEPT",
            zone_id: "zone-test",
            taux_avancement: 80.0,
            date_calcul: new Date("2025-02-15"),
            jalon: jalon,
          },
          {
            id: "CH-203",
            territoire_code: rattachementCode,
            code_insee: "91",
            maille: "DEPT",
            zone_id: "zone-test",
            taux_avancement: null,
            date_calcul: new Date("2025-02-15"),
            jalon: jalon,
          },
        ],
      });

      // When
      const result = await query.run();

      // Then
      const ficheResult = result.fichesEvaluation.find(
        (fiche) => fiche.id === ficheEvaluationId,
      );
      expect(ficheResult?.noteObjectifsCollectifs).toEqual(75);
    });
  });
});
