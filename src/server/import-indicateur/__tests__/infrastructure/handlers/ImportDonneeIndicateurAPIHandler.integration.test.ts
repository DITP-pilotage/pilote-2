import nock from 'nock';
import { mock } from 'jest-mock-extended';
import PersistentFile from 'formidable/PersistentFile';
import { createMocks } from 'node-mocks-http';
import { NextApiRequest, NextApiResponse } from 'next';
import { ReportValidataBuilder } from '@/server/import-indicateur/app/builder/ReportValidata.builder';
import {
  ReportResourceTaskBuilder,
  ReportTaskBuilder,
} from '@/server/import-indicateur/app/builder/ReportTask.builder';
import { ReportErrorTaskBuilder } from '@/server/import-indicateur/app/builder/ReportErrorTask.builder';
import UtilisateurÀCréerOuMettreÀJourBuilder from '@/server/domain/utilisateur/UtilisateurÀCréerOuMettreÀJour.builder';
import { dependencies } from '@/server/infrastructure/Dependencies';
import { prisma } from '@/server/infrastructure/test/integrationTestSetup';
import {
  handleImportDonneeIndicateurAPI,
} from '@/server/import-indicateur/infrastructure/handlers/ImportDonneeIndicateurAPIHandler';

jest.mock('@/server/import-indicateur/infrastructure/handlers/ParseForm', () => ({
  parseForm: () => ({
    file: mock<PersistentFile>(),
  }),
}));
jest.mock('@/server/import-indicateur/infrastructure/adapters/FichierService.ts', () => ({
  recupererFichier: () => 'fichierRécupéré',
  supprimerLeFichier: () => 'fichierSupprimé',
}));

const BASE_URL_VALIDATA = 'https://api.validata.etalab.studio';

