/*
 *
 * Usage:
 *     $ npx ts-node scripts/importProfilsEtUtilisateurs.ts build/input.json | npx pino-pretty
 *
 * Voir src/server/infrastructure/accès_données/identité/seed.ts pour un exemple de struture à fournir.
 *
 * Note : attention, la base de donnée est sélectionnée par la varialbe DATABASE_URL, dans l'environnement ou votre .env.
 * Note : le fichier `build/input.json n'est pas versionné. C'est à dessin.
 * Note : on dirait que prisma ne supporte pas l'import de données dans une migration :(
 *     - https://github.com/prisma/prisma/issues/6345
 */
import { PrismaClient } from '@prisma/client';
import { readFileSync } from 'node:fs';
import {
  créerProfilsEtHabilitations,
  InputProfil,
  InputScopesHabilitations,
} from '@/server/infrastructure/accès_données/identité/seed';
import { UtilisateurSQLRepository } from '@/server/infrastructure/accès_données/identité/UtilisateurSQLRepository';
import UtilisateurDTO from '@/server/domain/identité/UtilisateurDTO';
import logger from '../src/server/infrastructure/logger';

type Input = {
  inputProfils: InputProfil[],
  inputScopesHabilitations: InputScopesHabilitations[],
  inputUtilisateurs?: UtilisateurDTO[],
};

const filename = process.argv[2];
logger.info({ filename }, 'Lecture du fichier...');
const file = readFileSync(filename, 'utf8');

logger.info('Parsing du fichier...');
const input = JSON.parse(file) as Input;
const nbProfils = input.inputProfils.length;
const nbScopes = input.inputScopesHabilitations.length;
const nbUtilisateurs = input.inputUtilisateurs ? input.inputUtilisateurs.length : 0;
logger.info({ nbProfils, nbScopes, nbUtilisateurs }, 'Fichier parsé.');

logger.info('Connexion à la base de données...');
const prisma = new PrismaClient();

logger.info('Import des profiles...');
créerProfilsEtHabilitations(prisma, input.inputProfils, input.inputScopesHabilitations)
  .then(
    (profilIdByCode) => {
      logger.info({ profilIdByCode });
      if (input.inputUtilisateurs) {
        logger.info('Import des utilisateurs...');
        return new UtilisateurSQLRepository(prisma).créerOuRemplaceUtilisateurs(input.inputUtilisateurs);
      }
    })
  .then(
    () => {
      logger.info('Import OK.');
    })
  .catch(
    (error) => {
      logger.error({ error });
      throw new Error('Import échoué.');
    },
  );
