# PRD : Solution de Logs dans le Panel Administrateur

## Contexte

Pas de possibilité d'installer une solution APM (Datadog, New Relic, etc.) sur l'infra PILOTE. On a besoin d'une alternative "maison" pour observer ce qui se passe dans l'application. Aujourd'hui le logger (`src/server/infrastructure/Logger.ts`) écrit dans stdout via Pino, sans persistance ni consultation possible depuis l'UI.

## Objectif

Persister les logs applicatifs en base de données et exposer une interface de consultation dans le panel admin, avec tableau filtrable et graphes de tendances.

---

## 1. Modèle de données

### Nouvelle enum Prisma

```prisma
enum log_level {
  INFO
  WARN
  ERROR
  DEBUG

  @@schema("public")
}
```

### Nouvelle table Prisma

```prisma
model application_log {
  id          String    @id @default(uuid())
  timestamp   DateTime  @default(now())
  level       log_level
  categorie   String    // ex: "auth", "import", "pva", "rapport", "api", "indicateur"
  message     String
  contexte    Json?     // données structurées libres (userId, chantierIds, stack trace, etc.)
  source      String?   // fichier/module d'origine
  duree_ms    Int?      // pour les logs de performance (durée d'un use case, d'une requête)

  @@index([timestamp])
  @@index([categorie])
  @@index([level])
  @@schema("public")
}
```

### Migration

- Créer la migration Prisma pour ajouter l'enum `log_level` et la table `application_log`
- Ajouter un index composite `(categorie, timestamp)` pour les requêtes filtrées par catégorie avec tri temporel

---

## 2. Enrichissement du Logger via transport Pino

On utilise le système de **transports Pino** pour persister les logs. Pino exécute les transports dans un **worker thread séparé**, ce qui garantit que l'écriture en base ne bloque jamais le thread principal. Aucune nouvelle méthode sur `AppLogger` — on passe les métadonnées (catégorie, source, durée) via les child bindings ou les propriétés du log object.

### Nouveau fichier : `src/server/infrastructure/pino-prisma-transport.ts`

Transport custom basé sur `pino-abstract-transport` qui consomme les logs en async et les persiste en base :

```typescript
import build from "pino-abstract-transport";
import { PrismaClient } from "@prisma/client";

export default async function (opts: { databaseUrl?: string }) {
  const prisma = new PrismaClient({
    datasourceUrl: opts.databaseUrl,
  });

  return build(async function (source) {
    for await (const log of source) {
      const level = mapPinoLevelToEnum(log.level);
      if (!level) continue;

      try {
        await prisma.application_log.create({
          data: {
            level,
            categorie: log.categorie ?? "systeme",
            message: log.msg ?? "",
            contexte: extraireContexte(log),
            source: log.source ?? null,
            duree_ms: log.duree_ms ?? null,
          },
        });
      } catch {
        // silencieux — ne jamais crasher à cause du logging
      }
    }
  }, {
    async close() {
      await prisma.$disconnect();
    },
  });
}

function mapPinoLevelToEnum(pinoLevel: number): string | null {
  // pino levels: 10=trace, 20=debug, 30=info, 40=warn, 50=error, 60=fatal
  if (pinoLevel >= 50) return "ERROR";
  if (pinoLevel >= 40) return "WARN";
  if (pinoLevel >= 30) return "INFO";
  if (pinoLevel >= 20) return "DEBUG";
  return null; // trace ignoré
}

function extraireContexte(log: Record<string, unknown>): Record<string, unknown> | null {
  // Exclure les champs standards pino pour ne garder que le contexte métier
  const { level, time, pid, hostname, msg, categorie, source, duree_ms, ...contexte } = log;
  return Object.keys(contexte).length > 0 ? contexte : null;
}
```

### Modifications sur `src/server/infrastructure/Logger.ts`

Le `AppLogger` configure Pino avec **deux targets** : stdout (existant) + le transport Prisma :

```typescript
import pino, { Logger } from "pino";

class AppLogger implements Pick<Logger, "info" | "error" | "warn"> {
  private readonly _logger: Logger;

  constructor() {
    this._logger = pino({
      level: "info",
      transport: {
        targets: [
          {
            target: "pino/file",
            options: { destination: 1 }, // stdout
            level: "info",
          },
          {
            target: "./pino-prisma-transport",
            options: { databaseUrl: process.env.DATABASE_URL },
            level: "info",
          },
        ],
      },
    });
  }

  // Les méthodes info/error/warn restent identiques
  // On passe les métadonnées en propriétés du log object :
  // logger.info({ categorie: "import", source: "ImportIndicateurUseCase" }, "Import réussi")
  // logger.error({ categorie: "auth", duree_ms: 1200 }, "Échec authentification Keycloak")
}
```

### Usage dans les use cases

L'API ne change pas, on utilise le logger Pino standard avec des propriétés structurées :

