import { getContainer } from '@/server/dependances';
import {
  PrismaMetadataParametrageIndicateurQuery,
} from '@/server/parametrage-indicateur/infrastructure/queries/PrismaMetadataParametrageIndicateurQuery';
import { prisma } from '@/server/db/prisma';

describe('PrismaMetadataParametrageIndicateurQuery', () => {
  let prismaMetadataParametrageIndicateurQuery: PrismaMetadataParametrageIndicateurQuery;

  beforeEach(() => {
    prismaMetadataParametrageIndicateurQuery = getContainer('parametrageIndicateur').resolve('metadataParametrageIndicateurQuery');
  });

  describe('recupererInformationDerniereModification', () => {
    it("Quand il n'y a pas historique de modification concernant l'indicateur, doit remonter des informations de base", async () => {
      // Given
      const indicId = 'a1217dba-f725-4b70-af96-5d3b6e393853';

      // When
      const informationDerniereModification = await prismaMetadataParametrageIndicateurQuery.recupererInformationDerniereModification({ indicId });

      // Then
      expect(informationDerniereModification).toEqual({
        auteurModification: 'DITP Admin',
        dateDerniereModification: '31/01/2024',
      });
    });

    it("Quand il existe un historique de modification mais que ca n'appartient pas à notre indicateur, doit remonter des informations de base", async () => {
      // Given
      const indicId = 'a1217dba-f725-4b70-af96-5d3b6e393853';
      await prisma.metadata_indicateurs.create({
        data: {
          indic_id: indicId,
          indic_nom: 'Un indicateur',
          indic_parent_ch: '',
        },
      });
      await prisma.historisation_modification.create({
        data: {
          id: '1b6b26f3-90a3-4e36-9c12-2dd4c4f5049d',
          id_objet_modifie: '5d657551-baf4-4a67-9752-b3c59effabb1',
          table_modifie_id: 'indicateur',
          ancienne_valeur: {},
          nouvelle_valeur: {},
          utilisateur_nom: 'Eloge',
          date_de_modification: '2024-04-31',
          type_de_modification: 'creation',
        },
      });

      // When
      const informationDerniereModification = await prismaMetadataParametrageIndicateurQuery.recupererInformationDerniereModification({ indicId });

      // Then
      expect(informationDerniereModification).toEqual({
        auteurModification: 'DITP Admin',
        dateDerniereModification: '31/01/2024',
      });
    });

    it('Quand il existe un historique de modification en création et ça appartient à un autre type de table, doit remonter des informations de base', async () => {
      // Given
      const indicId = 'a1217dba-f725-4b70-af96-5d3b6e393853';
      await prisma.metadata_indicateurs.create({
        data: {
          indic_id: indicId,
          indic_nom: 'Un indicateur',
          indic_parent_ch: '',
        },
      });
      await prisma.historisation_modification.create({
        data: {
          id: '1b6b26f3-90a3-4e36-9c12-2dd4c4f5049d',
          id_objet_modifie: indicId,
          table_modifie_id: 'utilisateur',
          ancienne_valeur: {},
          nouvelle_valeur: {},
          utilisateur_nom: 'Eloge',
          date_de_modification: '2024-04-29',
          type_de_modification: 'creation',
        },
      });

      // When
      const informationDerniereModification = await prismaMetadataParametrageIndicateurQuery.recupererInformationDerniereModification({ indicId });

      // Then
      expect(informationDerniereModification).toEqual({
        auteurModification: 'DITP Admin',
        dateDerniereModification: '31/01/2024',
      });
    });

    it('Quand il existe un historique de modification en création et ça appartient à notre indicateur, doit remonter des informations de base', async () => {
      // Given
      const indicId = 'a1217dba-f725-4b70-af96-5d3b6e393853';
      await prisma.metadata_indicateurs.create({
        data: {
          indic_id: indicId,
          indic_nom: 'Un indicateur',
          indic_parent_ch: '',
        },
      });
      await prisma.historisation_modification.create({
        data: {
          id: '1b6b26f3-90a3-4e36-9c12-2dd4c4f5049d',
          id_objet_modifie: indicId,
          table_modifie_id: 'metadata_indicateurs',
          ancienne_valeur: {},
          nouvelle_valeur: {},
          utilisateur_nom: 'Eloge',
          date_de_modification: '2024-04-29',
          type_de_modification: 'creation',
        },
      });

      // When
      const informationDerniereModification = await prismaMetadataParametrageIndicateurQuery.recupererInformationDerniereModification({ indicId });

      // Then
      expect(informationDerniereModification).toEqual({
        auteurModification: 'Eloge',
        dateDerniereModification: '29/04/2024',
      });
    });

    it('Quand il existe un historique de modification en création et en modification et ça appartient à notre indicateur, doit remonter des informations de base', async () => {
      // Given
      const indicId = 'a1217dba-f725-4b70-af96-5d3b6e393853';
      await prisma.metadata_indicateurs.create({
        data: {
          indic_id: indicId,
          indic_nom: 'Un indicateur',
          indic_parent_ch: '',
        },
      });
      await prisma.historisation_modification.create({
        data: {
          id: '1b6b26f3-90a3-4e36-9c12-2dd4c4f5049d',
          id_objet_modifie: indicId,
          table_modifie_id: 'metadata_indicateurs',
          ancienne_valeur: {},
          nouvelle_valeur: {},
          utilisateur_nom: 'Eloge',
          date_de_modification: '2024-04-29',
          type_de_modification: 'creation',
        },
      });

      await prisma.historisation_modification.create({
        data: {
          id: 'f5824077-2db1-42b3-9092-6ce280e4b425',
          id_objet_modifie: indicId,
          table_modifie_id: 'metadata_indicateurs',
          ancienne_valeur: {},
          nouvelle_valeur: {},
          utilisateur_nom: 'Zakaria',
          date_de_modification: '2024-05-01',
          type_de_modification: 'modification',
        },
      });

      // When
      const informationDerniereModification = await prismaMetadataParametrageIndicateurQuery.recupererInformationDerniereModification({ indicId });

      // Then
      expect(informationDerniereModification).toEqual({
        auteurModification: 'Zakaria',
        dateDerniereModification: '01/05/2024',
      });
    });

    it('Quand il existe un historique de modification en création et plusieurs modifications et ça appartient à notre indicateur, doit remonter des informations de base', async () => {
      // Given
      const indicId = 'a1217dba-f725-4b70-af96-5d3b6e393853';
      await prisma.metadata_indicateurs.create({
        data: {
          indic_id: indicId,
          indic_nom: 'Un indicateur',
          indic_parent_ch: '',
        },
      });
      await prisma.historisation_modification.create({
        data: {
          id: '1b6b26f3-90a3-4e36-9c12-2dd4c4f5049d',
          id_objet_modifie: indicId,
          table_modifie_id: 'metadata_indicateurs',
          ancienne_valeur: {},
          nouvelle_valeur: {},
          utilisateur_nom: 'Eloge',
          date_de_modification: '2024-04-29',
          type_de_modification: 'creation',
        },
      });

      await prisma.historisation_modification.create({
        data: {
          id: '21aff297-d683-448b-930a-0b7ad4e07ee2',
          id_objet_modifie: indicId,
          table_modifie_id: 'metadata_indicateurs',
          ancienne_valeur: {},
          nouvelle_valeur: {},
          utilisateur_nom: 'Gaelle',
          date_de_modification: '2024-05-10',
          type_de_modification: 'modification',
        },
      });

      await prisma.historisation_modification.create({
        data: {
          id: 'f5824077-2db1-42b3-9092-6ce280e4b425',
          id_objet_modifie: indicId,
          table_modifie_id: 'metadata_indicateurs',
          ancienne_valeur: {},
          nouvelle_valeur: {},
          utilisateur_nom: 'Zakaria',
          date_de_modification: '2024-05-01',
          type_de_modification: 'modification',
        },
      });

      // When
      const informationDerniereModification = await prismaMetadataParametrageIndicateurQuery.recupererInformationDerniereModification({ indicId });

      // Then
      expect(informationDerniereModification).toEqual({
        auteurModification: 'Gaelle',
        dateDerniereModification: '10/05/2024',
      });
    });
  });
});
