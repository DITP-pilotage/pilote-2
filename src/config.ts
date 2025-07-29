import convict from "convict";
import dotenv from "dotenv";
import { join } from "node:path";

const env = process.env.NODE_ENV ? `.${process.env.NODE_ENV}` : "";

const envPath = join(process.cwd(), `/.env${env}`);

dotenv.config({ path: envPath, override: true });

const config = convict({
  env: {
    doc: "The application environment.",
    format: ["production", "development", "test"],
    default: "development",
    env: "NODE_ENV",
  },
  baseUrl: {
    format: String,
    default: "http://localhost:3000",
    env: "BASE_URL",
  },
  logLevel: {
    format: String,
    default: "info",
    doc: "Niveaux de logs possibles : trace, debug, info, warn, error, fatal, silent.",
    env: "LOG_LEVEL",
  },
  databaseUrl: {
    format: String,
    default: "ToBeDefined",
    doc: "URL de la db pour Prisma et cible pour la descente de prod.",
    env: "DATABASE_URL",
  },
  devPassword: {
    format: String,
    default: "",
    doc: "MDP admin optionnel. Remplace complètement OIDC",
    env: "DEV_PASSWORD",
  },
  nextAuth: {
    secret: {
      format: String,
      default: "next_auth_secret",
      doc: "Peut être généré par `openssl rand -base64 32`",
      env: "NEXTAUTH_SECRET",
    },
    url: {
      format: String,
      default: "http://localhost:3000",
      env: "NEXTAUTH_URL",
    },
    debug: {
      format: Boolean,
      default: false,
      env: "NEXTAUTH_DEBUG",
    },
    sessionMaxAge: {
      format: Number,
      default: 2_592_000,
      env: "NEXTAUTH_SESSION_MAX_AGE_IN_SECONDS",
    },
  },
  keycloak: {
    doc: "(optionel) Pour se connecter par une instance Keycloak. Incompatible avec DEV_PASSWORD",
    clientId: {
      format: String,
      default: "ToBeDefined",
      env: "KEYCLOAK_CLIENT_ID",
    },
    clientSecret: {
      format: String,
      default: "ToBeDefined",
      env: "KEYCLOAK_CLIENT_SECRET",
    },
    issuer: {
      format: String,
      default: "ToBeDefined",
      env: "KEYCLOAK_ISSUER",
    },
    tokenUrl: {
      format: String,
      default: "ToBeDefined",
    },
    authUrl: {
      format: String,
      default: "ToBeDefined",
    },
    logoutUrl: {
      format: String,
      default: "ToBeDefined",
    },
  },
  import: {
    keycloakUrl: {
      format: String,
      default: "ToBeDefined",
      doc: "(optionnel) Import d utilisateurs dans Keycloak",
      env: "IMPORT_KEYCLOAK_URL",
    },
    clientId: {
      format: String,
      default: "ToBeDefined",
      env: "IMPORT_CLIENT_ID",
    },
    clientSecret: {
      format: String,
      default: "ToBeDefined",
      env: "IMPORT_CLIENT_SECRET",
    },
    urlValidata: {
      format: String,
      default: "https://api.validata.etalab.studio/validate",
      env: "URL_VALIDATA",
    },
  },
  export: {
    csvChantiersChunkSize: {
      format: Number,
      default: 5,
      env: "EXPORT_CSV_CHANTIERS_CHUNK_SIZE",
    },
    csvIndicateursChunkSize: {
      format: Number,
      default: 5,
      env: "EXPORT_CSV_INDICATEURS_CHUNK_SIZE",
    },
  },
  webappBaseUrl: {
    format: String,
    default: "",
    env: "WEBAPP_BASE_URL",
  },
  descenteDeProdSource: {
    format: String,
    default: "postgres://usr:pwd@host:port/db_name",
    doc: "URL de la db de prod",
    env: "CONN_STR_PROD",
  },
  descenteDeProdDestination: {
    format: String,
    default: "postgres://usr:pwd@host:port/db_name",
    doc: "URL de la db sur laquelle copier les données de prod",
    env: "CONN_STR_DEST",
  },
  centreaide: {
    githubFolder: {
      format: String,
      doc: "Dossier du centre d aide à récupérer",
      default: "integration-pilote",
      env: "CENTREAIDE_GITHUB_FOLDER",
    },
    githubToken: {
      format: String,
      default: "ToBeDefined",
      env: "CENTREAIDE_GITHUB_TOKEN",
    },
  },
  featureFlip: {
    nouvellePageAccueil: {
      format: Boolean,
      default: false,
      env: "NEXT_PUBLIC_FF_NOUVELLE_PAGE_ACCUEIL",
    },
    rapportDetaille: {
      format: Boolean,
      default: true,
      env: "NEXT_PUBLIC_FF_RAPPORT_DETAILLE",
    },
    infobullePonderation: {
      format: Boolean,
      default: false,
      env: "NEXT_PUBLIC_FF_INFOBULLE_PONDERATION",
    },
    dateMeteo: {
      format: Boolean,
      default: false,
      env: "NEXT_PUBLIC_FF_DATE_METEO",
    },
    limiteCaracteresPublication: {
      format: Number,
      default: 6000,
      env: "NEXT_PUBLIC_LIMITE_CARACTERES_PUBLICATION",
    },
    alertes: {
      format: Boolean,
      default: true,
      env: "NEXT_PUBLIC_FF_ALERTES",
    },
    alertesBaisse: {
      format: Boolean,
      default: false,
      env: "NEXT_PUBLIC_FF_ALERTES_BAISSE",
    },
    applicationIndisponible: {
      format: Boolean,
      default: false,
      env: "NEXT_PUBLIC_FF_APPLICATION_INDISPONIBLE",
    },
    ficheTerritoriale: {
      format: Boolean,
      default: true,
      env: "NEXT_PUBLIC_FF_FICHE_TERRITORIALE",
    },
    ficheConducteur: {
      format: Boolean,
      default: false,
      env: "NEXT_PUBLIC_FF_FICHE_CONDUCTEUR",
    },
    taAnnuel: {
      format: Boolean,
      default: false,
      env: "NEXT_PUBLIC_FF_TA_ANNUEL",
    },
    gestionTokenAPI: {
      format: Boolean,
      default: false,
      env: "NEXT_PUBLIC_FF_GESTION_TOKEN_API",
    },
    suiviCompletude: {
      format: Boolean,
      default: false,
      env: "NEXT_PUBLIC_FF_SUIVI_COMPLETUDE",
    },
    alerteMAJIndicateur: {
      format: Boolean,
      default: false,
      env: "NEXT_PUBLIC_FF_ALERTE_MAJ_INDICATEUR",
    },
    propositionValeurAvancement: {
      format: Boolean,
      default: false,
      env: "NEXT_PUBLIC_FF_PROPOSITION_VALEUR_ACTUELLE",
    },
    sousIndicateurs: {
      format: Boolean,
      default: false,
      env: "NEXT_PUBLIC_FF_SOUS_INDICATEURS",
    },
    docsAPI: {
      format: Boolean,
      default: false,
      env: "NEXT_PUBLIC_FF_DOCS_API",
    },
    ppgArchive: {
      format: Boolean,
      default: false,
      env: "NEXT_PUBLIC_FF_PPG_ARCHIVE",
    },
    poserUneQuestionIndicateur: {
      format: Boolean,
      default: false,
      env: "NEXT_PUBLIC_FF_POSER_UNE_QUESTION_INDICATEUR",
    },
    videoAccueil: {
      format: Boolean,
      default: false,
      env: "NEXT_PUBLIC_FF_VIDEO_ACCUEIL",
    },
  },
  analytics: {
    doc: "Matomo Analytics",
    matomoURL: {
      format: String,
      default: "https://stats.beta.gouv.fr",
      env: "NEXT_PUBLIC_MATOMO_URL",
    },
    matomoSiteId: {
      format: Number,
      default: 103,
      env: "NEXT_PUBLIC_MATOMO_SITE_ID",
    },
    estRecordActive: {
      format: Boolean,
      default: false,
      env: "NEXT_PUBLIC_RECORD_ANALYTICS",
    },
  },
  tokenAPI: {
    secret: {
      format: String,
      default: "secret",
      env: "TOKEN_API_SECRET",
    },
    localTokenAPIE2EJohan: {
      format: String,
      default: "toBeDefinedForE2E",
      env: "TOKEN_API_E2E_JOHAN",
    },
    localTokenAPIE2EUtilisateurEquipeDirProjet: {
      format: String,
      default: "toBeDefinedForE2E",
      env: "TOKEN_API_E2E_EQUIPE_DIR_PROJET",
    },
    chantierIdAccessibleParUtilisateurEquipeDirProjet: {
      format: String,
      default: "toBeDefinedForE2E",
      env: "CHANTIER_ID_ACCESSIBLE_PAR_UTILISATEUR_EQUIPE_DIR_PROJET",
    },
    indicateurIdAccessibleParUtilisateurEquipeDirProjet: {
      format: String,
      default: "toBeDefinedForE2E",
      env: "INDICATEUR_ID_ACCESSIBLE_PAR_UTILISATEUR_EQUIPE_DIR_PROJET",
    },
  },
  cartographie: {
    svgPath: {
      format: String,
      default: "cartographie-france.svg",
      env: "CARTOGRAPHIE_SVG_PATH",
    },
  },
  dateBasculeAffichageValeursAnneePrecedente: {
    format: String,
    default: "2000-01-31",
    doc: "Date (mois-année) avant laquelle afficher encore les VA,VC,TA de l année dernière",
    env: "NEXT_PUBLIC_DATE_BASCULE_AFFICHAGE_VALEURS_ANNEE_PRECEDENTE",
  },
  schemaValidataUrl: {
    format: String,
    default:
      "https://raw.githubusercontent.com/DITP-pilotage/pilote-2/dev/public/schema/",
    env: "NEXT_PUBLIC_SCHEMA_VALIDATA_URL",
  },
  e2e: {
    username: {
      format: String,
      default: "TBD",
      env: "E2E_USERNAME",
    },
    password: {
      format: String,
      default: "TBD",
      env: "DEV_PASSWORD",
    },
    apiDITPADMINUsername: {
      format: String,
      default: "TBD",
      env: "API_DITP_USERNAME",
    },
    apiDirProjetUsername: {
      format: String,
      default: "TBD",
      env: "API_DIR_PROJET_USERNAME",
    },
    apiDirProjetChantierAssocie: {
      format: String,
      default: "TBD",
      env: "API_DIR_PROJET_CHANTIER_ASSOCIE",
    },
    apiDirProjetIndicateurAssocie: {
      format: String,
      default: "TBD",
      env: "API_DIR_PROJET_INDICATEUR_ASSOCIE",
    },
  },
  brevo: {
    apiKey: {
      format: String,
      default: "ToBeDefined",
      env: "BREVO_API_KEY",
    },
  },
});

config.set(
  "keycloak.tokenUrl",
  config.get("keycloak.issuer") + "/protocol/openid-connect/token",
);
config.set(
  "keycloak.authUrl",
  config.get("keycloak.issuer") + "/protocol/openid-connect/auth",
);
config.set(
  "keycloak.logoutUrl",
  config.get("keycloak.issuer") + "/protocol/openid-connect/logout",
);

config.validate({ allowed: "strict" });

export const configuration = config.get();