```typescript
// Avant (ne change pas, va dans stdout uniquement SI on filtre côté transport)
logger.info("Un message simple");

// Avec métadonnées (va dans stdout ET en base)
logger.info({ categorie: "import", source: "ImportIndicateurUseCase" }, "Import terminé avec succès");
logger.error({ categorie: "auth", duree_ms: 1200 }, "Échec authentification Keycloak");
logger.warn({ categorie: "pva", contexteMetier: { chantierId: "CH-001" } }, "PVA en attente depuis 7 jours");
```

**Principes :**
- Le transport tourne dans un **worker thread** Pino (non-bloquant pour le thread principal)
- Aucune nouvelle méthode sur `AppLogger` — on utilise les propriétés structurées Pino natives
- Le transport est silencieux en cas d'erreur DB (pas de crash, pas de boucle)
- Les logs sans `categorie` sont classés dans `"systeme"` par défaut
- Migration progressive : on ajoute les propriétés `categorie`/`source` dans les appels existants au fur et à mesure

### Catégories de logs à indexer

| Catégorie | Description | Exemples de sources |
|-----------|------------|---------------------|
| `auth` | Authentification, sessions | Login, logout, token refresh, erreurs Keycloak |
| `import` | Import de données indicateurs | Validation, erreurs de parsing, succès |
| `pva` | Propositions de valeur d'avancement | Création, acceptation, refus, modification |
| `rapport` | Rapports hebdomadaires | Envoi, échecs Brevo/SendinBlue |
| `api` | Appels API / tRPC | Erreurs, latences élevées |
| `indicateur` | Calculs et mises à jour indicateurs | Recalculs, anomalies de données |
| `utilisateur` | Gestion utilisateurs | Création, modification habilitations |
| `systeme` | Événements système | Démarrage, migrations, jobs |

---

## 3. Backend - Route tRPC

### Nouveau routeur `logRouter`

Emplacement : `src/server/infrastructure/api/trpc/routes/log.ts`

**Procédures :**

#### `log.lister`
- **Input** : `{ page, taillePage, filtreLevel?, filtreCategorie?, filtreRecherche?, dateDebut?, dateFin? }`
- **Output** : `{ logs: ApplicationLog[], total: number }`
- Pagination côté serveur
- Filtres combinables (level, catégorie, recherche texte dans message, plage de dates)
- Tri par timestamp DESC par défaut

#### `log.statistiques`
- **Input** : `{ dateDebut, dateFin, granularite: "heure" | "jour" | "semaine" }`
- **Output** : `{ parLevel: { level, count }[], parCategorie: { categorie, count }[], timeline: { date, info, warn, error }[] }`
- Données agrégées pour les graphes

#### `log.purger`
- **Input** : `{ antérieurA: Date }`
- Supprime les logs plus anciens qu'une date donnée
- Protection : minimum 7 jours de rétention

---

## 4. Frontend - Page Panel Admin

### Navigation

Ajouter dans `MenuLateralPanelAdministrateur` :
```typescript
{
  label: "Logs applicatifs",
  href: "/panel-administrateur/logs",
  pageKey: "logs",
}
```

### Page Next.js

Fichier : `src/pages/panel-administrateur/logs.tsx`
Pattern identique aux autres pages admin (auth via `getServerSideProps`, layout `NextPanelAdministrateurLayout`).

### Composant principal

`src/client/components/PagePanelAdministrateur/PagePanelAdministrateurLogs/PagePanelAdministrateurLogs.tsx`

#### Design direction

**Esthétique : "Terminal Ops"** - Inspiré des dashboards d'observabilité, avec un feeling technique/utilitaire. Fond sombre pour la zone de logs (contraste avec le panel admin blanc), typographie monospace pour les entrées de log, badges colorés pour les niveaux.

#### Structure en onglets horizontaux

Utiliser les onglets DSFR (`fr-tabs`) pour séparer les deux vues :

**Onglet 1 : "Tableau des logs"**

```
┌─────────────────────────────────────────────────────────────┐
│  [Filtres]                                                  │
│  ┌──────────┐ ┌────────────┐ ┌──────────────┐ ┌─────────┐  │
│  │ Niveau ▼ │ │ Catégorie ▼│ │ 📅 Période   │ │🔍Search │  │
│  └──────────┘ └────────────┘ └──────────────┘ └─────────┘  │
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ Timestamp       │ Level │ Catégorie │ Message    │ ... ││
│  │─────────────────│───────│───────────│────────────│─────││
│  │ 07/04 14:32:01  │ 🔴ERR │ import    │ Échec va...│  ▶  ││
│  │ 07/04 14:31:58  │ 🟡WARN│ auth      │ Token ex...│  ▶  ││
│  │ 07/04 14:31:45  │ 🔵INFO│ pva       │ PVA accep..│  ▶  ││
│  │ ...             │       │           │            │     ││
│  └─────────────────────────────────────────────────────────┘│
│                                                             │
│  ◀ Page 1 / 42 ▶                          [Purger les logs] │
└─────────────────────────────────────────────────────────────┘
```

