import convict from 'convict';
import dotenv from 'dotenv';
import dotenvExpand from 'dotenv-expand';
import path, { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const env = process.env.NODE_ENV ? `.${process.env.NODE_ENV}` : '';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envPath = join(__dirname, `/.env${env}`);

const envVars = dotenv.config({ path: envPath, override: true });
dotenvExpand.expand(envVars);

const config = convict({
  env: {
    doc: 'The application environment.',
    format: ['production', 'development', 'test'],
    default: 'development',
    env: 'NODE_ENV',
  },
  logLevel: {
    format: String,
    default: 'info',
    env: 'LOG_LEVEL',
  },
  databaseUrl: {
    format: String,
    default: 'info',
    env: 'DATABASE_URL',
  },
  devPassword: {
    format: String,
    default: 'password',
    env: 'DEV_PASSWORD',
  },
  exportCsvChantiersChunkSize: {
    format: Number,
    default: 5,
    env: 'EXPORT_CSV_CHANTIERS_CHUNK_SIZE',
  },
  exportCsvIndicateursChunkSize: {
    format: Number,
    default: 5,
    env: 'EXPORT_CSV_INDICATEURS_CHUNK_SIZE',
  },
  nextAuthSecret: {
    format: String,
    default: 'next_auth_secret',
    env: 'NEXTAUTH_SECRET',
  },
  nextAuthUrl: {
    format: String,
    default: 'http://localhost:3000',
    env: 'NEXTAUTH_URL',
  },
  keycloakClientId: {
    format: String,
    default: 'ToBeDefined',
    env: 'KEYCLOAK_CLIENT_ID',
  },
  keycloakClientSecret: {
    format: String,
    default: 'ToBeDefined',
    env: 'KEYCLOAK_CLIENT_SECRET',
  },
  keycloakIssuer: {
    format: String,
    default: 'ToBeDefined',
    env: 'KEYCLOAK_ISSUER',
  },
  importKeycloakUrl: {
    format: String,
    default: 'ToBeDefined',
    env: 'IMPORT_KEYCLOAK_URL',
  },
  importClientId: {
    format: String,
    default: 'ToBeDefined',
    env: 'IMPORT_CLIENT_ID',
  },
  importClientSecret: {
    format: String,
    default: 'ToBeDefined',
    env: 'IMPORT_CLIENT_SECRET',
  },
  webappBaseUrl: {
    format: String,
    default: null,
    env: 'WEBAPP_BASE_URL',
  },
  nextPublicFfRapportDetaille: {
    format: Boolean,
    default: true,
    env: 'NEXT_PUBLIC_FF_RAPPORT_DETAILLE',
  },
  nextPublicFfProjetsStructurants: {
    format: Boolean,
    default: true,
    env: 'NEXT_PUBLIC_FF_PROJETS_STRUCTURANTS',
  },
  nextPublicFfInfobullePonderation: {
    format: Boolean,
    default: false,
    env: 'NEXT_PUBLIC_FF_INFOBULLE_PONDERATION',
  },
  nextPublicFfDateMeteo: {
    format: Boolean,
    default: false,
    env: 'NEXT_PUBLIC_FF_DATE_METEO',
  },
  nextPublicLimiteCaracteresPublication: {
    format: Number,
    default: 6000,
    env: 'NEXT_PUBLIC_LIMITE_CARACTERES_PUBLICATION',
  },
  nextPublicFfAlertes: {
    format: Boolean,
    default: true,
    env: 'NEXT_PUBLIC_FF_ALERTES',
  },
  nextPublicFfAlertesBaisse: {
    format: Boolean,
    default: false,
    env: 'NEXT_PUBLIC_FF_ALERTES_BAISSE',
  },
  nextPublicFfApplicationIndisponible: {
    format: Boolean,
    default: false,
    env: 'NEXT_PUBLIC_FF_APPLICATION_INDISPONIBLE',
  },
  nextPublicFfFicheTerritoriale: {
    format: Boolean,
    default: false,
    env: 'NEXT_PUBLIC_FF_FICHE_TERRITORIALE',
  },
  nextPublicFfTaAnnuel: {
    format: Boolean,
    default: false,
    env: 'NEXT_PUBLIC_FF_TA_ANNUEL',
  },
});

config.validate({ allowed: 'strict' });

export default config.get();
