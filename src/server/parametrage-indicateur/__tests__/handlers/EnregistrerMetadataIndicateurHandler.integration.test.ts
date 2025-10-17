import { EnregistrerMetadataIndicateurHandler } from "@/server/parametrage-indicateur/handlers/EnregistrerMetadataIndicateurHandler";
import { PrismaPilote } from "@/server/db/PrismaPilote";
import { prisma } from "@/server/db/prisma";
import { PrismaTransaction } from "@/server/db/PrismaTransaction";

describe("EnregistrerMetadataIndicateurHandler", () => {
  let handler: EnregistrerMetadataIndicateurHandler;
  const prismaPilote = new PrismaPilote();
  const transaction = new PrismaTransaction();

  beforeEach(() => {
    handler = new EnregistrerMetadataIndicateurHandler({
      prisma: prismaPilote,
      transaction,
    });
  });

  describe("execute", () => {
    it("doit créer de nouvelles métadonnées quand aucune n'existe", async () => {
      // Given
      const command = {
        metadataList: [
          {
            name: "test_metadata_1",
            dataType: "text" as const,
            description: "Description de test",
            estVisible: true,
            alias: "Test Métadonnée 1",
            estEditable: true,
            validationRegex: "",
            validationRegexErrorMessage: null,
            editBoxType: "text" as const,
            defaultValue: "valeur par défaut",
            estObligatoire: false,
            doitAfficherLaDescription: true,
            listeValeursAcceptes: [],
            groupe: "METADATA_INDICATEURS" as const,
            blocId: null,
          },
          {
            name: "test_metadata_2",
            dataType: "number" as const,
            description: "Description numérique",
            estVisible: true,
            alias: "Test Métadonnée 2",
            estEditable: false,
            validationRegex: "^[0-9]+$",
            validationRegexErrorMessage: "Doit être un nombre",
            editBoxType: "text" as const,
            defaultValue: 42,
            estObligatoire: true,
            doitAfficherLaDescription: false,
            listeValeursAcceptes: [],
            groupe: "METADATA_PARAMETRAGE_INDICATEURS" as const,
            blocId: 1,
          },
        ],
      };

      // When
      await handler.execute(command);

      // Then
      const metadata1 = await prisma.metadata_indicateur.findUnique({
        where: { name: "test_metadata_1" },
      });
      expect(metadata1).toMatchObject({
        name: "test_metadata_1",
        data_type: "text",
        description: "Description de test",
        est_visible: true,
        alias: "Test Métadonnée 1",
        est_editable: true,
        validation_regex: "",
        validation_regex_error_message: null,
        edit_box_type: "text",
        default_value: "valeur par défaut",
        est_obligatoire: false,
        doit_afficher_la_description: true,
        groupe: "METADATA_INDICATEURS",
        bloc_id: null,
      });

      const metadata2 = await prisma.metadata_indicateur.findUnique({
        where: { name: "test_metadata_2" },
      });
      expect(metadata2).toMatchObject({
        name: "test_metadata_2",
        data_type: "number",
        default_value: "42",
        est_obligatoire: true,
        groupe: "METADATA_PARAMETRAGE_INDICATEURS",
        bloc_id: 1,
      });
    });

    it("doit mettre à jour des métadonnées existantes", async () => {
      // Given - Créer une métadonnée existante
      await prisma.metadata_indicateur.create({
        data: {
          name: "test_metadata_update",
          data_type: "text",
          description: "Description initiale",
          est_visible: true,
          alias: "Alias initial",
          est_editable: true,
          validation_regex: "",
          validation_regex_error_message: null,
          edit_box_type: "text",
          default_value: "valeur initiale",
          est_obligatoire: false,
          doit_afficher_la_description: true,
          groupe: "METADATA_INDICATEURS",
          bloc_id: null,
        },
      });

      const command = {
        metadataList: [
          {
            name: "test_metadata_update",
            dataType: "text" as const,
            description: "Description modifiée",
            estVisible: false,
            alias: "Alias modifié",
            estEditable: false,
            validationRegex: "^[a-z]+$",
            validationRegexErrorMessage: "Lettres minuscules uniquement",
            editBoxType: "textarea" as const,
            defaultValue: "nouvelle valeur",
            estObligatoire: true,
            doitAfficherLaDescription: false,
            listeValeursAcceptes: [],
            groupe: "METADATA_PARAMETRAGE_INDICATEURS" as const,
            blocId: 2,
          },
        ],
      };

      // When
      await handler.execute(command);

      // Then
      const metadata = await prisma.metadata_indicateur.findUnique({
        where: { name: "test_metadata_update" },
      });
      expect(metadata).toMatchObject({
        name: "test_metadata_update",
        description: "Description modifiée",
        est_visible: false,
        alias: "Alias modifié",
        est_editable: false,
        validation_regex: "^[a-z]+$",
        validation_regex_error_message: "Lettres minuscules uniquement",
        edit_box_type: "textarea",
        default_value: "nouvelle valeur",
        est_obligatoire: true,
        doit_afficher_la_description: false,
        groupe: "METADATA_PARAMETRAGE_INDICATEURS",
        bloc_id: 2,
      });
    });

    it("doit supprimer les métadonnées qui ne sont plus dans la liste", async () => {
      // Given - Créer deux métadonnées
      await prisma.metadata_indicateur.create({
        data: {
          name: "test_metadata_keep",
          data_type: "text",
          description: "À conserver",
          est_visible: true,
          alias: "Keep",
          est_editable: true,
          validation_regex: "",
          validation_regex_error_message: null,
          edit_box_type: "text",
          default_value: null,
          est_obligatoire: false,
          doit_afficher_la_description: false,
          groupe: "METADATA_INDICATEURS",
          bloc_id: null,
        },
      });

      await prisma.metadata_indicateur.create({
        data: {
          name: "test_metadata_delete",
          data_type: "text",
          description: "À supprimer",
          est_visible: true,
          alias: "Delete",
          est_editable: true,
          validation_regex: "",
          validation_regex_error_message: null,
          edit_box_type: "text",
          default_value: null,
          est_obligatoire: false,
          doit_afficher_la_description: false,
          groupe: "METADATA_INDICATEURS",
          bloc_id: null,
        },
      });

      const command = {
        metadataList: [
          {
            name: "test_metadata_keep",
            dataType: "text" as const,
            description: "À conserver",
            estVisible: true,
            alias: "Keep",
            estEditable: true,
            validationRegex: "",
            validationRegexErrorMessage: null,
            editBoxType: "text" as const,
            defaultValue: null,
            estObligatoire: false,
            doitAfficherLaDescription: false,
            listeValeursAcceptes: [],
            groupe: "METADATA_INDICATEURS" as const,
            blocId: null,
          },
        ],
      };

      // When
      await handler.execute(command);

      // Then
      const metadataKeep = await prisma.metadata_indicateur.findUnique({
        where: { name: "test_metadata_keep" },
      });
      expect(metadataKeep).not.toBeNull();

      const metadataDelete = await prisma.metadata_indicateur.findUnique({
        where: { name: "test_metadata_delete" },
      });
      expect(metadataDelete).toBeNull();
    });

    it("doit créer les valeurs acceptées pour un multi-select", async () => {
      // Given
      const command = {
        metadataList: [
          {
            name: "test_metadata_multiselect",
            dataType: "text" as const,
            description: "Avec valeurs acceptées",
            estVisible: true,
            alias: "Multi-select",
            estEditable: true,
            validationRegex: "",
            validationRegexErrorMessage: null,
            editBoxType: "multi-select" as const,
            defaultValue: null,
            estObligatoire: false,
            doitAfficherLaDescription: false,
            listeValeursAcceptes: [
              {
                ordre: 1,
                valeur: "opt1",
                nom: "Option 1",
                description: "Première option",
              },
              {
                ordre: 2,
                valeur: "opt2",
                nom: "Option 2",
                description: "Deuxième option",
              },
              {
                ordre: 3,
                valeur: "opt3",
                nom: "Option 3",
                description: "Troisième option",
              },
            ],
            groupe: "METADATA_INDICATEURS" as const,
            blocId: null,
          },
        ],
      };

      // When
      await handler.execute(command);

      // Then
      const metadata = await prisma.metadata_indicateur.findUnique({
        where: { name: "test_metadata_multiselect" },
        include: {
          valeurs_acceptees: {
            orderBy: { ordre: "asc" },
          },
        },
      });

      expect(metadata).not.toBeNull();
      expect(metadata?.valeurs_acceptees).toHaveLength(3);
      expect(metadata?.valeurs_acceptees[0]).toMatchObject({
        ordre: 1,
        valeur: "opt1",
        nom: "Option 1",
        description: "Première option",
      });
      expect(metadata?.valeurs_acceptees[1]).toMatchObject({
        ordre: 2,
        valeur: "opt2",
        nom: "Option 2",
        description: "Deuxième option",
      });
      expect(metadata?.valeurs_acceptees[2]).toMatchObject({
        ordre: 3,
        valeur: "opt3",
        nom: "Option 3",
        description: "Troisième option",
      });
    });

    it("doit remplacer les valeurs acceptées lors d'une mise à jour", async () => {
      // Given - Créer une métadonnée avec des valeurs acceptées
      await prisma.metadata_indicateur.create({
        data: {
          name: "test_metadata_replace_values",
          data_type: "text",
          description: "Test",
          est_visible: true,
          alias: "Test",
          est_editable: true,
          validation_regex: "",
          validation_regex_error_message: null,
          edit_box_type: "multi-select",
          default_value: null,
          est_obligatoire: false,
          doit_afficher_la_description: false,
          groupe: "METADATA_INDICATEURS",
          bloc_id: null,
          valeurs_acceptees: {
            create: [
              {
                ordre: 1,
                valeur: "old1",
                nom: "Ancienne 1",
                description: "Ancienne option 1",
              },
              {
                ordre: 2,
                valeur: "old2",
                nom: "Ancienne 2",
                description: "Ancienne option 2",
              },
            ],
          },
        },
      });

      const command = {
        metadataList: [
          {
            name: "test_metadata_replace_values",
            dataType: "text" as const,
            description: "Test",
            estVisible: true,
            alias: "Test",
            estEditable: true,
            validationRegex: "",
            validationRegexErrorMessage: null,
            editBoxType: "multi-select" as const,
            defaultValue: null,
            estObligatoire: false,
            doitAfficherLaDescription: false,
            listeValeursAcceptes: [
              {
                ordre: 1,
                valeur: "new1",
                nom: "Nouvelle 1",
                description: "Nouvelle option 1",
              },
            ],
            groupe: "METADATA_INDICATEURS" as const,
            blocId: null,
          },
        ],
      };

      // When
      await handler.execute(command);

      // Then
      const metadata = await prisma.metadata_indicateur.findUnique({
        where: { name: "test_metadata_replace_values" },
        include: {
          valeurs_acceptees: {
            orderBy: { ordre: "asc" },
          },
        },
      });

      expect(metadata?.valeurs_acceptees).toHaveLength(1);
      expect(metadata?.valeurs_acceptees[0]).toMatchObject({
        ordre: 1,
        valeur: "new1",
        nom: "Nouvelle 1",
        description: "Nouvelle option 1",
      });
    });

    it("doit gérer les valeurs par défaut de différents types", async () => {
      // Given
      const command = {
        metadataList: [
          {
            name: "test_default_string",
            dataType: "text" as const,
            description: "Test string",
            estVisible: true,
            alias: "String",
            estEditable: true,
            validationRegex: "",
            validationRegexErrorMessage: null,
            editBoxType: "text" as const,
            defaultValue: "test string",
            estObligatoire: false,
            doitAfficherLaDescription: false,
            listeValeursAcceptes: [],
            groupe: "METADATA_INDICATEURS" as const,
            blocId: null,
          },
          {
            name: "test_default_number",
            dataType: "number" as const,
            description: "Test number",
            estVisible: true,
            alias: "Number",
            estEditable: true,
            validationRegex: "",
            validationRegexErrorMessage: null,
            editBoxType: "text" as const,
            defaultValue: 123,
            estObligatoire: false,
            doitAfficherLaDescription: false,
            listeValeursAcceptes: [],
            groupe: "METADATA_INDICATEURS" as const,
            blocId: null,
          },
          {
            name: "test_default_boolean",
            dataType: "boolean" as const,
            description: "Test boolean",
            estVisible: true,
            alias: "Boolean",
            estEditable: true,
            validationRegex: "",
            validationRegexErrorMessage: null,
            editBoxType: "boolean" as const,
            defaultValue: true,
            estObligatoire: false,
            doitAfficherLaDescription: false,
            listeValeursAcceptes: [],
            groupe: "METADATA_INDICATEURS" as const,
            blocId: null,
          },
          {
            name: "test_default_null",
            dataType: "text" as const,
            description: "Test null",
            estVisible: true,
            alias: "Null",
            estEditable: true,
            validationRegex: "",
            validationRegexErrorMessage: null,
            editBoxType: "text" as const,
            defaultValue: null,
            estObligatoire: false,
            doitAfficherLaDescription: false,
            listeValeursAcceptes: [],
            groupe: "METADATA_INDICATEURS" as const,
            blocId: null,
          },
        ],
      };

      // When
      await handler.execute(command);

      // Then
      const metadataString = await prisma.metadata_indicateur.findUnique({
        where: { name: "test_default_string" },
      });
      expect(metadataString?.default_value).toBe("test string");

      const metadataNumber = await prisma.metadata_indicateur.findUnique({
        where: { name: "test_default_number" },
      });
      expect(metadataNumber?.default_value).toBe("123");

      const metadataBoolean = await prisma.metadata_indicateur.findUnique({
        where: { name: "test_default_boolean" },
      });
      expect(metadataBoolean?.default_value).toBe("true");

      const metadataNull = await prisma.metadata_indicateur.findUnique({
        where: { name: "test_default_null" },
      });
      expect(metadataNull?.default_value).toBeNull();
    });
  });
});
