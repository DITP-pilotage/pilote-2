import { randomUUID } from "node:crypto";
import { createIntegrationTest } from "@/server/infrastructure/test/createIntegrationTest";
import { fixtures } from "@/server/infrastructure/test/fixtures";
import { PrismaPilote } from "@/server/db/PrismaPilote";
import { PrismaActiviteComptesQuery } from "@/server/gestion-utilisateur/infrastructure/queries/PrismaActiviteComptesQuery";
import { PrismaUtilisateursQuery } from "@/server/gestion-utilisateur/infrastructure/queries/PrismaUtilisateursQuery";
import { RecupererIndicateursParChantiersQuery } from "@/server/chantiers/infrastructure/queries/RecupererIndicateursParChantiersQuery";
import { RecupererEvenementsVAParPeriodeQuery } from "@/server/indicateur-territoire-valeur-evenement/infrastructure/queries/RecupererEvenementsVAParPeriodeQuery";
import { RecupererTerritoiresQuery } from "@/server/indicateur-territoire-valeur-evenement/infrastructure/queries/RecupererTerritoiresQuery";
import { getPrisma } from "@/server/db/PrismaTransaction";
import { ProduireRapportsHebdomadairesUseCase } from "@/server/rapports-hebdomadaires/usecases/ProduireRapportsHebdomadairesUseCase";
import { GestionUtilisateurActiviteComptesGateway } from "@/server/rapports-hebdomadaires/infrastructure/adapters/GestionUtilisateurActiviteComptesGateway";
import { GestionUtilisateurCoordinateurGateway } from "@/server/rapports-hebdomadaires/infrastructure/adapters/GestionUtilisateurCoordinateurGateway";
import { PrismaRapportRepository } from "@/server/rapports-hebdomadaires/infrastructure/adapters/PrismaRapportRepository";
import { ChantiersChantierGateway } from "@/server/rapports-hebdomadaires/infrastructure/adapters/ChantiersChantierGateway";
import { IndicateurActiviteVAGateway } from "@/server/rapports-hebdomadaires/infrastructure/adapters/IndicateurActiviteVAGateway";

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
    const recupererIndicateursQuery = new RecupererIndicateursParChantiersQuery(
      { prisma: prismaPilote },
    );
    const chantierGateway = new ChantiersChantierGateway({
      recupererIndicateursQuery,
    });
    const evenementsVAQuery = new RecupererEvenementsVAParPeriodeQuery({
      prisma: prismaPilote,
    });
    const territoiresQuery = new RecupererTerritoiresQuery({
      prisma: prismaPilote,
    });
    const activiteVAGateway = new IndicateurActiviteVAGateway({
      evenementsQuery: evenementsVAQuery,
      territoiresQuery,
    });

    useCase = new ProduireRapportsHebdomadairesUseCase({
      activiteComptesGateway,
      coordinateurGateway,
      rapportRepository,
      chantierGateway,
      activiteVAGateway,
    });
  });

  it(
    "crée des rapports pour les coordinateurs avec activité dans leur territoire",
    createIntegrationTest(async () => {
      // Given
      const territoireReg = await fixtures.territoire({
        code: randomUUID(),
        nom: "Île-de-France",
        maille: "REG",
      });

      const coordinateur = await fixtures.utilisateur({
        profilCode: "COORDINATEUR_REGION",
      });
      await fixtures.habilitation({
        utilisateurId: coordinateur.id,
        territoires: [territoireReg.code],
      });

      const compteCree = await fixtures.utilisateur({
        profilCode: "PREFET_REGION",
        date_creation: new Date(Date.now() - 1 * 60 * 60 * 1000),
      });
      await fixtures.habilitation({
        utilisateurId: compteCree.id,
        territoires: [territoireReg.code],
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
      const territoireReg = await fixtures.territoire({
        code: randomUUID(),
        nom: "Île-de-France",
        maille: "REG",
      });

      const coordinateur = await fixtures.utilisateur({
        profilCode: "COORDINATEUR_REGION",
      });
      await fixtures.habilitation({
        utilisateurId: coordinateur.id,
        territoires: [territoireReg.code],
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
      const territoireReg = await fixtures.territoire({
        code: randomUUID(),
        nom: "Île-de-France",
        maille: "REG",
      });

      const territoireDept = await fixtures.territoire({
        code: randomUUID(),
        nom: "Paris",
        maille: "DEPT",
        code_parent: territoireReg.code,
      });

      const coordinateur = await fixtures.utilisateur({
        profilCode: "COORDINATEUR_REGION",
      });
      await fixtures.habilitation({
        utilisateurId: coordinateur.id,
        territoires: [territoireReg.code],
      });

      const compteDansRegion = await fixtures.utilisateur({
        profilCode: "PREFET_REGION",
        date_creation: new Date(Date.now() - 1 * 60 * 60 * 1000),
      });
      await fixtures.habilitation({
        utilisateurId: compteDansRegion.id,
        territoires: [territoireReg.code],
      });

      const compteDansDept = await fixtures.utilisateur({
        profilCode: "PREFET_DEPARTEMENT",
        date_creation: new Date(Date.now() - 1 * 60 * 60 * 1000),
      });
      await fixtures.habilitation({
        utilisateurId: compteDansDept.id,
        territoires: [territoireDept.code],
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
      const territoireReg = await fixtures.territoire({
        code: randomUUID(),
        nom: "Île-de-France",
        maille: "REG",
      });

      const territoireDept = await fixtures.territoire({
        code: randomUUID(),
        nom: "Paris",
        maille: "DEPT",
        code_parent: territoireReg.code,
      });

      const territoireAutreDept = await fixtures.territoire({
        code: randomUUID(),
        nom: "Hauts-de-Seine",
        maille: "DEPT",
        code_parent: territoireReg.code,
      });

      const coordinateur = await fixtures.utilisateur({
        profilCode: "COORDINATEUR_DEPARTEMENT",
      });
      await fixtures.habilitation({
        utilisateurId: coordinateur.id,
        territoires: [territoireDept.code],
      });

      const compteDansRegion = await fixtures.utilisateur({
        profilCode: "PREFET_REGION",
        date_creation: new Date(Date.now() - 1 * 60 * 60 * 1000),
      });
      await fixtures.habilitation({
        utilisateurId: compteDansRegion.id,
        territoires: [territoireReg.code],
      });

      const compteDansDept = await fixtures.utilisateur({
        profilCode: "PREFET_DEPARTEMENT",
        date_creation: new Date(Date.now() - 1 * 60 * 60 * 1000),
      });
      await fixtures.habilitation({
        utilisateurId: compteDansDept.id,
        territoires: [territoireDept.code],
      });

      const compteDansAutreDept = await fixtures.utilisateur({
        profilCode: "PREFET_DEPARTEMENT",
        date_creation: new Date(Date.now() - 1 * 60 * 60 * 1000),
      });
      await fixtures.habilitation({
        utilisateurId: compteDansAutreDept.id,
        territoires: [territoireAutreDept.code],
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
      const territoireReg = await fixtures.territoire({
        code: randomUUID(),
        nom: "Île-de-France",
        maille: "REG",
      });

      const coordinateur = await fixtures.utilisateur({
        profilCode: "COORDINATEUR_REGION",
      });
      await fixtures.habilitation({
        utilisateurId: coordinateur.id,
        territoires: [territoireReg.code],
      });

      const comptePrefet = await fixtures.utilisateur({
        profilCode: "PREFET_REGION",
        date_creation: new Date(Date.now() - 1 * 60 * 60 * 1000),
      });
      await fixtures.habilitation({
        utilisateurId: comptePrefet.id,
        territoires: [territoireReg.code],
      });

      const compteDitp = await fixtures.utilisateur({
        profilCode: "DITP_ADMIN",
        date_creation: new Date(Date.now() - 1 * 60 * 60 * 1000),
      });
      await fixtures.habilitation({
        utilisateurId: compteDitp.id,
        territoires: [territoireReg.code],
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
      const territoire = await fixtures.territoire({
        code: randomUUID(),
        nom: "Paris",
        maille: "DEPT",
      });

      const chantier = await fixtures.chantierIdentite({
        id: `CH-${randomUUID().slice(0, 6)}`,
        nom: "Chantier Test",
        statut: "PUBLIE",
      });

      await fixtures.chantierTerritoire({
        id: chantier.id,
        territoire_code: territoire.code,
      });

      const indicateur = await fixtures.indicateurIdentite({
        chantier_id: chantier.id,
        nom: "Indicateur Test",
      });

      await fixtures.indicateurTerritoire({
        id: indicateur.id,
        territoire_code: territoire.code,
        chantier_id: chantier.id,
      });

      const coordinateur = await fixtures.utilisateur({
        profilCode: "COORDINATEUR_DEPARTEMENT",
      });
      await fixtures.habilitation({
        utilisateurId: coordinateur.id,
        territoires: [territoire.code],
        chantiers: [chantier.id],
      });

      const auteur = await fixtures.utilisateur();
      await fixtures.indicateurTerritoireValeurEvenement({
        indic_id: indicateur.id,
        territoire_code: territoire.code,
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
            sectionActiviteChantiersVA: expect.objectContaining({
              chantiers: [
                expect.objectContaining({
                  chantier: expect.objectContaining({ nom: "Chantier Test" }),
                  indicateurs: [
                    expect.objectContaining({
                      indicateur: expect.objectContaining({
                        nom: "Indicateur Test",
                      }),
                      valeurApres: 75,
                    }),
                  ],
                }),
              ],
            }),
          }),
        }),
      ]);
    }),
  );

  it(
    "ne crée pas de rapport si le coordinateur n'a pas de chantiers habilités",
    createIntegrationTest(async () => {
      const territoire = await fixtures.territoire({
        code: randomUUID(),
        nom: "Paris",
        maille: "DEPT",
      });

      const coordinateur = await fixtures.utilisateur({
        profilCode: "COORDINATEUR_DEPARTEMENT",
      });
      await fixtures.habilitation({
        utilisateurId: coordinateur.id,
        territoires: [territoire.code],
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
      const territoire = await fixtures.territoire({
        code: randomUUID(),
        nom: "Paris",
        maille: "DEPT",
      });

      const chantier = await fixtures.chantierIdentite({
        nom: "Chantier Test",
        statut: "PUBLIE",
      });

      await fixtures.chantierTerritoire({
        id: chantier.id,
        territoire_code: territoire.code,
      });

      const indicateur = await fixtures.indicateurIdentite({
        chantier_id: chantier.id,
        nom: "Indicateur Test",
      });

      await fixtures.indicateurTerritoire({
        id: indicateur.id,
        territoire_code: territoire.code,
        chantier_id: chantier.id,
      });

      const coordinateur = await fixtures.utilisateur({
        profilCode: "COORDINATEUR_DEPARTEMENT",
      });
      await fixtures.habilitation({
        utilisateurId: coordinateur.id,
        territoires: [territoire.code],
        chantiers: [chantier.id],
      });

      const auteur = await fixtures.utilisateur();
      await fixtures.indicateurTerritoireValeurEvenement({
        indic_id: indicateur.id,
        territoire_code: territoire.code,
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
});
