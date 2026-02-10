import { createIntegrationTest } from "@/server/infrastructure/test/createIntegrationTest";
import { fixtures } from "@/server/infrastructure/test/fixtures";
import { PrismaPilote } from "@/server/db/PrismaPilote";
import { PrismaActiviteComptesQuery } from "@/server/gestion-utilisateur/infrastructure/queries/PrismaActiviteComptesQuery";
import { PrismaUtilisateursQuery } from "@/server/gestion-utilisateur/infrastructure/queries/PrismaUtilisateursQuery";
import { RecupererEvenementsVAParPeriodeQuery } from "@/server/indicateur-territoire-valeur-evenement/infrastructure/queries/RecupererEvenementsVAParPeriodeQuery";
import { getPrisma } from "@/server/db/PrismaTransaction";
import { ProduireRapportsHebdomadairesUseCase } from "@/server/rapports-hebdomadaires/usecases/ProduireRapportsHebdomadairesUseCase";
import { GestionUtilisateurActiviteComptesGateway } from "@/server/rapports-hebdomadaires/infrastructure/adapters/GestionUtilisateurActiviteComptesGateway";
import { GestionUtilisateurCoordinateurGateway } from "@/server/rapports-hebdomadaires/infrastructure/adapters/GestionUtilisateurCoordinateurGateway";
import { PrismaRapportRepository } from "@/server/rapports-hebdomadaires/infrastructure/adapters/PrismaRapportRepository";
import { ChantiersChantierGateway } from "@/server/rapports-hebdomadaires/infrastructure/adapters/ChantiersChantierGateway";
import { RecupererChantiersApplicablesParTerritoiresQuery } from "@/server/chantiers/infrastructure/queries/RecupererChantiersApplicablesParTerritoiresQuery";
import { IndicateurActiviteGateway } from "@/server/rapports-hebdomadaires/infrastructure/adapters/IndicateurActiviteGateway";
import { RecupererMesuresIndicateurParPeriodeQuery } from "@/server/chantiers/infrastructure/queries/RecupererMesuresIndicateurParPeriodeQuery";

