import { $Enums } from "@prisma/client";
import { ListerFichesEvaluationParPhaseQuery } from "@/server/evaluation/queries/ListerFichesEvaluationParPhaseQuery";
import { PrismaPilote } from "@/server/db/PrismaPilote";
import { prisma } from "@/server/db/prisma";

describe("ListerFichesEvaluationParPhaseQuery", () => {
  let query: ListerFichesEvaluationParPhaseQuery;
  const prismaPilote = new PrismaPilote();

  beforeEach(() => {
    query = new ListerFichesEvaluationParPhaseQuery({ prisma: prismaPilote });
  });

  describe("run", () => {
    it("doit retourner les fiches groupées par groupe de rattachement puis par phase", async () => {
      const utilisateurId = "367cb1fd-04a0-4862-9ab1-cf7be78ef853";
      const regGroupeCode = "REG-01";
      const deptGroupeCode = "DEPT-01";

      const regRattachementCode = "REG-02";
      const deptRattachementCode = "DEPT-02";

      const ficheAutoEval1Id = "b72e9d27-6241-4d83-a647-01dd86d24ba2";
      const ficheAutoEval2Id = "b306da42-3cc4-46f1-a2c6-c5a61acecb33";
      const ficheConsolidationId = "195ad915-c3f6-4961-bffd-ac735dcc4a59";

      await prisma.utilisateur.create({
        data: {
          id: utilisateurId,
          email: "user-grouped@example.com",
          nom: "UserGrouped",
          prenom: "Test",
          date_creation: new Date(),
          profilCode: "DITP_ADMIN",
        },
      });

      await prisma.referentiel_rattachement.createMany({
        data: [
          {
            code: regGroupeCode,
            groupe: regGroupeCode,
            ordre: 0,
            libelle: "Région 01",
          },
          {
            code: regRattachementCode,
            groupe: regGroupeCode,
            ordre: 1,
            libelle: "Région 02",
          },
          {
            code: deptGroupeCode,
            groupe: deptGroupeCode,
            ordre: 0,
            libelle: "Département 01",
          },
          {
            code: deptRattachementCode,
            groupe: deptGroupeCode,
            ordre: 1,
            libelle: "Département 02",
          },
        ],
      });

      await prisma.rattachement_utilisateur_etape_jalon.createMany({
        data: [
          {
            id: "5905f2ea-724b-4411-a572-7a91d6128657",
            rattachement_code: regGroupeCode,
            utilisateur_id: utilisateurId,
            etape: $Enums.etape_evaluation_enum.CONSOLIDATION,
            jalon: 2025,
          },
          {
            id: "977fccfb-4e43-4a35-a4f3-db8ea66a261d",
            rattachement_code: regRattachementCode,
            utilisateur_id: utilisateurId,
            etape: $Enums.etape_evaluation_enum.CONSOLIDATION,
            jalon: 2025,
          },
          {
            id: "42ec64ca-b3dd-4a34-a8e3-fb9f9c48dec1",
            rattachement_code: deptGroupeCode,
            utilisateur_id: utilisateurId,
            etape: $Enums.etape_evaluation_enum.CONSOLIDATION,
            jalon: 2025,
          },
          {
            id: "11cafdec-49ac-4ca4-bb12-c6a882079ba9",
            rattachement_code: deptRattachementCode,
            utilisateur_id: utilisateurId,
            etape: $Enums.etape_evaluation_enum.CONSOLIDATION,
            jalon: 2025,
          },
        ],
      });

      await prisma.fiche_evaluation.create({
        data: {
          id: ficheAutoEval1Id,
          jalon: 2025,
          etape_courante: $Enums.etape_evaluation_enum.AUTO_EVALUATION,
          rattachement_code: regGroupeCode,
          etape_evaluations: {
            create: {
              id: "ac3157dc-81cd-4394-a9ba-00d6e42af11f",
              type: $Enums.etape_evaluation_enum.AUTO_EVALUATION,
            },
          },
        },
      });

      await prisma.fiche_evaluation.create({
        data: {
          id: ficheAutoEval2Id,
          jalon: 2025,
          etape_courante: $Enums.etape_evaluation_enum.AUTO_EVALUATION,
          rattachement_code: regRattachementCode,
          etape_evaluations: {
            create: {
              id: "fe910817-3175-45be-b013-3f12d274d479",
              type: $Enums.etape_evaluation_enum.AUTO_EVALUATION,
            },
          },
        },
      });

      await prisma.fiche_evaluation.create({
        data: {
          id: ficheConsolidationId,
          jalon: 2025,
          etape_courante: $Enums.etape_evaluation_enum.CONSOLIDATION,
          rattachement_code: deptRattachementCode,
          etape_evaluations: {
            create: {
              id: "b33de04e-c083-4f5a-8eac-bbb909bb64b5",
              type: $Enums.etape_evaluation_enum.CONSOLIDATION,
            },
          },
        },
      });

      const result = await query.run({ utilisateurId });

      expect(result).toEqual({
        "Département 01": {
          [$Enums.etape_evaluation_enum.AUTO_EVALUATION]: [],
          [$Enums.etape_evaluation_enum.CONSOLIDATION]: [
            {
              id: ficheConsolidationId,
              etapeCourante: $Enums.etape_evaluation_enum.CONSOLIDATION,
              readOnly: false,
              isObjectifsValides: true,
              isCriteresValides: true,
              rattachement: {
                code: deptRattachementCode,
                libelle: "Département 02",
              },
              objectifs: {
                moyenne: null,
                moyennesParPhase: {
                  [$Enums.etape_evaluation_enum.CONSOLIDATION]: null,
                },
                nombreNotes: 0,
                nombreTotal: 0,
                nombreTraites: 0,
              },
              criteres: {
                moyenne: null,
                moyennesParPhase: {
                  [$Enums.etape_evaluation_enum.CONSOLIDATION]: null,
                },
                nombreNotes: 0,
                nombreTotal: 0,
                nombreTraites: 0,
              },
              noteCollective: null,
            },
          ],
          [$Enums.etape_evaluation_enum.INSTRUCTION]: [],
        },
      });
    });

    it("ne doit retourner que les fiches pour lesquelles l'utilisateur a des permissions", async () => {
      const utilisateurAvecPermissionId =
        "5ad20671-6d49-452d-b366-f5b97422a320";
      const utilisateurSansPermissionId =
        "de00f98c-9586-46b7-8946-d887a0b943a9";
      const rattachementCode = "REG-10";
      const ficheId = "ed220ce5-28d7-46ad-9e96-c1b5f39fe57d";

      await prisma.utilisateur.createMany({
        data: [
          {
            id: utilisateurAvecPermissionId,
            email: "user-with-perm-phases@example.com",
            nom: "UserWithPerm",
            prenom: "Test",
            date_creation: new Date(),
            profilCode: "DITP_ADMIN",
          },
          {
            id: utilisateurSansPermissionId,
            email: "user-no-perm-phases@example.com",
            nom: "UserNoPerm",
            prenom: "Test",
            date_creation: new Date(),
            profilCode: "DITP_ADMIN",
          },
        ],
      });

      await prisma.referentiel_rattachement.create({
        data: {
          code: rattachementCode,
          groupe: rattachementCode,
          ordre: 1,
          libelle: "Région restreinte",
        },
      });

      await prisma.rattachement_utilisateur_etape_jalon.create({
        data: {
          id: "29b0c9e5-b60e-441d-8ebf-215f67e26045",
          rattachement_code: rattachementCode,
          utilisateur_id: utilisateurAvecPermissionId,
          etape: $Enums.etape_evaluation_enum.CONSOLIDATION,
          jalon: 2025,
        },
      });

      await prisma.fiche_evaluation.create({
        data: {
          id: ficheId,
          jalon: 2025,
          etape_courante: $Enums.etape_evaluation_enum.AUTO_EVALUATION,
          rattachement_code: rattachementCode,
          etape_evaluations: {
            create: {
              id: "66ee1a7b-0780-4288-a7ca-46328bdfe067",
              type: $Enums.etape_evaluation_enum.AUTO_EVALUATION,
            },
          },
        },
      });

      const resultSansPermission = await query.run({
        utilisateurId: utilisateurSansPermissionId,
      });
      const resultAvecPermission = await query.run({
        utilisateurId: utilisateurAvecPermissionId,
      });

      expect(resultSansPermission).toEqual({});
      expect(resultAvecPermission).toEqual({});
    });

    it("doit calculer la note collective à partir des chantiers_evaluation de la dernière date_calcul", async () => {
      const utilisateurId = "14fb275c-328f-4189-ae1e-f94176335b5c";
      const rattachementCode = "REG-20";
      const ficheId = "e4725255-1327-494f-acbe-22ebc1d27ad4";

      await prisma.chantier_identite.createMany({
        data: [
          {
            id: "CH-NC-001",
            nom: "Chantier NC 1",
          },
          {
            id: "CH-NC-002",
            nom: "Chantier NC 2",
          },
        ],
      });

      await prisma.utilisateur.create({
        data: {
          id: utilisateurId,
          email: "user-nc-phases@example.com",
          nom: "UserNC",
          prenom: "Test",
          date_creation: new Date(),
          profilCode: "DITP_ADMIN",
        },
      });

      await prisma.referentiel_rattachement.create({
        data: {
          code: rattachementCode,
          groupe: rattachementCode,
          ordre: 1,
          libelle: "Région avec note collective",
        },
      });

      await prisma.rattachement_utilisateur_etape_jalon.create({
        data: {
          id: "977fc894-5663-4471-b57b-b69a0199a382",
          rattachement_code: rattachementCode,
          utilisateur_id: utilisateurId,
          etape: $Enums.etape_evaluation_enum.CONSOLIDATION,
          jalon: 2025,
        },
      });

      await prisma.fiche_evaluation.create({
        data: {
          id: ficheId,
          jalon: 2025,
          etape_courante: $Enums.etape_evaluation_enum.INSTRUCTION,
          rattachement_code: rattachementCode,
          etape_evaluations: {
            create: {
              id: "d0148dd7-0ecc-4800-a65d-7c24732b6964",
              type: $Enums.etape_evaluation_enum.INSTRUCTION,
            },
          },
        },
      });

      await prisma.chantier_evaluation.createMany({
        data: [
          {
            id: "CH-NC-001",
            territoire_code: rattachementCode,
            code_insee: "75",
            maille: "DEPT",
            zone_id: "zone-nc-1",
            taux_avancement: 50,
            date_calcul: new Date("2025-01-10"),
            jalon: 2025,
          },
          {
            id: "CH-NC-002",
            territoire_code: rattachementCode,
            code_insee: "75",
            maille: "DEPT",
            zone_id: "zone-nc-1",
            taux_avancement: 60,
            date_calcul: new Date("2025-01-10"),
            jalon: 2025,
          },
          {
            id: "CH-NC-001",
            territoire_code: rattachementCode,
            code_insee: "75",
            maille: "DEPT",
            zone_id: "zone-nc-1",
            taux_avancement: 70,
            date_calcul: new Date("2025-01-15"),
            jalon: 2025,
          },
          {
            id: "CH-NC-002",
            territoire_code: rattachementCode,
            code_insee: "75",
            maille: "DEPT",
            zone_id: "zone-nc-1",
            taux_avancement: 90,
            date_calcul: new Date("2025-01-15"),
            jalon: 2025,
          },
        ],
      });

      const result = await query.run({ utilisateurId });

      expect(
        result["Région avec note collective"][
          $Enums.etape_evaluation_enum.INSTRUCTION
        ],
      ).toEqual([
        {
          id: ficheId,
          etapeCourante: $Enums.etape_evaluation_enum.INSTRUCTION,
          readOnly: false,
          isObjectifsValides: true,
          isCriteresValides: true,
          rattachement: {
            code: rattachementCode,
            libelle: "Région avec note collective",
          },
          objectifs: {
            moyenne: null,
            moyennesParPhase: {
              [$Enums.etape_evaluation_enum.INSTRUCTION]: null,
            },
            nombreNotes: 0,
            nombreTotal: 0,
            nombreTraites: 0,
          },
          criteres: {
            moyenne: null,
            moyennesParPhase: {
              [$Enums.etape_evaluation_enum.INSTRUCTION]: null,
            },
            nombreNotes: 0,
            nombreTotal: 0,
            nombreTraites: 0,
          },
          noteCollective: 80,
        },
      ]);
    });

    it("doit inclure les moyennes de toutes les phases précédentes dans moyennesParPhase", async () => {
      const utilisateurId = "bbda7822-0401-4200-9c8a-50717004eadb";
      const rattachementCode = "REG-50";
      const ficheId = "33cd70fb-b632-4ad2-bc92-de4e62aa7141";

      await prisma.utilisateur.create({
        data: {
          id: utilisateurId,
          email: "user-moyennes-phases@example.com",
          nom: "UserMoyennes",
          prenom: "Test",
          date_creation: new Date(),
          profilCode: "DITP_ADMIN",
        },
      });

      await prisma.referentiel_rattachement.create({
        data: {
          code: rattachementCode,
          groupe: rattachementCode,
          ordre: 1,
          libelle: "Région moyennes phases",
        },
      });

      await prisma.rattachement_utilisateur_etape_jalon.create({
        data: {
          id: "7118afff-72bf-48e7-a3b7-d0060dcb00bf",
          rattachement_code: rattachementCode,
          utilisateur_id: utilisateurId,
          etape: $Enums.etape_evaluation_enum.CONSOLIDATION,
          jalon: 2025,
        },
      });

      const objectif1Id = "bce9ed29-50c0-4acc-b16f-d78ff9301df2";
      const objectif2Id = "f34b3af5-7c58-4c92-9091-c888ff845660";
      const critereId = "97aac51b-70d6-4128-97b6-747c5a89bb99";

      await prisma.referentiel_objectif.createMany({
        data: [
          {
            id: objectif1Id,
            descriptif: "objectif 1",
            jalon: 2025,
            rattachement_code: rattachementCode,
            libelle: "Objectif 1",
          },
          {
            id: objectif2Id,
            descriptif: "objectif 2",
            jalon: 2025,
            rattachement_code: rattachementCode,
            libelle: "Objectif 2",
          },
        ],
      });

      await prisma.referentiel_critere.create({
        data: {
          id: critereId,
          descriptif: "Critère 2",
          libelle: "Critère 1",
        },
      });

      await prisma.fiche_evaluation.create({
        data: {
          id: ficheId,
          jalon: 2025,
          etape_courante: $Enums.etape_evaluation_enum.CONSOLIDATION,
          rattachement_code: rattachementCode,
          etape_evaluations: {
            create: [
              {
                id: "929972cf-70c5-4621-9f17-d49dff835cba",
                type: $Enums.etape_evaluation_enum.AUTO_EVALUATION,
                evaluations_objectifs: {
                  create: [
                    {
                      id: "b5246338-9cbe-4995-95ac-387b09193d2f",
                      commentaire: "Un commentaire",
                      auteur_id: utilisateurId,
                      objectif_id: objectif1Id,
                      note: 10,
                    },
                    {
                      id: "f9af13f1-7f4f-4919-9568-377002034086",
                      commentaire: "Un commentaire",
                      auteur_id: utilisateurId,
                      objectif_id: objectif2Id,
                      note: 20,
                    },
                  ],
                },
                evaluations_criteres: {
                  create: [
                    {
                      id: "b3925cef-460d-4915-9b3f-9b849d9bd02f",
                      commentaire: "Un commentaire",
                      auteur_id: utilisateurId,
                      critere_id: critereId,
                      note: 15,
                    },
                  ],
                },
              },
              {
                id: "32a89257-7bee-410a-aecb-5d19d6a60373",
                type: $Enums.etape_evaluation_enum.CONSOLIDATION,
                evaluations_objectifs: {
                  create: [
                    {
                      id: "81b914ac-ae3a-4ade-a204-32dd2eec57be",
                      commentaire: "Un commentaire",
                      auteur_id: utilisateurId,
                      objectif_id: objectif1Id,
                      note: 30,
                    },
                    {
                      id: "b693e742-81ad-417f-8dca-91722954db99",
                      commentaire: "Un commentaire",
                      auteur_id: utilisateurId,
                      objectif_id: objectif2Id,
                      note: 40,
                    },
                  ],
                },
                evaluations_criteres: {
                  create: [
                    {
                      id: "f9b1d396-cd59-4b43-b4a5-e64eea0b3f74",
                      commentaire: "Un commentaire",
                      auteur_id: utilisateurId,
                      critere_id: critereId,
                      note: 25,
                      date_traitement: new Date(),
                    },
                  ],
                },
              },
            ],
          },
        },
      });

      const result = await query.run({ utilisateurId });

      expect(
        result["Région moyennes phases"][
          $Enums.etape_evaluation_enum.CONSOLIDATION
        ],
      ).toEqual([
        {
          id: ficheId,
          etapeCourante: $Enums.etape_evaluation_enum.CONSOLIDATION,
          isObjectifsValides: false,
          isCriteresValides: true,
          readOnly: false,
          rattachement: {
            code: rattachementCode,
            libelle: "Région moyennes phases",
          },
          objectifs: {
            moyenne: 35,
            moyennesParPhase: {
              [$Enums.etape_evaluation_enum.CONSOLIDATION]: 35,
            },
            nombreNotes: 2,
            nombreTotal: 2,
            nombreTraites: 0,
          },
          criteres: {
            moyenne: 25,
            moyennesParPhase: {
              [$Enums.etape_evaluation_enum.CONSOLIDATION]: 25,
            },
            nombreNotes: 1,
            nombreTotal: 1,
            nombreTraites: 1,
          },
          noteCollective: null,
        },
      ]);
    });

    it("ne doit retourner une fiche que dans la phase correspondant à son etape_courante, même si l'utilisateur a des permissions pour plusieurs phases", async () => {
      const utilisateurId = "9744ab67-996a-43bf-bec5-54bbe39c5a57";
      const rattachementCode = "REG-40";
      const ficheId = "0287810b-8f94-4e43-9ff2-7c57d369c86b";

      await prisma.utilisateur.create({
        data: {
          id: utilisateurId,
          email: "user-multi-phases@example.com",
          nom: "UserMultiPhases",
          prenom: "Test",
          date_creation: new Date(),
          profilCode: "DITP_ADMIN",
        },
      });

      await prisma.referentiel_rattachement.create({
        data: {
          code: rattachementCode,
          groupe: rattachementCode,
          ordre: 1,
          libelle: "Région multi-phases",
        },
      });

      await prisma.rattachement_utilisateur_etape_jalon.create({
        data: {
          id: "110852f6-b032-4ec2-9f94-4671ae300079",
          rattachement_code: rattachementCode,
          utilisateur_id: utilisateurId,
          etape: $Enums.etape_evaluation_enum.CONSOLIDATION,
          jalon: 2025,
        },
      });

      await prisma.fiche_evaluation.create({
        data: {
          id: ficheId,
          jalon: 2025,
          etape_courante: $Enums.etape_evaluation_enum.AUTO_EVALUATION,
          rattachement_code: rattachementCode,
          etape_evaluations: {
            create: [
              {
                id: "e563f605-2d87-4303-84f0-eb3e17b62b67",
                type: $Enums.etape_evaluation_enum.AUTO_EVALUATION,
              },
              {
                id: "d5fbb75e-e792-48a8-a7cd-a27b850f4604",
                type: $Enums.etape_evaluation_enum.CONSOLIDATION,
              },
            ],
          },
        },
      });

      const result = await query.run({ utilisateurId });

      expect(result).toEqual({});
    });

    it("doit ordonner les fiches par ordre du rattachement dans chaque groupe", async () => {
      const utilisateurId = "5a7e9dec-8328-44bf-a7fd-c362592aab7d";
      const groupeCode = "REG-30";
      const rattachement1Code = "REG-30-01";
      const rattachement2Code = "REG-30-02";
      const rattachement3Code = "REG-30-03";
      const ficheId1 = "d28f8a85-4758-4515-9036-1213e2d5997b";
      const ficheId2 = "192b7051-2eb0-4a04-9e18-e60f41d592b2";
      const ficheId3 = "b937d2fb-47fe-4e25-a9e2-41f2b9ef8f79";

      await prisma.utilisateur.create({
        data: {
          id: utilisateurId,
          email: "user-ordered@example.com",
          nom: "UserOrdered",
          prenom: "Test",
          date_creation: new Date(),
          profilCode: "DITP_ADMIN",
        },
      });

      await prisma.referentiel_rattachement.createMany({
        data: [
          {
            code: groupeCode,
            groupe: groupeCode,
            ordre: 0,
            libelle: "Région 30",
          },
          {
            code: rattachement1Code,
            groupe: groupeCode,
            ordre: 3,
            libelle: "Rattachement ordre 3",
          },
          {
            code: rattachement2Code,
            groupe: groupeCode,
            ordre: 1,
            libelle: "Rattachement ordre 1",
          },
          {
            code: rattachement3Code,
            groupe: groupeCode,
            ordre: 2,
            libelle: "Rattachement ordre 2",
          },
        ],
      });

      await prisma.rattachement_utilisateur_etape_jalon.createMany({
        data: [
          {
            id: "71e1c6e8-8da1-445c-a64a-221de179cb43",
            rattachement_code: rattachement1Code,
            utilisateur_id: utilisateurId,
            etape: $Enums.etape_evaluation_enum.CONSOLIDATION,
            jalon: 2025,
          },
          {
            id: "34d08d8b-1ec8-47b4-8a0c-980c6a2c3502",
            rattachement_code: rattachement2Code,
            utilisateur_id: utilisateurId,
            etape: $Enums.etape_evaluation_enum.CONSOLIDATION,
            jalon: 2025,
          },
          {
            id: "04a0d908-8154-4b28-bc21-34b0d6c46010",
            rattachement_code: rattachement3Code,
            utilisateur_id: utilisateurId,
            etape: $Enums.etape_evaluation_enum.CONSOLIDATION,
            jalon: 2025,
          },
        ],
      });

      await prisma.fiche_evaluation.createMany({
        data: [
          {
            id: ficheId1,
            jalon: 2025,
            etape_courante: $Enums.etape_evaluation_enum.AUTO_EVALUATION,
            rattachement_code: rattachement1Code,
          },
          {
            id: ficheId2,
            jalon: 2025,
            etape_courante: $Enums.etape_evaluation_enum.AUTO_EVALUATION,
            rattachement_code: rattachement2Code,
          },
          {
            id: ficheId3,
            jalon: 2025,
            etape_courante: $Enums.etape_evaluation_enum.AUTO_EVALUATION,
            rattachement_code: rattachement3Code,
          },
        ],
      });

      await prisma.etape_evaluation.createMany({
        data: [
          {
            id: "531baee1-d850-4159-a57e-b27aecedfb69",
            fiche_evaluation_id: ficheId1,
            type: $Enums.etape_evaluation_enum.AUTO_EVALUATION,
          },
          {
            id: "f6432d95-b021-4a6e-abd8-1b89bf1c5af5",
            fiche_evaluation_id: ficheId2,
            type: $Enums.etape_evaluation_enum.AUTO_EVALUATION,
          },
          {
            id: "5ecb1121-2465-4123-893b-496c28270635",
            fiche_evaluation_id: ficheId3,
            type: $Enums.etape_evaluation_enum.AUTO_EVALUATION,
          },
        ],
      });

      const result = await query.run({ utilisateurId });

      expect(result).toEqual({});
    });

    it("ne doit pas inclure les évaluations AUTO_EVALUATION dans les moyennesParPhase ni dans le calcul des notes", async () => {
      const utilisateurId = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";
      const rattachementCode = "REG-60";
      const ficheId = "59cdb7c8-4f5a-4d72-bd21-fd67342c8d69";

      await prisma.utilisateur.create({
        data: {
          id: utilisateurId,
          email: "user-auto-eval-filter@example.com",
          nom: "UserAutoEvalFilter",
          prenom: "Test",
          date_creation: new Date(),
          profilCode: "DITP_ADMIN",
        },
      });

      await prisma.referentiel_rattachement.create({
        data: {
          code: rattachementCode,
          groupe: rattachementCode,
          ordre: 1,
          libelle: "Région test auto-évaluation",
        },
      });

      await prisma.rattachement_utilisateur_etape_jalon.create({
        data: {
          id: "46c5169b-7236-42e2-8787-81bf532080a5",
          rattachement_code: rattachementCode,
          utilisateur_id: utilisateurId,
          etape: $Enums.etape_evaluation_enum.CONSOLIDATION,
          jalon: 2025,
        },
      });

      const objectifId = "ac3eae3d-ca09-4353-b0cd-6797a2bb59dd";
      const critereId = "4419e3ad-7dcd-4c5f-b90a-8137f2ec7ffc";

      await prisma.referentiel_objectif.create({
        data: {
          id: objectifId,
          descriptif: "objectif test",
          jalon: 2025,
          rattachement_code: rattachementCode,
          libelle: "Objectif test",
        },
      });

      await prisma.referentiel_critere.create({
        data: {
          id: critereId,
          descriptif: "Critère test",
          libelle: "Critère test",
        },
      });

      await prisma.fiche_evaluation.create({
        data: {
          id: ficheId,
          jalon: 2025,
          etape_courante: $Enums.etape_evaluation_enum.CONSOLIDATION,
          rattachement_code: rattachementCode,
          etape_evaluations: {
            create: [
              {
                id: "072298ed-3d75-4edd-bd83-dbe6f5bfd1cb",
                type: $Enums.etape_evaluation_enum.AUTO_EVALUATION,
                evaluations_objectifs: {
                  create: [
                    {
                      id: "dfcded76-c476-4743-8031-c818567289a5",
                      commentaire: "Note auto-évaluation",
                      auteur_id: utilisateurId,
                      objectif_id: objectifId,
                      note: 50,
                    },
                  ],
                },
                evaluations_criteres: {
                  create: [
                    {
                      id: "9efa0d00-7160-49ba-88a3-dfdb9760e430",
                      commentaire: "Note auto-évaluation",
                      auteur_id: utilisateurId,
                      critere_id: critereId,
                      note: 60,
                    },
                  ],
                },
              },
              {
                id: "5fab71fa-3153-462b-a7d8-c2090be27384",
                type: $Enums.etape_evaluation_enum.CONSOLIDATION,
                evaluations_objectifs: {
                  create: [
                    {
                      id: "4681b49e-6eac-4f40-b986-97e00286edef",
                      commentaire: "Note consolidation",
                      auteur_id: utilisateurId,
                      objectif_id: objectifId,
                      note: 70,
                      date_traitement: new Date(),
                    },
                  ],
                },
                evaluations_criteres: {
                  create: [
                    {
                      id: "7924a508-b255-43ac-bd9e-b7b27f39804b",
                      commentaire: "Note consolidation",
                      auteur_id: utilisateurId,
                      critere_id: critereId,
                      note: 80,
                      date_traitement: new Date(),
                    },
                  ],
                },
              },
            ],
          },
        },
      });

      const result = await query.run({ utilisateurId });

      expect(
        result["Région test auto-évaluation"][
          $Enums.etape_evaluation_enum.CONSOLIDATION
        ],
      ).toEqual([
        {
          id: ficheId,
          etapeCourante: $Enums.etape_evaluation_enum.CONSOLIDATION,
          isObjectifsValides: true,
          isCriteresValides: true,
          readOnly: false,
          rattachement: {
            code: rattachementCode,
            libelle: "Région test auto-évaluation",
          },
          objectifs: {
            moyenne: 70,
            moyennesParPhase: {
              [$Enums.etape_evaluation_enum.CONSOLIDATION]: 70,
            },
            nombreNotes: 1,
            nombreTotal: 1,
            nombreTraites: 1,
          },
          criteres: {
            moyenne: 80,
            moyennesParPhase: {
              [$Enums.etape_evaluation_enum.CONSOLIDATION]: 80,
            },
            nombreNotes: 1,
            nombreTotal: 1,
            nombreTraites: 1,
          },
          noteCollective: null,
        },
      ]);
    });
  });
});
