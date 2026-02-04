import { createIntegrationTest } from "@/server/infrastructure/test/createIntegrationTest";
import { fixtures } from "@/server/infrastructure/test/fixtures";
import { PrismaPilote } from "@/server/db/PrismaPilote";
import { PrismaUtilisateursQuery } from "@/server/gestion-utilisateur/infrastructure/queries/PrismaUtilisateursQuery";

describe("PrismaUtilisateursQuery", () => {
  let query: PrismaUtilisateursQuery;
  const prismaPilote = new PrismaPilote();

  beforeEach(() => {
    query = new PrismaUtilisateursQuery({ prisma: prismaPilote });
  });

  describe("recupererParProfils", () => {
    it(
      "retourne l'utilisateur avec son territoire sans enfants",
      createIntegrationTest(async () => {
        // Given
        const territoire = await fixtures.territoire({
          code: "DEPT-99",
          nom: "Département Test",
          maille: "DEPT",
        });

        const utilisateur = await fixtures.utilisateur({
          profilCode: "PREFET_DEPARTEMENT",
        });

        await fixtures.habilitation({
          utilisateurId: utilisateur.id,
          territoires: [territoire.code],
        });

        // When
        const result = await query.recupererParProfils(["PREFET_DEPARTEMENT"]);

        // Then
        expect(result).toEqual([
          {
            id: utilisateur.id,
            email: utilisateur.email,
            nom: utilisateur.nom,
            prenom: utilisateur.prenom,
            profilCode: "PREFET_DEPARTEMENT",
            territoires: [
              {
                code: "DEPT-99",
                nom: "Département Test",
                maille: "DEPT",
                enfants: [],
              },
            ],
            chantiers: [],
            perimetres: [],
          },
        ]);
      }),
    );

    it(
      "retourne l'utilisateur avec le territoire REG et ses enfants DEPT",
      createIntegrationTest(async () => {
        // Given
        const territoireReg = await fixtures.territoire({
          code: "REG-99",
          nom: "Région Test",
          maille: "REG",
        });

        const territoireDept98 = await fixtures.territoire({
          code: "DEPT-98",
          nom: "Département Test 1",
          maille: "DEPT",
          code_parent: territoireReg.code,
        });

        const territoireDept97 = await fixtures.territoire({
          code: "DEPT-97",
          nom: "Département Test 2",
          maille: "DEPT",
          code_parent: territoireReg.code,
        });

        const utilisateur = await fixtures.utilisateur({
          profilCode: "COORDINATEUR_REGION",
        });

        await fixtures.habilitation({
          utilisateurId: utilisateur.id,
          territoires: [territoireReg.code],
        });

        // When
        const result = await query.recupererParProfils(["COORDINATEUR_REGION"]);

        // Then
        expect(result).toEqual([
          {
            id: utilisateur.id,
            email: utilisateur.email,
            nom: utilisateur.nom,
            prenom: utilisateur.prenom,
            profilCode: "COORDINATEUR_REGION",
            territoires: [
              {
                code: "REG-99",
                nom: "Région Test",
                maille: "REG",
                enfants: [
                  {
                    code: "DEPT-97",
                    nom: "Département Test 2",
                    maille: "DEPT",
                    enfants: [],
                  },
                  {
                    code: "DEPT-98",
                    nom: "Département Test 1",
                    maille: "DEPT",
                    enfants: [],
                  },
                ],
              },
            ],
            chantiers: [],
            perimetres: [],
          },
        ]);
      }),
    );

    it(
      "déduplique les territoires quand l'habilitation contient REG et ses DEPTs",
      createIntegrationTest(async () => {
        // Given
        const territoireReg = await fixtures.territoire({
          code: "REG-88",
          nom: "Région Test Dedup",
          maille: "REG",
        });

        const territoireDept87 = await fixtures.territoire({
          code: "DEPT-87",
          nom: "Département Test 1",
          maille: "DEPT",
          code_parent: territoireReg.code,
        });

        const territoireDept86 = await fixtures.territoire({
          code: "DEPT-86",
          nom: "Département Test 2",
          maille: "DEPT",
          code_parent: territoireReg.code,
        });

        const utilisateur = await fixtures.utilisateur({
          profilCode: "COORDINATEUR_REGION",
        });

        await fixtures.habilitation({
          utilisateurId: utilisateur.id,
          territoires: [
            territoireReg.code,
            territoireDept87.code,
            territoireDept86.code,
          ],
        });

        // When
        const result = await query.recupererParProfils(["COORDINATEUR_REGION"]);

        // Then
        expect(result).toEqual([
          {
            id: utilisateur.id,
            email: utilisateur.email,
            nom: utilisateur.nom,
            prenom: utilisateur.prenom,
            profilCode: "COORDINATEUR_REGION",
            territoires: [
              {
                code: "REG-88",
                nom: "Région Test Dedup",
                maille: "REG",
                enfants: [
                  {
                    code: "DEPT-86",
                    nom: "Département Test 2",
                    maille: "DEPT",
                    enfants: [],
                  },
                  {
                    code: "DEPT-87",
                    nom: "Département Test 1",
                    maille: "DEPT",
                    enfants: [],
                  },
                ],
              },
            ],
            chantiers: [],
            perimetres: [],
          },
        ]);
      }),
    );
  });
});
