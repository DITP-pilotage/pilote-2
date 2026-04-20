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
        const utilisateur = await fixtures.utilisateur({
          profilCode: "PREFET_DEPARTEMENT",
        });

        await fixtures.habilitation({
          utilisateurId: utilisateur.id,
          territoires: ["DEPT-75"],
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
            habilitationLectureTerritoires: [
              {
                code: "DEPT-75",
                nom: "Paris",
                maille: "DEPT",
                enfants: [],
              },
            ],
          },
        ]);
      }),
    );

    it(
      "retourne l'utilisateur avec le territoire REG et ses enfants DEPT",
      createIntegrationTest(async () => {
        // Given
        const utilisateur = await fixtures.utilisateur({
          profilCode: "COORDINATEUR_REGION",
        });

        await fixtures.habilitation({
          utilisateurId: utilisateur.id,
          territoires: ["REG-11"],
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
            habilitationLectureTerritoires: [
              {
                code: "REG-11",
                nom: "Île-de-France",
                maille: "REG",
                enfants: expect.arrayContaining([
                  {
                    code: "DEPT-75",
                    nom: "Paris",
                    maille: "DEPT",
                    enfants: [],
                  },
                  {
                    code: "DEPT-77",
                    nom: "Seine-et-Marne",
                    maille: "DEPT",
                    enfants: [],
                  },
                  {
                    code: "DEPT-78",
                    nom: "Yvelines",
                    maille: "DEPT",
                    enfants: [],
                  },
                  {
                    code: "DEPT-91",
                    nom: "Essonne",
                    maille: "DEPT",
                    enfants: [],
                  },
                  {
                    code: "DEPT-92",
                    nom: "Hauts-de-Seine",
                    maille: "DEPT",
                    enfants: [],
                  },
                  {
                    code: "DEPT-93",
                    nom: "Seine-Saint-Denis",
                    maille: "DEPT",
                    enfants: [],
                  },
                  {
                    code: "DEPT-94",
                    nom: "Val-de-Marne",
                    maille: "DEPT",
                    enfants: [],
                  },
                  {
                    code: "DEPT-95",
                    nom: "Val-d'Oise",
                    maille: "DEPT",
                    enfants: [],
                  },
                ]),
              },
            ],
          },
        ]);
      }),
    );

    it(
      "déduplique les territoires quand l'habilitation contient REG et ses DEPTs",
      createIntegrationTest(async () => {
        // Given
        const utilisateur = await fixtures.utilisateur({
          profilCode: "COORDINATEUR_REGION",
        });

        await fixtures.habilitation({
          utilisateurId: utilisateur.id,
          territoires: ["REG-11", "DEPT-75", "DEPT-92"],
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
            habilitationLectureTerritoires: [
              {
                code: "REG-11",
                nom: "Île-de-France",
                maille: "REG",
                enfants: expect.arrayContaining([
                  {
                    code: "DEPT-75",
                    nom: "Paris",
                    maille: "DEPT",
                    enfants: [],
                  },
                  {
                    code: "DEPT-77",
                    nom: "Seine-et-Marne",
                    maille: "DEPT",
                    enfants: [],
                  },
                  {
                    code: "DEPT-78",
                    nom: "Yvelines",
                    maille: "DEPT",
                    enfants: [],
                  },
                  {
                    code: "DEPT-91",
                    nom: "Essonne",
                    maille: "DEPT",
                    enfants: [],
                  },
                  {
                    code: "DEPT-92",
                    nom: "Hauts-de-Seine",
                    maille: "DEPT",
                    enfants: [],
                  },
                  {
                    code: "DEPT-93",
                    nom: "Seine-Saint-Denis",
                    maille: "DEPT",
                    enfants: [],
                  },
                  {
                    code: "DEPT-94",
                    nom: "Val-de-Marne",
                    maille: "DEPT",
                    enfants: [],
                  },
                  {
                    code: "DEPT-95",
                    nom: "Val-d'Oise",
                    maille: "DEPT",
                    enfants: [],
                  },
                ]),
              },
            ],
          },
        ]);
      }),
    );

    it(
      "retourne uniquement les territoires avec le scope 'lecture'",
      createIntegrationTest(async () => {
        // Given
        const utilisateur = await fixtures.utilisateur({
          profilCode: "PREFET_DEPARTEMENT",
        });

        await fixtures.habilitation({
          utilisateurId: utilisateur.id,
          scopeCode: "lecture",
          territoires: ["DEPT-75"],
        });

        await fixtures.habilitation({
          utilisateurId: utilisateur.id,
          scopeCode: "saisieIndicateur",
          territoires: ["DEPT-92"],
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
            habilitationLectureTerritoires: [
              {
                code: "DEPT-75",
                nom: "Paris",
                maille: "DEPT",
                enfants: [],
              },
            ],
          },
        ]);
      }),
    );
  });
});