describe('ImportDonneeIndicateurAPIHandler', () => {
  describe('quand on import un fichier via une donnee en JSON', () => {
    it('quand le fichier est invalide a cause de validata, doit remonter les erreurs validata', async () => {
      // Given
      const report = new ReportValidataBuilder()
        .avecValid(false)
        .avecTasks(
          new ReportTaskBuilder()
            .avecErrors(
              new ReportErrorTaskBuilder()
                .avecCell('cellule 1')
                .avecName('nom 1')
                .avecFieldName('nom du champ 1')
                .avecFieldPosition(1)
                .avecMessage('message 1')
                .avecRowNumber(1)
                .avecRowPosition(1)
                .build(),
              new ReportErrorTaskBuilder()
                .avecCell('cellule 2')
                .avecName('nom 2')
                .avecFieldName('nom du champ 2')
                .avecFieldPosition(2)
                .avecMessage('message 2')
                .avecRowNumber(2)
                .avecRowPosition(2)
                .build(),
            ).avecResource(
              new ReportResourceTaskBuilder()
                .avecData([
                  ['identifiant_indic', 'zone_id', 'date_valeur', 'type_valeur', 'valeur'],
                  ['IND-001', 'D12', '2023-03-31', 'va', '9'],
                  ['IND-001', 'D13', '2023-01-17', 'vc', '12'],
                  ['IND-001', 'D14', '2023-02-26', 'vi', '20'],
                ])
                .build(),
            )
            .build(),
        ).build();

      const utilisateur = new UtilisateurÀCréerOuMettreÀJourBuilder().avecEmail('ditp.admin@example.com').avecProfil('DITP_ADMIN').avecHabilitationsLecture([], [], []).build();
      await dependencies.getUtilisateurRepository().créerOuMettreÀJour(utilisateur as any, 'test');

      nock(BASE_URL_VALIDATA)
        .post('/validate').reply(200,
          JSON.stringify({ report }),
        );
      // When
      // Les données sont mockés après dans le retour validata
      const body = {
        donnees: [],
      };

      const { req: request, res: response } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        query: { indicateurId: 'IND-001' },
      });

      request.read = mock<() => string>(() => JSON.stringify(body));

      await handleImportDonneeIndicateurAPI({ request, response, email: 'ditp.admin@example.com', profil: 'DITP_ADMIN' });
      // Then
      const data = response._getJSONData();
      expect(response._getStatusCode()).toEqual(400);
      expect(data.message).toEqual("Une erreur est survenue lors de l'import des données");
      expect(data.erreurs[0].cellule).toEqual('cellule 1');
      expect(data.erreurs[0].nomDuChamp).toEqual('nom du champ 1');
      expect(data.erreurs[0].message).toEqual('message 1');

      expect(data.erreurs[1].cellule).toEqual('cellule 2');
      expect(data.erreurs[1].nomDuChamp).toEqual('nom du champ 2');
      expect(data.erreurs[1].message).toEqual('message 2');
    });

    it('quand le fichier est invalide a cause de validata, doit sauvegarder les erreurs validata', async () => {
      // Given
      const report = new ReportValidataBuilder()
        .avecValid(false)
        .avecTasks(
          new ReportTaskBuilder()
            .avecErrors(
              new ReportErrorTaskBuilder()
                .avecCell('cellule 1')
                .avecName('nom 1')
                .avecFieldName('nom du champ 1')
                .avecFieldPosition(1)
                .avecMessage('message 1')
                .avecRowNumber(1)
                .avecRowPosition(1)
                .build(),
              new ReportErrorTaskBuilder()
                .avecCell('cellule 2')
                .avecName('nom 2')
                .avecFieldName('nom du champ 2')
                .avecFieldPosition(2)
                .avecMessage('message 2')
                .avecRowNumber(2)
                .avecRowPosition(2)
                .build(),
            ).avecResource(
              new ReportResourceTaskBuilder()
                .avecData([
                  ['identifiant_indic', 'zone_id', 'date_valeur', 'type_valeur', 'valeur'],
                  ['IND-001', 'D12', '2023-03-31', 'va', '9'],
                  ['IND-001', 'D13', '2023-01-17', 'vc', '12'],
                  ['IND-001', 'D14', '2023-02-26', 'vi', '20'],
                ])
                .build(),
            )
            .build(),
        ).build();

      const utilisateur = new UtilisateurÀCréerOuMettreÀJourBuilder().avecEmail('ditp.admin@example.com').avecProfil('DITP_ADMIN').avecHabilitationsLecture([], [], []).build();
      await dependencies.getUtilisateurRepository().créerOuMettreÀJour(utilisateur as any, 'test');

      nock(BASE_URL_VALIDATA)
        .post('/validate').reply(200,
          JSON.stringify({ report }),
        );
      // When
      // Les données sont mockés après dans le retour validata
      const body = {
        donnees: [],
      };

      const { req: request, res: response } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        query: { indicateurId: 'IND-001' },
      });

      request.read = mock<() => string>(() => JSON.stringify(body));

      await handleImportDonneeIndicateurAPI({ request, response, email: 'ditp.admin@example.com', profil: 'DITP_ADMIN' });
      // Then
      expect(response._getStatusCode()).toEqual(400);
      const listeErreursValidationFichier = await prisma.erreur_validation_fichier.findMany();
      expect(listeErreursValidationFichier[0].cellule).toEqual('cellule 1');
      expect(listeErreursValidationFichier[0].nom).toEqual('nom 1');
      expect(listeErreursValidationFichier[0].message).toEqual('message 1');
      expect(listeErreursValidationFichier[0].numero_de_ligne).toEqual(1);
      expect(listeErreursValidationFichier[0].position_de_ligne).toEqual(1);
      expect(listeErreursValidationFichier[0].nom_du_champ).toEqual('nom du champ 1');
      expect(listeErreursValidationFichier[0].position_du_champ).toEqual(1);

      expect(listeErreursValidationFichier[1].cellule).toEqual('cellule 2');
      expect(listeErreursValidationFichier[1].nom).toEqual('nom 2');
      expect(listeErreursValidationFichier[1].message).toEqual('message 2');
      expect(listeErreursValidationFichier[1].numero_de_ligne).toEqual(2);
      expect(listeErreursValidationFichier[1].position_de_ligne).toEqual(2);
      expect(listeErreursValidationFichier[1].nom_du_champ).toEqual('nom du champ 2');
      expect(listeErreursValidationFichier[1].position_du_champ).toEqual(2);
    });

    it('quand le fichier est invalide a cause de règle DITP <<indic_id request different des indic_id dans fichier>>, doit sauvegarder les erreurs', async () => {
      // Given
      const report = new ReportValidataBuilder()
        .avecValid(true)
        .avecTasks(
          new ReportTaskBuilder()
            .avecResource(
              new ReportResourceTaskBuilder()
                .avecData([
                  ['identifiant_indic', 'zone_id', 'date_valeur', 'type_valeur', 'valeur'],
                  ['IND-002', 'D12', '2023-03-31', 'va', '9'],
                  ['IND-002', 'D13', '2023-01-17', 'vc', '12'],
                  ['IND-002', 'D14', '2023-02-26', 'vi', '20'],
                ])
                .build(),
            )
            .build(),
        ).build();

      const utilisateur = new UtilisateurÀCréerOuMettreÀJourBuilder().avecEmail('ditp.admin@example.com').avecProfil('DITP_ADMIN').avecHabilitationsLecture([], [], []).build();
      await dependencies.getUtilisateurRepository().créerOuMettreÀJour(utilisateur as any, 'test');

      nock(BASE_URL_VALIDATA)
        .post('/validate').reply(200,
          JSON.stringify({ report }),
        );
      // When
      // Les données sont mockés après dans le retour validata
      const body = {
        donnees: [],
      };

      const { req: request, res: response } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        query: { indicateurId: 'IND-001' },
      });

      request.read = mock<() => string>(() => JSON.stringify(body));

      await handleImportDonneeIndicateurAPI({ request, response, email: 'ditp.admin@example.com', profil: 'DITP_ADMIN' });
      // Then
      expect(response._getStatusCode()).toEqual(400);
      const listeErreursValidationFichier = await prisma.erreur_validation_fichier.findMany();
      expect(listeErreursValidationFichier[0].cellule).toEqual('IND-002');
      expect(listeErreursValidationFichier[0].nom).toEqual('Indicateur invalide');
      expect(listeErreursValidationFichier[0].message).toEqual("L'indicateur IND-002 ne correpond pas à l'indicateur choisis (IND-001)");
      expect(listeErreursValidationFichier[0].nom_du_champ).toEqual('indic_id');

      expect(listeErreursValidationFichier[1].cellule).toEqual('IND-002');
      expect(listeErreursValidationFichier[1].nom).toEqual('Indicateur invalide');
      expect(listeErreursValidationFichier[1].message).toEqual("L'indicateur IND-002 ne correpond pas à l'indicateur choisis (IND-001)");
      expect(listeErreursValidationFichier[1].nom_du_champ).toEqual('indic_id');

      expect(listeErreursValidationFichier[2].cellule).toEqual('IND-002');
      expect(listeErreursValidationFichier[2].nom).toEqual('Indicateur invalide');
      expect(listeErreursValidationFichier[2].message).toEqual("L'indicateur IND-002 ne correpond pas à l'indicateur choisis (IND-001)");
      expect(listeErreursValidationFichier[2].nom_du_champ).toEqual('indic_id');
    });

    it('quand le fichier est valide, doit importer les données', async () => {
      // Given
      const report = new ReportValidataBuilder()
        .avecValid(true)
        .avecTasks(
          new ReportTaskBuilder()
            .avecResource(
              new ReportResourceTaskBuilder()
                .avecData([
                  ['identifiant_indic', 'zone_id', 'date_valeur', 'type_valeur', 'valeur'],
                  ['IND-001', 'D12', '2023-03-31', 'va', '9'],
                  ['IND-001', 'D13', '2023-01-17', 'vc', '12'],
                  ['IND-001', 'D14', '2023-02-26', 'vi', '20'],
                ])
                .build(),
            )
            .build(),
        ).build();

      const utilisateur = new UtilisateurÀCréerOuMettreÀJourBuilder().avecEmail('ditp.admin@example.com').avecProfil('DITP_ADMIN').avecHabilitationsLecture([], [], []).build();
      await dependencies.getUtilisateurRepository().créerOuMettreÀJour(utilisateur as any, 'test');

      nock(BASE_URL_VALIDATA)
        .post('/validate').reply(200,
          JSON.stringify({ report }),
        );
      // When
      // Les données sont mockés après dans le retour validata
      const body = {
        donnees: [],
      };

      const { req: request, res: response } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        query: { indicateurId: 'IND-001' },
      });

      request.read = mock<() => string>(() => JSON.stringify(body));

      await handleImportDonneeIndicateurAPI({ request, response, email: 'ditp.admin@example.com', profil: 'DITP_ADMIN' });
      // Then
      expect(response._getStatusCode()).toEqual(200);
      expect(response._getJSONData().message).toEqual('Les données ont correctement été importés');
      const listeMesuresIndicateursTemporaire = await prisma.mesure_indicateur_temporaire.findMany({});
      const listeMesuresIndicateurs = await prisma.mesure_indicateur.findMany({});

      expect(listeMesuresIndicateursTemporaire).toHaveLength(0);

      expect(listeMesuresIndicateurs).toHaveLength(3);
      expect(listeMesuresIndicateurs.at(0)?.indic_id).toEqual('IND-001');
      expect(listeMesuresIndicateurs.at(1)?.indic_id).toEqual('IND-001');
      expect(listeMesuresIndicateurs.at(2)?.indic_id).toEqual('IND-001');
    });
  });

  describe('quand on import un fichier via une donnee en CSV', () => {
    it('quand le fichier est invalide a cause de validata, doit remonter les erreurs validata', async () => {
      // Given
      const report = new ReportValidataBuilder()
        .avecValid(false)
        .avecTasks(
          new ReportTaskBuilder()
            .avecErrors(
              new ReportErrorTaskBuilder()
                .avecCell('cellule 1')
                .avecName('nom 1')
                .avecFieldName('nom du champ 1')
                .avecFieldPosition(1)
                .avecMessage('message 1')
                .avecRowNumber(1)
                .avecRowPosition(1)
                .build(),
              new ReportErrorTaskBuilder()
                .avecCell('cellule 2')
                .avecName('nom 2')
                .avecFieldName('nom du champ 2')
                .avecFieldPosition(2)
                .avecMessage('message 2')
                .avecRowNumber(2)
                .avecRowPosition(2)
                .build(),
            ).avecResource(
              new ReportResourceTaskBuilder()
                .avecData([
                  ['identifiant_indic', 'zone_id', 'date_valeur', 'type_valeur', 'valeur'],
                  ['IND-001', 'D12', '2023-03-31', 'va', '9'],
                  ['IND-001', 'D13', '2023-01-17', 'vc', '12'],
                  ['IND-001', 'D14', '2023-02-26', 'vi', '20'],
                ])
                .build(),
            )
            .build(),
        ).build();

      const utilisateur = new UtilisateurÀCréerOuMettreÀJourBuilder().avecEmail('ditp.admin@example.com').avecProfil('DITP_ADMIN').avecHabilitationsLecture([], [], []).build();
      await dependencies.getUtilisateurRepository().créerOuMettreÀJour(utilisateur as any, 'test');

      nock(BASE_URL_VALIDATA)
        .post('/validate').reply(200,
          JSON.stringify({ report }),
        );
      // When
      const formData = new FormData();
      const file = mock<File>();
      formData.append('file', file);

      const { req: request, res: response } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'POST',
        body: formData,
        headers: {
          'content-type': 'multipart/form-data',
        },
        query: { indicateurId: 'IND-001' },
      });

      await handleImportDonneeIndicateurAPI({ request, response, email: 'ditp.admin@example.com', profil: 'DITP_ADMIN' });
      // Then
      const data = response._getJSONData();
      expect(response._getStatusCode()).toEqual(400);
      expect(data.message).toEqual("Une erreur est survenue lors de l'import des données");
      expect(data.erreurs[0].cellule).toEqual('cellule 1');
      expect(data.erreurs[0].nomDuChamp).toEqual('nom du champ 1');
      expect(data.erreurs[0].message).toEqual('message 1');

      expect(data.erreurs[1].cellule).toEqual('cellule 2');
      expect(data.erreurs[1].nomDuChamp).toEqual('nom du champ 2');
      expect(data.erreurs[1].message).toEqual('message 2');
    });

    it('quand le fichier est invalide a cause de validata, doit sauvegarder les erreurs validata', async () => {
      // Given
      const report = new ReportValidataBuilder()
        .avecValid(false)
        .avecTasks(
          new ReportTaskBuilder()
            .avecErrors(
              new ReportErrorTaskBuilder()
                .avecCell('cellule 1')
                .avecName('nom 1')
                .avecFieldName('nom du champ 1')
                .avecFieldPosition(1)
                .avecMessage('message 1')
                .avecRowNumber(1)
                .avecRowPosition(1)
                .build(),
              new ReportErrorTaskBuilder()
                .avecCell('cellule 2')
                .avecName('nom 2')
                .avecFieldName('nom du champ 2')
                .avecFieldPosition(2)
                .avecMessage('message 2')
                .avecRowNumber(2)
                .avecRowPosition(2)
                .build(),
            ).avecResource(
              new ReportResourceTaskBuilder()
                .avecData([
                  ['identifiant_indic', 'zone_id', 'date_valeur', 'type_valeur', 'valeur'],
                  ['IND-001', 'D12', '2023-03-31', 'va', '9'],
                  ['IND-001', 'D13', '2023-01-17', 'vc', '12'],
                  ['IND-001', 'D14', '2023-02-26', 'vi', '20'],
                ])
                .build(),
            )
            .build(),
        ).build();

      const utilisateur = new UtilisateurÀCréerOuMettreÀJourBuilder().avecEmail('ditp.admin@example.com').avecProfil('DITP_ADMIN').avecHabilitationsLecture([], [], []).build();
      await dependencies.getUtilisateurRepository().créerOuMettreÀJour(utilisateur as any, 'test');

      nock(BASE_URL_VALIDATA)
        .post('/validate').reply(200,
          JSON.stringify({ report }),
        );
      // When
      const formData = new FormData();
      const file = mock<File>();
      formData.append('file', file);

      const { req: request, res: response } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'POST',
        body: formData,
        headers: {
          'content-type': 'multipart/form-data',
        },
        query: { indicateurId: 'IND-001' },
      });

      await handleImportDonneeIndicateurAPI({ request, response, email: 'ditp.admin@example.com', profil: 'DITP_ADMIN' });
      // Then
      expect(response._getStatusCode()).toEqual(400);
      const listeErreursValidationFichier = await prisma.erreur_validation_fichier.findMany();
      expect(listeErreursValidationFichier[0].cellule).toEqual('cellule 1');
      expect(listeErreursValidationFichier[0].nom).toEqual('nom 1');
      expect(listeErreursValidationFichier[0].message).toEqual('message 1');
      expect(listeErreursValidationFichier[0].numero_de_ligne).toEqual(1);
      expect(listeErreursValidationFichier[0].position_de_ligne).toEqual(1);
      expect(listeErreursValidationFichier[0].nom_du_champ).toEqual('nom du champ 1');
      expect(listeErreursValidationFichier[0].position_du_champ).toEqual(1);

      expect(listeErreursValidationFichier[1].cellule).toEqual('cellule 2');
      expect(listeErreursValidationFichier[1].nom).toEqual('nom 2');
      expect(listeErreursValidationFichier[1].message).toEqual('message 2');
      expect(listeErreursValidationFichier[1].numero_de_ligne).toEqual(2);
      expect(listeErreursValidationFichier[1].position_de_ligne).toEqual(2);
      expect(listeErreursValidationFichier[1].nom_du_champ).toEqual('nom du champ 2');
      expect(listeErreursValidationFichier[1].position_du_champ).toEqual(2);
    });

    it('quand le fichier est invalide a cause de règle DITP <<indic_id request different des indic_id dans fichier>>, doit sauvegarder les erreurs', async () => {
      // Given
      const report = new ReportValidataBuilder()
        .avecValid(true)
        .avecTasks(
          new ReportTaskBuilder()
            .avecResource(
              new ReportResourceTaskBuilder()
                .avecData([
                  ['identifiant_indic', 'zone_id', 'date_valeur', 'type_valeur', 'valeur'],
                  ['IND-002', 'D12', '2023-03-31', 'va', '9'],
                  ['IND-002', 'D13', '2023-01-17', 'vc', '12'],
                  ['IND-002', 'D14', '2023-02-26', 'vi', '20'],
                ])
                .build(),
            )
            .build(),
        ).build();

      const utilisateur = new UtilisateurÀCréerOuMettreÀJourBuilder().avecEmail('ditp.admin@example.com').avecProfil('DITP_ADMIN').avecHabilitationsLecture([], [], []).build();
      await dependencies.getUtilisateurRepository().créerOuMettreÀJour(utilisateur as any, 'test');

      nock(BASE_URL_VALIDATA)
        .post('/validate').reply(200,
          JSON.stringify({ report }),
        );
      // When
      const formData = new FormData();
      const file = mock<File>();
      formData.append('file', file);

      const { req: request, res: response } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'POST',
        body: formData,
        headers: {
          'content-type': 'multipart/form-data',
        },
        query: { indicateurId: 'IND-001' },
      });

      await handleImportDonneeIndicateurAPI({ request, response, email: 'ditp.admin@example.com', profil: 'DITP_ADMIN' });
      // Then
      expect(response._getStatusCode()).toEqual(400);
      const listeErreursValidationFichier = await prisma.erreur_validation_fichier.findMany();
      expect(listeErreursValidationFichier[0].cellule).toEqual('IND-002');
      expect(listeErreursValidationFichier[0].nom).toEqual('Indicateur invalide');
      expect(listeErreursValidationFichier[0].message).toEqual("L'indicateur IND-002 ne correpond pas à l'indicateur choisis (IND-001)");
      expect(listeErreursValidationFichier[0].nom_du_champ).toEqual('indic_id');

      expect(listeErreursValidationFichier[1].cellule).toEqual('IND-002');
      expect(listeErreursValidationFichier[1].nom).toEqual('Indicateur invalide');
      expect(listeErreursValidationFichier[1].message).toEqual("L'indicateur IND-002 ne correpond pas à l'indicateur choisis (IND-001)");
      expect(listeErreursValidationFichier[1].nom_du_champ).toEqual('indic_id');

      expect(listeErreursValidationFichier[2].cellule).toEqual('IND-002');
      expect(listeErreursValidationFichier[2].nom).toEqual('Indicateur invalide');
      expect(listeErreursValidationFichier[2].message).toEqual("L'indicateur IND-002 ne correpond pas à l'indicateur choisis (IND-001)");
      expect(listeErreursValidationFichier[2].nom_du_champ).toEqual('indic_id');
    });

    it('quand le fichier est valide, doit importer les données', async () => {
      // Given
      const report = new ReportValidataBuilder()
        .avecValid(true)
        .avecTasks(
          new ReportTaskBuilder()
            .avecResource(
              new ReportResourceTaskBuilder()
                .avecData([
                  ['identifiant_indic', 'zone_id', 'date_valeur', 'type_valeur', 'valeur'],
                  ['IND-001', 'D12', '2023-03-31', 'va', '9'],
                  ['IND-001', 'D13', '2023-01-17', 'vc', '12'],
                  ['IND-001', 'D14', '2023-02-26', 'vi', '20'],
                ])
                .build(),
            )
            .build(),
        ).build();

      const utilisateur = new UtilisateurÀCréerOuMettreÀJourBuilder().avecEmail('ditp.admin@example.com').avecProfil('DITP_ADMIN').avecHabilitationsLecture([], [], []).build();
      await dependencies.getUtilisateurRepository().créerOuMettreÀJour(utilisateur as any, 'test');

      nock(BASE_URL_VALIDATA)
        .post('/validate').reply(200,
          JSON.stringify({ report }),
        );
      // When
      const formData = new FormData();
      const file = mock<File>();
      formData.append('file', file);

      const { req: request, res: response } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'POST',
        body: formData,
        headers: {
          'content-type': 'multipart/form-data',
        },
        query: { indicateurId: 'IND-001' },
      });
      await handleImportDonneeIndicateurAPI({ request, response, email: 'ditp.admin@example.com', profil: 'DITP_ADMIN' });
      // Then
      expect(response._getStatusCode()).toEqual(200);
      expect(response._getJSONData().message).toEqual('Les données ont correctement été importés');

      const listeMesuresIndicateursTemporaire = await prisma.mesure_indicateur_temporaire.findMany({});
      const listeMesuresIndicateurs = await prisma.mesure_indicateur.findMany({});

      expect(listeMesuresIndicateursTemporaire).toHaveLength(0);

      expect(listeMesuresIndicateurs).toHaveLength(3);
      expect(listeMesuresIndicateurs.at(0)?.indic_id).toEqual('IND-001');
      expect(listeMesuresIndicateurs.at(1)?.indic_id).toEqual('IND-001');
      expect(listeMesuresIndicateurs.at(2)?.indic_id).toEqual('IND-001');
    });
  });
});