- **Badges colorés par level** : ERROR = rouge, WARN = orange, INFO = bleu, DEBUG = gris
- **Ligne expandable** : clic sur ▶ déplie le JSON `contexte` dans un bloc `<pre>` monospace avec coloration syntaxique
- **Pagination** : 50 logs par page côté serveur
- **Recherche** : filtre sur le champ `message` (debounce 300ms)
- **Bouton "Purger"** : ouvre une modale de confirmation avec sélecteur de date

**Onglet 2 : "Graphes"**

```
┌─────────────────────────────────────────────────────────────┐
│  [Période] ┌──────────────┐  [Granularité] ┌───────────┐   │
│            │ 📅 7j / 30j  │                │ heure/jour│   │
│            └──────────────┘                └───────────┘   │
│                                                             │
│  ┌───────────────────────────────────────────────────┐      │
│  │         Timeline des logs par niveau               │      │
│  │  ██                                                │      │
│  │  ██ ▓▓                                             │      │
│  │  ██ ▓▓ ░░    ██                                    │      │
│  │  ██ ▓▓ ░░    ██ ▓▓         ██                      │      │
│  │  ██ ▓▓ ░░    ██ ▓▓ ░░     ██ ▓▓ ░░                │      │
│  │  ─────────────────────────────────────             │      │
│  │  lun   mar   mer   jeu   ven   sam   dim           │      │
│  │                                                     │      │
│  │  ■ ERROR  ■ WARN  ■ INFO                           │      │
│  └───────────────────────────────────────────────────┘      │
│                                                             │
│  ┌──────────────────────┐  ┌──────────────────────────┐     │
│  │  Répartition par     │  │  Répartition par          │     │
│  │  niveau (donut)      │  │  catégorie (bar horiz.)   │     │
│  │                      │  │                            │     │
│  │     ┌────┐           │  │  auth     ████████ 234     │     │
│  │   ╱  INFO  ╲         │  │  import   ██████   189     │     │
│  │  │  72%     │        │  │  pva      ████     112     │     │
│  │   ╲  WARN  ╱         │  │  rapport  ███       87     │     │
│  │     └────┘           │  │  api      ██        45     │     │
│  │                      │  │                            │     │
│  └──────────────────────┘  └──────────────────────────┘     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**3 graphes ECharts :**

1. **Stacked bar chart temporel** : logs par level sur la période, groupés par granularité (heure/jour/semaine). Couleurs : ERROR=#e3342f, WARN=#f6993f, INFO=#3490dc
2. **Donut chart** : répartition des logs par niveau sur la période
3. **Bar chart horizontal** : top catégories par volume de logs

---

## 5. Plan d'implémentation

### Phase 1 - Fondations (base de données + transport Pino)
1. Ajouter l'enum `log_level` et le model `application_log` dans `schema.prisma`
2. Créer la migration Prisma
3. Installer `pino-abstract-transport` et créer `src/server/infrastructure/pino-prisma-transport.ts`
4. Modifier `AppLogger` pour configurer le multi-target (stdout + transport Prisma)
5. Ajouter les premières propriétés `categorie`/`source` dans 2-3 use cases existants (rapport hebdo, import indicateur, auth)

### Phase 2 - API tRPC
5. Créer le use case `ListerLogsUseCase` (query avec filtres + pagination)
6. Créer le use case `ObtenirStatistiquesLogsUseCase` (agrégations)
7. Créer le use case `PurgerLogsUseCase` (suppression avec garde-fou)
8. Créer le routeur tRPC `logRouter` avec les 3 procédures
9. Brancher dans `routes.ts`

### Phase 3 - Frontend tableau
10. Créer la page Next.js `src/pages/panel-administrateur/logs.tsx`
11. Ajouter l'entrée dans `MenuLateralPanelAdministrateur`
12. Créer le composant `PagePanelAdministrateurLogs` avec les onglets DSFR
13. Implémenter l'onglet tableau : filtres, pagination, expansion des lignes

### Phase 4 - Frontend graphes
14. Implémenter le stacked bar chart temporel (ECharts)
15. Implémenter le donut chart par niveau (ECharts)
16. Implémenter le bar chart par catégorie (ECharts)
17. Connecter les filtres de période/granularité aux graphes

### Phase 5 - Purge et maintenance
18. Implémenter la modale de purge dans le tableau
19. (Optionnel) Ajouter un job CRON de purge automatique des logs > 90 jours

---

## 6. Points d'attention

- **Performance** : le transport Pino tourne dans un worker thread séparé, donc non-bloquant par design. Pas besoin de fire-and-forget côté appelant
- **Volume** : ne pas logger tous les `info` en base au début, commencer par les `error` + `warn` + les `info` importants (métier). Ajuster au fil du temps
- **Rétention** : prévoir une stratégie de purge (bouton admin + éventuellement CRON). Les logs ne doivent pas faire grossir la base indéfiniment
- **Sécurité** : ne jamais persister de données sensibles dans `contexte` (mots de passe, tokens). Filtrer avant persist
- **Accès** : page réservée aux admins (vérification dans `getServerSideProps` comme les autres pages admin)
