import { PrismaPilote } from "@/server/db/PrismaPilote";
import { createIntegrationTest } from "@/server/infrastructure/test/createIntegrationTest";
import { fixtures } from "@/server/infrastructure/test/fixtures";
import { PrismaIndicateurTerritoireValeurEvenementRepository } from "@/server/mb-sync/infrastructure/adapters/PrismaIndicateurTerritoireValeurEvenementRepository";

const TERRITOIRE_CODE = "NAT-FR";
const INDIC_ID = "IND-003";

describe("PrismaIndicateurTerritoireValeurEvenementRepository", () => {
  let repository: PrismaIndicateurTerritoireValeurEvenementRepository;

  beforeEach(() => {
    repository = new PrismaIndicateurTerritoireValeurEvenementRepository({
      prisma: new PrismaPilote(),
    });
  });

  const seedIndicateur = async () => {
    const auteur = await fixtures.utilisateur();
    const chantier = await fixtures.chantierIdentite();
    await fixtures.chantierTerritoire({
      id: chantier.id,
      territoire_code: TERRITOIRE_CODE,
      maille: "NAT",
      code_insee: "FR",
      zone_id: "FRANCE",
    });
    await fixtures.indicateurIdentite({
      id: INDIC_ID,
      chantier_id: chantier.id,
      mailles_applicables: ["NAT"],
    });
    await fixtures.indicateurTerritoire({
      id: INDIC_ID,
      chantier_id: chantier.id,
      territoire_code: TERRITOIRE_CODE,
    });
    return { auteur };
  };

  describe("#recupererEvenementsDelta", () => {
    it(
      "retourne les événements créés ou modifiés après la date de sync",
      createIntegrationTest(async () => {
        // Given
        const { auteur } = await seedIndicateur();
        const dateValeur = new Date("2025-03-01");
        await fixtures.indicateurTerritoireValeurEvenement({
          indic_id: INDIC_ID,
          territoire_code: TERRITOIRE_CODE,
          id_auteur_modification: auteur.id,
          type_evenement: "VALEUR_CREEE",
          date_valeur: dateValeur,
          valeur: 42,
          ordre: 1,
        });
        const depuis = new Date(0);

        // When
        const evenements = await repository.recupererEvenementsModifiesDepuis({
          indicId: INDIC_ID,
          dateMin: depuis,
        });

        // Then
        expect(evenements).toEqual([
          expect.objectContaining({
            indicId: INDIC_ID,
            territoire_code: TERRITOIRE_CODE,
            valeur: 42,
          }),
        ]);
      }),
    );

    it(
      "retourne uniquement l'événement avec le plus grand ordre pour un même (indic_id, territoire_code, date_valeur)",
      createIntegrationTest(async () => {
        // Given
        const { auteur } = await seedIndicateur();
        const dateValeur = new Date("2025-03-01");
        await fixtures.indicateurTerritoireValeurEvenement({
          indic_id: INDIC_ID,
          territoire_code: TERRITOIRE_CODE,
          id_auteur_modification: auteur.id,
          type_evenement: "VALEUR_CREEE",
          date_valeur: dateValeur,
          valeur: 50,
          ordre: 1,
        });
        // deuxième événement sur la même date, ordre supérieur — doit être retenu
        await fixtures.indicateurTerritoireValeurEvenement({
          indic_id: INDIC_ID,
          territoire_code: TERRITOIRE_CODE,
          id_auteur_modification: auteur.id,
          type_evenement: "VALEUR_MODIFIEE",
          date_valeur: dateValeur,
          valeur: 75,
          ordre: 2,
        });

        // When
        const evenements = await repository.recupererEvenementsModifiesDepuis({
          indicId: INDIC_ID,
          dateMin: new Date(0),
        });

        // Then — seule la valeur 75 (ordre 2) est retournée
        expect(evenements).toEqual([expect.objectContaining({ valeur: 75 })]);
      }),
    );

    it(
      "exclut les événements antérieurs à la date de sync",
      createIntegrationTest(async () => {
        // Given
        const { auteur } = await seedIndicateur();
        await fixtures.indicateurTerritoireValeurEvenement({
          indic_id: INDIC_ID,
          territoire_code: TERRITOIRE_CODE,
          id_auteur_modification: auteur.id,
          type_evenement: "VALEUR_CREEE",
          date_valeur: new Date("2025-03-01"),
          valeur: 42,
          ordre: 1,
        });

        // When
        const evenements = await repository.recupererEvenementsModifiesDepuis({
          indicId: INDIC_ID,
          dateMin: new Date(),
        });

        // Then
        expect(evenements).toEqual([]);
      }),
    );

    it(
      "filtre les événements dont la maille du territoire n'est pas applicable à l'indicateur",
      createIntegrationTest(async () => {
        // Given — indicateur applicable uniquement en NAT, mais territoire en DEPT
        const auteur = await fixtures.utilisateur();
        const chantier = await fixtures.chantierIdentite();
        const territoireDept = "DEPT-01";
        await fixtures.chantierTerritoire({
          id: chantier.id,
          territoire_code: territoireDept,
          maille: "DEPT",
          code_insee: "01",
          zone_id: "01",
        });
        await fixtures.indicateurIdentite({
          id: INDIC_ID,
          chantier_id: chantier.id,
          mailles_applicables: ["NAT"],
        });
        await fixtures.indicateurTerritoire({
          id: INDIC_ID,
          chantier_id: chantier.id,
          territoire_code: territoireDept,
        });
        await fixtures.indicateurTerritoireValeurEvenement({
          indic_id: INDIC_ID,
          territoire_code: territoireDept,
          id_auteur_modification: auteur.id,
          type_evenement: "VALEUR_CREEE",
          date_valeur: new Date("2025-03-01"),
          valeur: 99,
          ordre: 1,
        });

        // When
        const evenements = await repository.recupererEvenementsModifiesDepuis({
          indicId: INDIC_ID,
          dateMin: new Date(0),
        });

        // Then
        expect(evenements).toEqual([]);
      }),
    );
  });
});
