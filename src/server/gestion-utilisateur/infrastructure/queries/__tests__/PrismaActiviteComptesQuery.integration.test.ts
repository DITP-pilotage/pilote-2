import { createIntegrationTest } from "@/server/infrastructure/test/createIntegrationTest";
import { fixtures } from "@/server/infrastructure/test/fixtures";
import { PrismaPilote } from "@/server/db/PrismaPilote";
import { PrismaActiviteComptesQuery } from "@/server/gestion-utilisateur/infrastructure/queries/PrismaActiviteComptesQuery";

describe("PrismaActiviteComptesQuery", () => {
  let query: PrismaActiviteComptesQuery;
  const prismaPilote = new PrismaPilote();

  beforeEach(() => {
    query = new PrismaActiviteComptesQuery({ prisma: prismaPilote });
  });

  it(
    "retourne les événements COMPTE_CREE dans la période",
    createIntegrationTest(async () => {
      // Given
      const dateDebut = new Date("2026-01-13T09:00:01Z");
      const dateFin = new Date("2026-01-20T09:00:00Z");

      const utilisateur = await fixtures.utilisateur({
        profilCode: "PREFET_REGION",
        date_creation: new Date("2026-01-15T10:00:00Z"),
      });

      await fixtures.habilitation({
        utilisateurId: utilisateur.id,
        territoires: ["REG-11"],
      });

      // When
      const evenements = await query.recupererActiviteComptes({
        dateDebut,
        dateFin,
        profilCodes: ["PREFET_REGION"],
      });

      // Then
      expect(evenements).toEqual([
        {
          type: "COMPTE_CREE",
          compte: {
            email: utilisateur.email,
            nom: utilisateur.nom,
            prenom: utilisateur.prenom,
            profil: "PREFET_REGION",
            territoires: [
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
          date: new Date("2026-01-15T10:00:00Z"),
        },
      ]);
    }),
  );

  it(
    "retourne les événements COMPTE_DESACTIVE dans la période",
    createIntegrationTest(async () => {
      // Given
      const dateDebut = new Date("2026-01-13T09:00:01Z");
      const dateFin = new Date("2026-01-20T09:00:00Z");

      const utilisateur = await fixtures.utilisateur({
        profilCode: "COORDINATEUR_DEPARTEMENT",
        date_creation: new Date("2026-01-01T10:00:00Z"),
        date_desactivation: new Date("2026-01-16T14:00:00Z"),
      });

      await fixtures.habilitation({
        utilisateurId: utilisateur.id,
        territoires: ["DEPT-75"],
      });

      // When
      const evenements = await query.recupererActiviteComptes({
        dateDebut,
        dateFin,
        profilCodes: ["COORDINATEUR_DEPARTEMENT"],
      });

      // Then
      expect(evenements).toEqual([
        {
          type: "COMPTE_DESACTIVE",
          compte: {
            email: utilisateur.email,
            nom: utilisateur.nom,
            prenom: utilisateur.prenom,
            profil: "COORDINATEUR_DEPARTEMENT",
            territoires: [
              {
                code: "DEPT-75",
                nom: "Paris",
                maille: "DEPT",
                enfants: [],
              },
            ],
          },
          date: new Date("2026-01-16T14:00:00Z"),
        },
      ]);
    }),
  );

  it(
    "retourne les événements mixtes (créations et désactivations) triés chronologiquement",
    createIntegrationTest(async () => {
      // Given
      const dateDebut = new Date("2026-01-13T09:00:01Z");
      const dateFin = new Date("2026-01-20T09:00:00Z");

      const utilisateurCréé = await fixtures.utilisateur({
        profilCode: "PREFET_REGION",
        date_creation: new Date("2026-01-15T10:00:00Z"),
      });
      await fixtures.habilitation({
        utilisateurId: utilisateurCréé.id,
        territoires: ["REG-11"],
      });

      const utilisateurDésactivé = await fixtures.utilisateur({
        profilCode: "COORDINATEUR_REGION",
        date_creation: new Date("2026-01-01T10:00:00Z"),
        date_desactivation: new Date("2026-01-14T12:00:00Z"),
      });
      await fixtures.habilitation({
        utilisateurId: utilisateurDésactivé.id,
        territoires: ["REG-11"],
      });

      const utilisateurCréé2 = await fixtures.utilisateur({
        profilCode: "SERVICES_DECONCENTRES_REGION",
        date_creation: new Date("2026-01-18T16:00:00Z"),
      });
      await fixtures.habilitation({
        utilisateurId: utilisateurCréé2.id,
        territoires: ["REG-11"],
      });

      // When
      const evenements = await query.recupererActiviteComptes({
        dateDebut,
        dateFin,
        profilCodes: [
          "PREFET_REGION",
          "COORDINATEUR_REGION",
          "SERVICES_DECONCENTRES_REGION",
        ],
      });

      // Then
      expect(evenements).toEqual([
        {
          type: "COMPTE_DESACTIVE",
          compte: {
            email: utilisateurDésactivé.email,
            nom: utilisateurDésactivé.nom,
            prenom: utilisateurDésactivé.prenom,
            profil: "COORDINATEUR_REGION",
            territoires: [
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
          date: new Date("2026-01-14T12:00:00Z"),
        },
        {
          type: "COMPTE_CREE",
          compte: {
            email: utilisateurCréé.email,
            nom: utilisateurCréé.nom,
            prenom: utilisateurCréé.prenom,
            profil: "PREFET_REGION",
            territoires: [
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
          date: new Date("2026-01-15T10:00:00Z"),
        },
        {
          type: "COMPTE_CREE",
          compte: {
            email: utilisateurCréé2.email,
            nom: utilisateurCréé2.nom,
            prenom: utilisateurCréé2.prenom,
            profil: "SERVICES_DECONCENTRES_REGION",
            territoires: [
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
          date: new Date("2026-01-18T16:00:00Z"),
        },
      ]);
    }),
  );

  it(
    "filtre uniquement les profils demandés",
    createIntegrationTest(async () => {
      // Given
      const dateDebut = new Date("2026-01-13T09:00:01Z");
      const dateFin = new Date("2026-01-20T09:00:00Z");

      const utilisateurPrefet = await fixtures.utilisateur({
        profilCode: "PREFET_REGION",
        date_creation: new Date("2026-01-15T10:00:00Z"),
      });
      await fixtures.habilitation({
        utilisateurId: utilisateurPrefet.id,
        territoires: ["REG-11"],
      });

      const utilisateurDitp = await fixtures.utilisateur({
        profilCode: "DITP_ADMIN",
        date_creation: new Date("2026-01-16T10:00:00Z"),
      });
      await fixtures.habilitation({
        utilisateurId: utilisateurDitp.id,
        territoires: ["REG-11"],
      });

      // When
      const evenements = await query.recupererActiviteComptes({
        dateDebut,
        dateFin,
        profilCodes: ["PREFET_REGION"],
      });

      // Then
      expect(evenements).toEqual([
        {
          type: "COMPTE_CREE",
          compte: {
            email: utilisateurPrefet.email,
            nom: utilisateurPrefet.nom,
            prenom: utilisateurPrefet.prenom,
            profil: "PREFET_REGION",
            territoires: [
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
          date: new Date("2026-01-15T10:00:00Z"),
        },
      ]);
    }),
  );

  it(
    "retourne tous les territoires pour un compte avec plusieurs habilitations",
    createIntegrationTest(async () => {
      // Given
      const dateDebut = new Date("2026-01-13T09:00:01Z");
      const dateFin = new Date("2026-01-20T09:00:00Z");

      const utilisateur = await fixtures.utilisateur({
        profilCode: "COORDINATEUR_REGION",
        date_creation: new Date("2026-01-15T10:00:00Z"),
      });

      await fixtures.habilitation({
        utilisateurId: utilisateur.id,
        scopeCode: "lecture",
        territoires: ["REG-11"],
      });

      await fixtures.habilitation({
        utilisateurId: utilisateur.id,
        scopeCode: "saisieCommentaire",
        territoires: ["REG-44"],
      });

      // When
      const evenements = await query.recupererActiviteComptes({
        dateDebut,
        dateFin,
        profilCodes: ["COORDINATEUR_REGION"],
      });

      // Then
      expect(evenements).toEqual([
        {
          type: "COMPTE_CREE",
          compte: {
            email: utilisateur.email,
            nom: utilisateur.nom,
            prenom: utilisateur.prenom,
            profil: "COORDINATEUR_REGION",
            territoires: expect.arrayContaining([
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
              {
                code: "REG-44",
                nom: "Grand-Est",
                maille: "REG",
                enfants: expect.arrayContaining([
                  {
                    code: "DEPT-08",
                    nom: "Ardennes",
                    maille: "DEPT",
                    enfants: [],
                  },
                  {
                    code: "DEPT-10",
                    nom: "Aube",
                    maille: "DEPT",
                    enfants: [],
                  },
                  {
                    code: "DEPT-51",
                    nom: "Marne",
                    maille: "DEPT",
                    enfants: [],
                  },
                  {
                    code: "DEPT-52",
                    nom: "Haute-Marne",
                    maille: "DEPT",
                    enfants: [],
                  },
                  {
                    code: "DEPT-54",
                    nom: "Meurthe-et-Moselle",
                    maille: "DEPT",
                    enfants: [],
                  },
                  {
                    code: "DEPT-55",
                    nom: "Meuse",
                    maille: "DEPT",
                    enfants: [],
                  },
                  {
                    code: "DEPT-57",
                    nom: "Moselle",
                    maille: "DEPT",
                    enfants: [],
                  },
                  {
                    code: "DEPT-67",
                    nom: "Bas-Rhin",
                    maille: "DEPT",
                    enfants: [],
                  },
                  {
                    code: "DEPT-68",
                    nom: "Haut-Rhin",
                    maille: "DEPT",
                    enfants: [],
                  },
                  {
                    code: "DEPT-88",
                    nom: "Vosges",
                    maille: "DEPT",
                    enfants: [],
                  },
                ]),
              },
            ]),
          },
          date: new Date("2026-01-15T10:00:00Z"),
        },
      ]);
      expect(evenements[0].compte.territoires).toHaveLength(2);
    }),
  );

  it(
    "exclut les comptes en dehors de la période (dates limites)",
    createIntegrationTest(async () => {
      // Given
      const dateDebut = new Date("2026-01-13T09:00:01Z");
      const dateFin = new Date("2026-01-20T09:00:00Z");

      const utilisateurAvant = await fixtures.utilisateur({
        profilCode: "PREFET_REGION",
        date_creation: new Date("2026-01-13T09:00:00Z"),
      });
      await fixtures.habilitation({
        utilisateurId: utilisateurAvant.id,
        territoires: ["REG-11"],
      });

      const utilisateurDans = await fixtures.utilisateur({
        profilCode: "PREFET_REGION",
        date_creation: new Date("2026-01-15T10:00:00Z"),
      });
      await fixtures.habilitation({
        utilisateurId: utilisateurDans.id,
        territoires: ["REG-11"],
      });

      const utilisateurAprès = await fixtures.utilisateur({
        profilCode: "PREFET_REGION",
        date_creation: new Date("2026-01-20T09:00:01Z"),
      });
      await fixtures.habilitation({
        utilisateurId: utilisateurAprès.id,
        territoires: ["REG-11"],
      });

      // When
      const evenements = await query.recupererActiviteComptes({
        dateDebut,
        dateFin,
        profilCodes: ["PREFET_REGION"],
      });

      // Then
      expect(evenements).toEqual([
        {
          type: "COMPTE_CREE",
          compte: {
            email: utilisateurDans.email,
            nom: utilisateurDans.nom,
            prenom: utilisateurDans.prenom,
            profil: "PREFET_REGION",
            territoires: [
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
          date: new Date("2026-01-15T10:00:00Z"),
        },
      ]);
    }),
  );

  it(
    "retourne un tableau vide quand aucune activité",
    createIntegrationTest(async () => {
      // Given
      const dateDebut = new Date("2026-01-13T09:00:01Z");
      const dateFin = new Date("2026-01-20T09:00:00Z");

      // When
      const evenements = await query.recupererActiviteComptes({
        dateDebut,
        dateFin,
        profilCodes: ["PREFET_REGION"],
      });

      // Then
      expect(evenements).toEqual([]);
    }),
  );

  it(
    "retourne un compte sans territoires quand l'utilisateur n'a pas d'habilitation",
    createIntegrationTest(async () => {
      // Given
      const dateDebut = new Date("2026-01-13T09:00:01Z");
      const dateFin = new Date("2026-01-20T09:00:00Z");

      const utilisateur = await fixtures.utilisateur({
        profilCode: "PREFET_REGION",
        date_creation: new Date("2026-01-15T10:00:00Z"),
      });

      // When
      const evenements = await query.recupererActiviteComptes({
        dateDebut,
        dateFin,
        profilCodes: ["PREFET_REGION"],
      });

      // Then
      expect(evenements).toEqual([
        {
          type: "COMPTE_CREE",
          compte: {
            email: utilisateur.email,
            nom: utilisateur.nom,
            prenom: utilisateur.prenom,
            profil: "PREFET_REGION",
            territoires: [],
          },
          date: new Date("2026-01-15T10:00:00Z"),
        },
      ]);
    }),
  );

  it(
    "déduplique les territoires quand l'habilitation contient REG et ses DEPTs",
    createIntegrationTest(async () => {
      // Given
      const dateDebut = new Date("2026-01-13T09:00:01Z");
      const dateFin = new Date("2026-01-20T09:00:00Z");

      const utilisateur = await fixtures.utilisateur({
        profilCode: "SERVICES_DECONCENTRES_REGION",
        date_creation: new Date("2026-01-15T10:00:00Z"),
      });

      await fixtures.habilitation({
        utilisateurId: utilisateur.id,
        territoires: ["REG-11", "DEPT-75", "DEPT-92"],
      });

      // When
      const evenements = await query.recupererActiviteComptes({
        dateDebut,
        dateFin,
        profilCodes: ["SERVICES_DECONCENTRES_REGION"],
      });

      // Then
      expect(evenements).toEqual([
        {
          type: "COMPTE_CREE",
          compte: {
            email: utilisateur.email,
            nom: utilisateur.nom,
            prenom: utilisateur.prenom,
            profil: "SERVICES_DECONCENTRES_REGION",
            territoires: [
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
          date: new Date("2026-01-15T10:00:00Z"),
        },
      ]);
    }),
  );
});