describe("ProduireRapportsHebdomadairesUseCase", () => {
  let useCase: ProduireRapportsHebdomadairesUseCase;
  const prismaPilote = new PrismaPilote();

  beforeEach(() => {
    const activiteComptesQuery = new PrismaActiviteComptesQuery({
      prisma: prismaPilote,
    });
    const activiteComptesGateway = new GestionUtilisateurActiviteComptesGateway(
      { activiteComptesQuery },
    );
    const utilisateursQuery = new PrismaUtilisateursQuery({
      prisma: prismaPilote,
    });
    const coordinateurGateway = new GestionUtilisateurCoordinateurGateway({
      utilisateursQuery,
    });
    const rapportRepository = new PrismaRapportRepository({
      prisma: prismaPilote,
    });
    const recupererChantiersQuery =
      new RecupererChantiersApplicablesParTerritoiresQuery({
        prisma: prismaPilote,
      });
    const chantierGateway = new ChantiersChantierGateway({
      recupererChantiersQuery,
    });
    const evenementsVAQuery = new RecupererEvenementsVAParPeriodeQuery({
      prisma: prismaPilote,
    });
    const mesuresIndicateurQuery =
      new RecupererMesuresIndicateurParPeriodeQuery({
        prisma: prismaPilote,
      });
    const activiteIndicateurGateway = new IndicateurActiviteGateway({
      evenementsVAQuery: evenementsVAQuery,
      mesuresIndicateurQuery,
    });

    useCase = new ProduireRapportsHebdomadairesUseCase({
      activiteComptesGateway,
      coordinateurGateway,
      rapportRepository,
      chantierGateway,
      activiteIndicateurGateway,
    });
  });

  it(
    "crée des rapports pour les coordinateurs avec activité dans leur territoire",
    createIntegrationTest(async () => {
      // Given
      const coordinateur = await fixtures.utilisateur({
        profilCode: "COORDINATEUR_REGION",
      });
      await fixtures.habilitation({
        utilisateurId: coordinateur.id,
        territoires: ["REG-11"],
      });

      const compteCree = await fixtures.utilisateur({
        profilCode: "PREFET_REGION",
        date_creation: new Date(Date.now() - 1 * 60 * 60 * 1000),
      });
      await fixtures.habilitation({
        utilisateurId: compteCree.id,
        territoires: ["REG-11"],
      });

      // When
      const result = await useCase.run();

      // Then
      expect(result.rapportsCrees).toBe(1);
      expect(result.coordinateursSansActivite).toBe(0);

      const prisma = getPrisma();
      const rapports = await prisma.rapport_hebdomadaire_coordinateur.findMany({
        where: { coordinateur_id: coordinateur.id },
      });
      expect(rapports).toEqual([
        expect.objectContaining({
          coordinateur_id: coordinateur.id,
          statut_envoi: "CREE",
          contenu_rapport: expect.objectContaining({
            sectionActiviteComptes: expect.objectContaining({
              comptesCrees: [
                expect.objectContaining({
                  email: compteCree.email,
                }),
              ],
            }),
          }),
        }),
      ]);
    }),
  );

  it(
    "ne crée pas de rapport pour les coordinateurs sans activité",
    createIntegrationTest(async () => {
      // Given
      const coordinateur = await fixtures.utilisateur({
        profilCode: "COORDINATEUR_REGION",
      });
      await fixtures.habilitation({
        utilisateurId: coordinateur.id,
        territoires: ["REG-11"],
      });

      // When
      const result = await useCase.run();

      // Then
      expect(result.rapportsCrees).toBe(0);
      expect(result.coordinateursSansActivite).toBe(1);

      const prisma = getPrisma();
      const rapports = await prisma.rapport_hebdomadaire_coordinateur.findMany({
        where: { coordinateur_id: coordinateur.id },
      });
      expect(rapports).toHaveLength(0);
    }),
  );

  it(
    "les coordinateurs régionaux reçoivent les événements de la région et des départements enfants",
    createIntegrationTest(async () => {
      // Given
      const coordinateur = await fixtures.utilisateur({
        profilCode: "COORDINATEUR_REGION",
      });
      await fixtures.habilitation({
        utilisateurId: coordinateur.id,
        territoires: ["REG-11"],
      });

      const compteDansRegion = await fixtures.utilisateur({
        profilCode: "PREFET_REGION",
        date_creation: new Date(Date.now() - 1 * 60 * 60 * 1000),
      });
      await fixtures.habilitation({
        utilisateurId: compteDansRegion.id,
        territoires: ["REG-11"],
      });

      const compteDansDept = await fixtures.utilisateur({
        profilCode: "PREFET_DEPARTEMENT",
        date_creation: new Date(Date.now() - 1 * 60 * 60 * 1000),
      });
      await fixtures.habilitation({
        utilisateurId: compteDansDept.id,
        territoires: ["DEPT-75"],
      });

      // When
      const result = await useCase.run();

      // Then
      expect(result.rapportsCrees).toBe(1);

      const prisma = getPrisma();
      const rapports = await prisma.rapport_hebdomadaire_coordinateur.findMany({
        where: { coordinateur_id: coordinateur.id },
      });
      expect(rapports).toEqual([
        expect.objectContaining({
          coordinateur_id: coordinateur.id,
          statut_envoi: "CREE",
          contenu_rapport: expect.objectContaining({
            sectionActiviteComptes: expect.objectContaining({
              comptesCrees: [
                expect.objectContaining({
                  email: compteDansRegion.email,
                }),
                expect.objectContaining({
                  email: compteDansDept.email,
                }),
              ],
            }),
          }),
        }),
      ]);
    }),
  );

  it(
    "les coordinateurs départementaux reçoivent les événements de leur département et de la région parente",
    createIntegrationTest(async () => {
      // Given
      const coordinateur = await fixtures.utilisateur({
        profilCode: "COORDINATEUR_DEPARTEMENT",
      });
      await fixtures.habilitation({
        utilisateurId: coordinateur.id,
        territoires: ["DEPT-75"],
      });

      const compteDansRegion = await fixtures.utilisateur({
        profilCode: "PREFET_REGION",
        date_creation: new Date(Date.now() - 1 * 60 * 60 * 1000),
      });
      await fixtures.habilitation({
        utilisateurId: compteDansRegion.id,
        territoires: ["REG-11"],
      });

      const compteDansDept = await fixtures.utilisateur({
        profilCode: "PREFET_DEPARTEMENT",
        date_creation: new Date(Date.now() - 1 * 60 * 60 * 1000),
      });
      await fixtures.habilitation({
        utilisateurId: compteDansDept.id,
        territoires: ["DEPT-75"],
      });

      const compteDansAutreDept = await fixtures.utilisateur({
        profilCode: "PREFET_DEPARTEMENT",
        date_creation: new Date(Date.now() - 1 * 60 * 60 * 1000),
      });
      await fixtures.habilitation({
        utilisateurId: compteDansAutreDept.id,
        territoires: ["DEPT-92"],
      });

      // When
      const result = await useCase.run();

      // Then
      expect(result.rapportsCrees).toBe(1);

      const prisma = getPrisma();
      const rapports = await prisma.rapport_hebdomadaire_coordinateur.findMany({
        where: { coordinateur_id: coordinateur.id },
      });
      expect(rapports).toEqual([
        expect.objectContaining({
          coordinateur_id: coordinateur.id,
          statut_envoi: "CREE",
          contenu_rapport: expect.objectContaining({
            sectionActiviteComptes: expect.objectContaining({
              comptesCrees: [
                expect.objectContaining({
                  email: compteDansRegion.email,
                }),
                expect.objectContaining({
                  email: compteDansDept.email,
                }),
              ],
            }),
          }),
        }),
      ]);
    }),
  );

  it(
    "filtre uniquement les profils tracés",
    createIntegrationTest(async () => {
      // Given
      const coordinateur = await fixtures.utilisateur({
        profilCode: "COORDINATEUR_REGION",
      });
      await fixtures.habilitation({
        utilisateurId: coordinateur.id,
        territoires: ["REG-11"],
      });

      const comptePrefet = await fixtures.utilisateur({
        profilCode: "PREFET_REGION",
        date_creation: new Date(Date.now() - 1 * 60 * 60 * 1000),
      });
      await fixtures.habilitation({
        utilisateurId: comptePrefet.id,
        territoires: ["REG-11"],
      });

      const compteDitp = await fixtures.utilisateur({
        profilCode: "DITP_ADMIN",
        date_creation: new Date(Date.now() - 1 * 60 * 60 * 1000),
      });
      await fixtures.habilitation({
        utilisateurId: compteDitp.id,
        territoires: ["REG-11"],
      });

      // When
      const result = await useCase.run();

      // Then
      expect(result.rapportsCrees).toBe(1);

      const prisma = getPrisma();
      const rapports = await prisma.rapport_hebdomadaire_coordinateur.findMany({
        where: { coordinateur_id: coordinateur.id },
      });
      expect(rapports).toEqual([
        expect.objectContaining({
          coordinateur_id: coordinateur.id,
          statut_envoi: "CREE",
          contenu_rapport: expect.objectContaining({
            sectionActiviteComptes: expect.objectContaining({
              comptesCrees: [
                expect.objectContaining({
                  email: comptePrefet.email,
                }),
              ],
            }),
          }),
        }),
      ]);
    }),
  );

  it(
    "inclut les changements de valeur VA pour les chantiers du coordinateur",
    createIntegrationTest(async () => {
      const chantier = await fixtures.chantierIdentite({
        nom: "Chantier Test",
        statut: "PUBLIE",
        est_territorialise: true,
      });

      await fixtures.chantierTerritoire({
        id: chantier.id,
        territoire_code: "DEPT-75",
        est_applicable: true,
      });

      const indicateur = await fixtures.indicateurIdentite({
        chantier_id: chantier.id,
        nom: "Indicateur Test",
        statut: "PUBLIE",
      });

      await fixtures.indicateurTerritoire({
        id: indicateur.id,
        territoire_code: "DEPT-75",
        chantier_id: chantier.id,
        est_applicable: true,
      });

      const coordinateur = await fixtures.utilisateur({
        profilCode: "COORDINATEUR_DEPARTEMENT",
      });
      await fixtures.habilitation({
        utilisateurId: coordinateur.id,
        territoires: ["DEPT-75"],
        chantiers: [chantier.id],
      });

      const auteur = await fixtures.utilisateur();
      await fixtures.indicateurTerritoireValeurEvenement({
        indic_id: indicateur.id,
        territoire_code: "DEPT-75",
        id_auteur_modification: auteur.id,
        type_evenement: "VALEUR_MODIFIEE",
        valeur: 75,
        date_creation: new Date(Date.now() - 1 * 60 * 60 * 1000),
      });

      const result = await useCase.run();

      expect(result.rapportsCrees).toBe(1);

      const prisma = getPrisma();
      const rapports = await prisma.rapport_hebdomadaire_coordinateur.findMany({
        where: { coordinateur_id: coordinateur.id },
      });

      expect(rapports).toEqual([
        expect.objectContaining({
          contenu_rapport: expect.objectContaining({
            sectionActiviteChantiers: [
              expect.objectContaining({
                nom: "Chantier Test",
                indicateurs: [
                  expect.objectContaining({
                    nom: "Indicateur Test",
                    territoires: [
                      expect.objectContaining({
                        valeur: 75,
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),
        }),
      ]);
    }),
  );

  it(
    "ne crée pas de rapport si le coordinateur n'a pas de chantiers habilités",
    createIntegrationTest(async () => {
      const coordinateur = await fixtures.utilisateur({
        profilCode: "COORDINATEUR_DEPARTEMENT",
      });
      await fixtures.habilitation({
        utilisateurId: coordinateur.id,
        territoires: ["DEPT-75"],
        chantiers: [],
      });

      const result = await useCase.run();

      expect(result.rapportsCrees).toBe(0);
      expect(result.coordinateursSansActivite).toBe(1);
    }),
  );

  it(
    "crée un rapport si uniquement activité VA (sans activité comptes)",
    createIntegrationTest(async () => {
      const chantier = await fixtures.chantierIdentite({
        nom: "Chantier Test",
        statut: "PUBLIE",
        est_territorialise: true,
      });

      await fixtures.chantierTerritoire({
        id: chantier.id,
        territoire_code: "DEPT-75",
        est_applicable: true,
      });

      const indicateur = await fixtures.indicateurIdentite({
        chantier_id: chantier.id,
        nom: "Indicateur Test",
        statut: "PUBLIE",
      });

      await fixtures.indicateurTerritoire({
        id: indicateur.id,
        territoire_code: "DEPT-75",
        chantier_id: chantier.id,
        est_applicable: true,
      });

      const coordinateur = await fixtures.utilisateur({
        profilCode: "COORDINATEUR_DEPARTEMENT",
      });
      await fixtures.habilitation({
        utilisateurId: coordinateur.id,
        territoires: ["DEPT-75"],
        chantiers: [chantier.id],
      });

      const auteur = await fixtures.utilisateur();
      await fixtures.indicateurTerritoireValeurEvenement({
        indic_id: indicateur.id,
        territoire_code: "DEPT-75",
        id_auteur_modification: auteur.id,
        type_evenement: "VALEUR_MODIFIEE",
        valeur: 80,
        date_creation: new Date(Date.now() - 1 * 60 * 60 * 1000),
      });

      const result = await useCase.run();

      expect(result.rapportsCrees).toBe(1);
      expect(result.coordinateursSansActivite).toBe(0);
    }),
  );

  it(
    "exclut les chantiers où est_territorialise = false",
    createIntegrationTest(async () => {
      const chantier = await fixtures.chantierIdentite({
        nom: "Chantier non territorialisé",
        statut: "PUBLIE",
        est_territorialise: false,
      });

      await fixtures.chantierTerritoire({
        id: chantier.id,
        territoire_code: "DEPT-75",
        est_applicable: true,
      });

      const indicateur = await fixtures.indicateurIdentite({
        chantier_id: chantier.id,
        nom: "Indicateur Test",
        statut: "PUBLIE",
      });

      await fixtures.indicateurTerritoire({
        id: indicateur.id,
        territoire_code: "DEPT-75",
        chantier_id: chantier.id,
        est_applicable: true,
      });

      const coordinateur = await fixtures.utilisateur({
        profilCode: "COORDINATEUR_DEPARTEMENT",
      });
      await fixtures.habilitation({
        utilisateurId: coordinateur.id,
        territoires: ["DEPT-75"],
      });

      const auteur = await fixtures.utilisateur();
      await fixtures.indicateurTerritoireValeurEvenement({
        indic_id: indicateur.id,
        territoire_code: "DEPT-75",
        id_auteur_modification: auteur.id,
        type_evenement: "VALEUR_MODIFIEE",
        valeur: 85,
        date_creation: new Date(Date.now() - 1 * 60 * 60 * 1000),
      });

      const result = await useCase.run();

      expect(result.coordinateursSansActivite).toBe(1);
      expect(result.rapportsCrees).toBe(0);
    }),
  );

  it(
    "exclut les chantiers où est_applicable = false",
    createIntegrationTest(async () => {
      const chantier = await fixtures.chantierIdentite({
        nom: "Chantier non applicable",
        statut: "PUBLIE",
        est_territorialise: true,
      });

      await fixtures.chantierTerritoire({
        id: chantier.id,
        territoire_code: "DEPT-75",
        est_applicable: false,
      });

      const indicateur = await fixtures.indicateurIdentite({
        chantier_id: chantier.id,
        nom: "Indicateur Test",
        statut: "PUBLIE",
      });

      await fixtures.indicateurTerritoire({
        id: indicateur.id,
        territoire_code: "DEPT-75",
        chantier_id: chantier.id,
        est_applicable: true,
      });

      const coordinateur = await fixtures.utilisateur({
        profilCode: "COORDINATEUR_DEPARTEMENT",
      });
      await fixtures.habilitation({
        utilisateurId: coordinateur.id,
        territoires: ["DEPT-75"],
      });

      const auteur = await fixtures.utilisateur();
      await fixtures.indicateurTerritoireValeurEvenement({
        indic_id: indicateur.id,
        territoire_code: "DEPT-75",
        id_auteur_modification: auteur.id,
        type_evenement: "VALEUR_MODIFIEE",
        valeur: 85,
        date_creation: new Date(Date.now() - 1 * 60 * 60 * 1000),
      });

      const result = await useCase.run();

      expect(result.coordinateursSansActivite).toBe(1);
      expect(result.rapportsCrees).toBe(0);
    }),
  );

  it(
    "exclut les indicateurs où est_applicable = false",
    createIntegrationTest(async () => {
      const chantier = await fixtures.chantierIdentite({
        nom: "Chantier test",
        statut: "PUBLIE",
        est_territorialise: true,
      });

      await fixtures.chantierTerritoire({
        id: chantier.id,
        territoire_code: "DEPT-75",
        est_applicable: true,
      });

      const indicateur = await fixtures.indicateurIdentite({
        chantier_id: chantier.id,
        nom: "Indicateur non applicable",
        statut: "PUBLIE",
      });

      await fixtures.indicateurTerritoire({
        id: indicateur.id,
        territoire_code: "DEPT-75",
        chantier_id: chantier.id,
        est_applicable: false,
      });

      const coordinateur = await fixtures.utilisateur({
        profilCode: "COORDINATEUR_DEPARTEMENT",
      });
      await fixtures.habilitation({
        utilisateurId: coordinateur.id,
        territoires: ["DEPT-75"],
      });

      const auteur = await fixtures.utilisateur();
      await fixtures.indicateurTerritoireValeurEvenement({
        indic_id: indicateur.id,
        territoire_code: "DEPT-75",
        id_auteur_modification: auteur.id,
        type_evenement: "VALEUR_MODIFIEE",
        valeur: 85,
        date_creation: new Date(Date.now() - 1 * 60 * 60 * 1000),
      });

      const result = await useCase.run();

      expect(result.coordinateursSansActivite).toBe(1);
      expect(result.rapportsCrees).toBe(0);
    }),
  );
});
