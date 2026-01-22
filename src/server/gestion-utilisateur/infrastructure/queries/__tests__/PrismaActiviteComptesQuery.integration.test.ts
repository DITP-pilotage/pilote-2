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

      const territoire = await fixtures.territoire({
        code: "REG-11",
        nom: "Île-de-France",
        maille: "REG",
      });

      const utilisateur = await fixtures.utilisateur({
        profilCode: "PREFET_REGION",
        date_creation: new Date("2026-01-15T10:00:00Z"),
      });

      await fixtures.habilitation({
        utilisateurId: utilisateur.id,
        territoires: [territoire.code],
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

      const territoire = await fixtures.territoire({
        code: "DEPT-75",
        nom: "Paris",
        maille: "DEPT",
      });

      const utilisateur = await fixtures.utilisateur({
        profilCode: "COORDINATEUR_DEPARTEMENT",
        date_creation: new Date("2026-01-01T10:00:00Z"),
        date_desactivation: new Date("2026-01-16T14:00:00Z"),
      });

      await fixtures.habilitation({
        utilisateurId: utilisateur.id,
        territoires: [territoire.code],
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

      const territoire = await fixtures.territoire({
        code: "REG-11",
        nom: "Île-de-France",
        maille: "REG",
      });

      const utilisateurCréé = await fixtures.utilisateur({
        profilCode: "PREFET_REGION",
        date_creation: new Date("2026-01-15T10:00:00Z"),
      });
      await fixtures.habilitation({
        utilisateurId: utilisateurCréé.id,
        territoires: [territoire.code],
      });

      const utilisateurDésactivé = await fixtures.utilisateur({
        profilCode: "COORDINATEUR_REGION",
        date_creation: new Date("2026-01-01T10:00:00Z"),
        date_desactivation: new Date("2026-01-14T12:00:00Z"),
      });
      await fixtures.habilitation({
        utilisateurId: utilisateurDésactivé.id,
        territoires: [territoire.code],
      });

      const utilisateurCréé2 = await fixtures.utilisateur({
        profilCode: "SERVICES_DECONCENTRES_REGION",
        date_creation: new Date("2026-01-18T16:00:00Z"),
      });
      await fixtures.habilitation({
        utilisateurId: utilisateurCréé2.id,
        territoires: [territoire.code],
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

      const territoire = await fixtures.territoire({
        code: "REG-11",
        nom: "Île-de-France",
        maille: "REG",
      });

      const utilisateurPrefet = await fixtures.utilisateur({
        profilCode: "PREFET_REGION",
        date_creation: new Date("2026-01-15T10:00:00Z"),
      });
      await fixtures.habilitation({
        utilisateurId: utilisateurPrefet.id,
        territoires: [territoire.code],
      });

      const utilisateurDitp = await fixtures.utilisateur({
        profilCode: "DITP_ADMIN",
        date_creation: new Date("2026-01-16T10:00:00Z"),
      });
      await fixtures.habilitation({
        utilisateurId: utilisateurDitp.id,
        territoires: [territoire.code],
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

      const territoireReg = await fixtures.territoire({
        code: "REG-11",
        nom: "Île-de-France",
        maille: "REG",
      });

      const territoireDept = await fixtures.territoire({
        code: "DEPT-75",
        nom: "Paris",
        maille: "DEPT",
      });

      const utilisateur = await fixtures.utilisateur({
        profilCode: "COORDINATEUR_REGION",
        date_creation: new Date("2026-01-15T10:00:00Z"),
      });

      await fixtures.habilitation({
        utilisateurId: utilisateur.id,
        scopeCode: "lecture",
        territoires: [territoireReg.code],
      });

      await fixtures.habilitation({
        utilisateurId: utilisateur.id,
        scopeCode: "saisieCommentaire",
        territoires: [territoireDept.code],
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
              },
              {
                code: "DEPT-75",
                nom: "Paris",
                maille: "DEPT",
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

      const territoire = await fixtures.territoire({
        code: "REG-11",
        nom: "Île-de-France",
        maille: "REG",
      });

      const utilisateurAvant = await fixtures.utilisateur({
        profilCode: "PREFET_REGION",
        date_creation: new Date("2026-01-13T09:00:00Z"),
      });
      await fixtures.habilitation({
        utilisateurId: utilisateurAvant.id,
        territoires: [territoire.code],
      });

      const utilisateurDans = await fixtures.utilisateur({
        profilCode: "PREFET_REGION",
        date_creation: new Date("2026-01-15T10:00:00Z"),
      });
      await fixtures.habilitation({
        utilisateurId: utilisateurDans.id,
        territoires: [territoire.code],
      });

      const utilisateurAprès = await fixtures.utilisateur({
        profilCode: "PREFET_REGION",
        date_creation: new Date("2026-01-20T09:00:01Z"),
      });
      await fixtures.habilitation({
        utilisateurId: utilisateurAprès.id,
        territoires: [territoire.code],
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
});
