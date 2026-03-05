import { $Enums } from "@prisma/client";
import { createIntegrationTest } from "@/server/infrastructure/test/createIntegrationTest";
import { fixtures } from "@/server/infrastructure/test/fixtures";
import { EnregistrerSyntheseDesResultatsService } from "@/server/syntheses-des-resultats/services/EnregistrerSyntheseDesResultatsService";
import { SynthèseDesRésultatsSQLRepository } from "@/server/infrastructure/accès_données/chantier/synthèseDesRésultats/SynthèseDesRésultatsSQLRepository";
import { PrismaChantierRepository } from "@/server/chantiers/infrastructure/adapters/PrismaChantierRepository";
import {
  creerSyntheseDesResultatsBrouillon,
  creerSyntheseDesResultatsPublie,
} from "@/server/syntheses-des-resultats/domain/SyntheseDesResultats";
import { InMemoryTransaction } from "@/server/db/InMemoryTransaction";

const TERRITOIRE_CODE = "DEPT-75";
const MAILLE = "DEPT";
const CODE_INSEE = "75";

describe("EnregistrerSyntheseDesResultatsService", () => {
  let service: EnregistrerSyntheseDesResultatsService;
  const transaction = new InMemoryTransaction();

  beforeEach(() => {
    service = new EnregistrerSyntheseDesResultatsService({
      synthèseDesRésultatsRepository: new SynthèseDesRésultatsSQLRepository(),
      chantierRepository: new PrismaChantierRepository(),
      transaction,
    });
  });

  it(
    "enregistre la synthese publiee en base",
    createIntegrationTest(async (prisma) => {
      // Given
      const auteur = await fixtures.utilisateur();
      const chantier = await fixtures.chantierIdentite();
      await fixtures.chantierTerritoire({
        id: chantier.id,
        territoire_code: TERRITOIRE_CODE,
        maille: MAILLE,
        code_insee: CODE_INSEE,
      });

      const synthese = creerSyntheseDesResultatsPublie({
        chantierId: chantier.id,
        territoireCode: TERRITOIRE_CODE,
        contenu: "Mon contenu publié",
        meteo: "SOLEIL",
        auteurId: auteur.id,
        date: new Date("2025-06-01").toISOString(),
      });

      // When
      await service.enregistrer(synthese);

      // Then
      const result = await prisma.synthese_des_resultats.findUnique({
        where: { id: synthese.id },
      });
      expect(result).toEqual(
        expect.objectContaining({
          id: synthese.id,
          chantier_id: chantier.id,
          territoire_code: TERRITOIRE_CODE,
          commentaire: "Mon contenu publié",
          meteo: "SOLEIL",
          statut: $Enums.statut_synthese_des_resultats.PUBLIE,
        }),
      );
    }),
  );

  it(
    "met a jour la meteo du chantier territoire quand le statut est PUBLIE",
    createIntegrationTest(async (prisma) => {
      // Given
      const auteur = await fixtures.utilisateur();
      const chantier = await fixtures.chantierIdentite();
      await fixtures.chantierTerritoire({
        id: chantier.id,
        territoire_code: TERRITOIRE_CODE,
        maille: MAILLE,
        code_insee: CODE_INSEE,
        meteo: "NON_RENSEIGNEE",
      });

      const synthese = creerSyntheseDesResultatsPublie({
        chantierId: chantier.id,
        territoireCode: TERRITOIRE_CODE,
        contenu: "Synthese publiee",
        meteo: "SOLEIL",
        auteurId: auteur.id,
        date: new Date("2025-06-01").toISOString(),
      });

      // When
      await service.enregistrer(synthese);

      // Then
      const chantierTerritoire = await prisma.chantier_territoire.findUnique({
        where: {
          id_territoire_code: {
            id: chantier.id,
            territoire_code: TERRITOIRE_CODE,
          },
        },
      });
      expect(chantierTerritoire?.meteo).toBe("SOLEIL");
    }),
  );

  it(
    "ne met pas a jour la meteo du chantier territoire quand le statut est BROUILLON",
    createIntegrationTest(async (prisma) => {
      // Given
      const auteur = await fixtures.utilisateur();
      const chantier = await fixtures.chantierIdentite();
      await fixtures.chantierTerritoire({
        id: chantier.id,
        territoire_code: TERRITOIRE_CODE,
        maille: MAILLE,
        code_insee: CODE_INSEE,
        meteo: "NON_RENSEIGNEE",
      });

      const brouillon = creerSyntheseDesResultatsBrouillon({
        chantierId: chantier.id,
        territoireCode: TERRITOIRE_CODE,
        contenu: "Mon brouillon",
        meteo: "ORAGE",
        auteurId: auteur.id,
        date: new Date("2025-06-01").toISOString(),
      });

      // When
      await service.enregistrer(brouillon);

      // Then
      const chantierTerritoire = await prisma.chantier_territoire.findUnique({
        where: {
          id_territoire_code: {
            id: chantier.id,
            territoire_code: TERRITOIRE_CODE,
          },
        },
      });
      expect(chantierTerritoire?.meteo).toBe("NON_RENSEIGNEE");
    }),
  );

  it(
    "met a jour la synthese existante sans creer de doublon",
    createIntegrationTest(async (prisma) => {
      // Given
      const auteur = await fixtures.utilisateur();
      const chantier = await fixtures.chantierIdentite();
      await fixtures.chantierTerritoire({
        id: chantier.id,
        territoire_code: TERRITOIRE_CODE,
        maille: MAILLE,
        code_insee: CODE_INSEE,
      });

      const synthese = creerSyntheseDesResultatsPublie({
        chantierId: chantier.id,
        territoireCode: TERRITOIRE_CODE,
        contenu: "Contenu initial",
        meteo: "NUAGE",
        auteurId: auteur.id,
        date: new Date("2025-01-01").toISOString(),
      });
      await service.enregistrer(synthese);

      // When
      const nouvelAuteur = await fixtures.utilisateur();
      await service.enregistrer({
        ...synthese,
        contenu: "Contenu modifié",
        meteo: "SOLEIL",
        auteurModificationId: nouvelAuteur.id,
        dateModification: new Date("2025-06-01").toISOString(),
      });

      // Then
      const results = await prisma.synthese_des_resultats.findMany({
        where: { id: synthese.id },
      });
      expect(results).toEqual([
        expect.objectContaining({
          id: synthese.id,
          commentaire: "Contenu modifié",
          meteo: "SOLEIL",
          auteur_modification_id: nouvelAuteur.id,
        }),
      ]);
    }),
  );
});
