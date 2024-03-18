import convict from 'convict';
import dotenv from 'dotenv';
import dotenvExpand from 'dotenv-expand';
import { join } from 'node:path';

const env = process.env.NODE_ENV ? `.${process.env.NODE_ENV}` : '';

const envPath = join(process.cwd(), `/.env${env}`);

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
    default: '',
    env: 'DEV_PASSWORD',
  },
  nextAuth: {
    secret: {
      format: String,
      default: 'next_auth_secret',
      env: 'NEXTAUTH_SECRET',
    },
    url: {
      format: String,
      default: 'http://localhost:3000',
      env: 'NEXTAUTH_URL',
    },
    debug: {
      format: Boolean,
      default: false,
      env: 'NEXTAUTH_DEBUG',
    },
    sessionMaxAge: {
      format: Number,
      default: 2_592_000,
      env: 'NEXTAUTH_SESSION_MAX_AGE_IN_SECONDS',
    },
  },
  keycloak: {
    clientId: {
      format: String,
      default: 'ToBeDefined',
      env: 'KEYCLOAK_CLIENT_ID',
    },
    clientSecret: {
      format: String,
      default: 'ToBeDefined',
      env: 'KEYCLOAK_CLIENT_SECRET',
    },
    issuer: {
      format: String,
      default: 'ToBeDefined',
      env: 'KEYCLOAK_ISSUER',
    },
    tokenUrl: {
      format: String,
      default: 'ToBeDefined',
    },
    authUrl: {
      format: String,
      default: 'ToBeDefined',
    },
    logoutUrl: {
      format: String,
      default: 'ToBeDefined',
    },
  },
  import: {
    keycloakUrl: {
      format: String,
      default: 'ToBeDefined',
      env: 'IMPORT_KEYCLOAK_URL',
    },
    clientId: {
      format: String,
      default: 'ToBeDefined',
      env: 'IMPORT_CLIENT_ID',
    },
    clientSecret: {
      format: String,
      default: 'ToBeDefined',
      env: 'IMPORT_CLIENT_SECRET',
    },
  },
  export: {
    csvChantiersChunkSize: {
      format: Number,
      default: 5,
      env: 'EXPORT_CSV_CHANTIERS_CHUNK_SIZE',
    },
    csvIndicateursChunkSize: {
      format: Number,
      default: 5,
      env: 'EXPORT_CSV_INDICATEURS_CHUNK_SIZE',
    },
  },
  webappBaseUrl: {
    format: String,
    default: '',
    env: 'WEBAPP_BASE_URL',
  },
  centreaide: {
    githubFolder: {
      format: String,
      default: 'integration-pilote',
      env: 'CENTREAIDE_GITHUB_FOLDER',
    },
    githubToken: {
      format: String,
      default: 'ToBeDefined',
      env: 'CENTREAIDE_GITHUB_TOKEN',
    },
  },
  featureFlip: {
    rapportDetaille: {
      format: Boolean,
      default: true,
      env: 'NEXT_PUBLIC_FF_RAPPORT_DETAILLE',
    },
    projetsStructurants: {
      format: Boolean,
      default: true,
      env: 'NEXT_PUBLIC_FF_PROJETS_STRUCTURANTS',
    },
    infobullePonderation: {
      format: Boolean,
      default: false,
      env: 'NEXT_PUBLIC_FF_INFOBULLE_PONDERATION',
    },
    dateMeteo: {
      format: Boolean,
      default: false,
      env: 'NEXT_PUBLIC_FF_DATE_METEO',
    },
    limiteCaracteresPublication: {
      format: Number,
      default: 6000,
      env: 'NEXT_PUBLIC_LIMITE_CARACTERES_PUBLICATION',
    },
    alertes: {
      format: Boolean,
      default: true,
      env: 'NEXT_PUBLIC_FF_ALERTES',
    },
    alertesBaisse: {
      format: Boolean,
      default: false,
      env: 'NEXT_PUBLIC_FF_ALERTES_BAISSE',
    },
    applicationIndisponible: {
      format: Boolean,
      default: false,
      env: 'NEXT_PUBLIC_FF_APPLICATION_INDISPONIBLE',
    },
    ficheTerritoriale: {
      format: Boolean,
      default: true,
      env: 'NEXT_PUBLIC_FF_FICHE_TERRITORIALE',
    },
    ficheConducteur: {
      format: Boolean,
      default: false,
      env: 'NEXT_PUBLIC_FF_FICHE_CONDUCTEUR',
    },
    taAnnuel: {
      format: Boolean,
      default: false,
      env: 'NEXT_PUBLIC_FF_TA_ANNUEL',
    },
  },
});

config.set('keycloak.tokenUrl', config.get('keycloak.issuer') + '/protocol/openid-connect/token');
config.set('keycloak.authUrl', config.get('keycloak.issuer') + '/protocol/openid-connect/auth');
config.set('keycloak.logoutUrl', config.get('keycloak.issuer') + '/protocol/openid-connect/logout');

config.validate({ allowed: 'strict' });

export const configuration = config.get();


