# Solution Logs Admin - Design Spec

Date : 2026-04-07
Source : `prd/solution-logs-admin.md`

## Objectif

Persister les logs applicatifs en base via un transport Pino custom, et exposer une page admin avec tableau filtrable + graphes de tendances.

---

## 1. Modele de donnees (Prisma)

### Enum `log_level`

```prisma
enum log_level {
  INFO
  WARN
  ERROR
  DEBUG

  @@schema("public")
}
```

### Model `application_log`

```prisma
model application_log {
  id        String    @id @default(uuid())
  timestamp DateTime  @default(now())
  level     log_level
  categorie String
  message   String
  contexte  Json?
  source    String?
  duree_ms  Int?

  @@index([timestamp])
  @@index([categorie])
  @@index([level])
  @@index([categorie, timestamp])
  @@schema("public")
}
```

Migration Prisma standard.

---

## 2. Transport Pino -> Base de donnees

### Nouveau fichier : `src/server/infrastructure/pino-prisma-transport.ts`

- Basé sur `pino-abstract-transport` (à installer)
- Instancie un `PrismaClient` dédié (worker thread séparé)
- Mappe les niveaux Pino (10-60) vers l'enum `log_level`
- Extrait le contexte métier en excluant les champs standards Pino
- Silencieux en cas d'erreur DB (jamais de crash)

### Modification de `src/server/infrastructure/Logger.ts`

Le constructeur `AppLogger` passe de :

```typescript
this._logger = pino({ level: "info" });
```

A une config multi-target :

```typescript
this._logger = pino({
  level: "info",
  transport: {
    targets: [
      { target: "pino/file", options: { destination: 1 }, level: "info" },
      { target: "./pino-prisma-transport", options: { databaseUrl: process.env.DATABASE_URL }, level: "info" },
    ],
  },
});
```

Les méthodes `info`/`error`/`warn`/`debug` doivent accepter un objet structuré Pino en premier argument pour passer `categorie`, `source`, `duree_ms`. La signature actuelle (`...obj: unknown[]`) sera adaptée pour supporter les deux formes d'appel (rétrocompatible).

---

## 3. Module DI Awilix : `applicationLog`

### Nouveau module : `src/server/application-log/module.ts`

Suivant le pattern existant (`defineModule`, `VerifyCradle`, `ExtractScope`).

Cradle :
- `listerLogsUseCase` : query avec filtres + pagination
- `obtenirStatistiquesLogsUseCase` : agrégations pour graphes
- `purgerLogsUseCase` : suppression avec garde-fou 7j minimum
- `applicationLogRepository` : accès données

### Enregistrement

- Ajouter `"applicationLog"` dans `moduleNames.ts`
- Ajouter `applicationLogModule` dans `dependances.ts` (`allModules` + `registerContainer`)

---

## 4. Repository

### Interface : `src/server/application-log/domain/ApplicationLogRepository.interface.ts`

Méthodes :
- `lister(filtres, pagination)` -> `{ logs, total }`
- `obtenirStatistiques(dateDebut, dateFin, granularite)` -> `{ parLevel, parCategorie, timeline }`
- `purger(anterieurA: Date)` -> `number` (nombre supprimé)

### Implémentation : `src/server/infrastructure/accès_données/application-log/ApplicationLogSQLRepository.ts`

Utilise `PrismaClient` injecté via le module `shared`.

---

## 5. Use Cases

### `ListerLogsUseCase`

Input : `{ page, taillePage, filtreLevel?, filtreCategorie?, filtreRecherche?, dateDebut?, dateFin? }`
Output : `{ logs: ApplicationLog[], total: number }`

- Pagination côté serveur (défaut 50 par page)
- Filtres combinables
- Tri `timestamp DESC`

### `ObtenirStatistiquesLogsUseCase`

Input : `{ dateDebut, dateFin, granularite: "heure" | "jour" | "semaine" }`
Output : `{ parLevel: { level, count }[], parCategorie: { categorie, count }[], timeline: { date, info, warn, error }[] }`

- Requêtes d'agrégation Prisma (`groupBy`)

### `PurgerLogsUseCase`

Input : `{ anterieurA: Date }`
Output : `{ nombreSupprime: number }`

- Garde-fou : refuse si `anterieurA` < 7 jours dans le passé

---

## 6. Route tRPC

### Nouveau routeur : `src/server/infrastructure/api/trpc/routes/applicationLog.ts`

Utilise `créerRouteurTRPC` + `procédureProtégée`. 3 procédures :

- `applicationLog.lister` (query) - résout `listerLogsUseCase` depuis `getContainer("applicationLog")`
- `applicationLog.statistiques` (query) - résout `obtenirStatistiquesLogsUseCase`
- `applicationLog.purger` (mutation) - résout `purgerLogsUseCase`, vérifie CSRF

Brancher dans `routes.ts` : `applicationLog: applicationLogRouter`

---

## 7. Frontend

### Page Next.js : `src/pages/panel-administrateur/logs.tsx`

Pattern standard admin :
- `getServerSideProps` : vérification session
- Layout `NextPanelAdministrateurLayout` avec `pageActive="logs"`

### Menu latéral

Ajouter dans `MenuLateralPanelAdministrateur.tsx` :

```typescript
{ label: "Logs applicatifs", href: "/panel-administrateur/logs", pageKey: "logs" }
```

### Composant principal : `PagePanelAdministrateurLogs`

Emplacement : `src/client/components/PagePanelAdministrateur/PagePanelAdministrateurLogs/`

#### Onglet 1 : Tableau des logs

- Filtres : niveau (select), catégorie (select), période (date pickers), recherche texte (debounce 300ms)
- Tableau avec colonnes : timestamp, level (badge coloré), catégorie, message, bouton expand
- Ligne expandable : affiche `contexte` JSON dans un `<pre>` monospace
- Pagination serveur : 50 par page
- Bouton "Purger" : modale de confirmation avec sélecteur de date
- Badges : ERROR=rouge, WARN=orange, INFO=bleu, DEBUG=gris

#### Onglet 2 : Graphes

3 graphes ECharts (librairie déjà en v6 dans le projet) :

1. **Stacked bar chart temporel** : logs par level, groupés par granularité
2. **Donut chart** : répartition par niveau
3. **Bar chart horizontal** : top catégories par volume

Filtres : période (7j/30j) + granularité (heure/jour/semaine)

Couleurs : ERROR=#e3342f, WARN=#f6993f, INFO=#3490dc

---

## 8. Categories de logs

| Catégorie | Description |
|-----------|------------|
| `auth` | Authentification, sessions |
| `import` | Import données indicateurs |
| `pva` | Propositions de valeur d'avancement |
| `rapport` | Rapports hebdomadaires |
| `api` | Appels API / tRPC |
| `indicateur` | Calculs et mises à jour indicateurs |
| `utilisateur` | Gestion utilisateurs |
| `systeme` | Événements système (défaut) |

---

## 9. Decisions techniques

- **Pas de nouvelle méthode sur AppLogger** : on utilise les propriétés structurées Pino natives
- **Worker thread Pino** : le transport DB tourne dans un thread séparé, non-bloquant
- **PrismaClient dédié dans le transport** : nécessaire car le worker thread est isolé
- **Migration progressive** : on ajoute `categorie`/`source` dans quelques use cases existants pour démo, le reste se fait au fil du temps
- **Rétention** : purge manuelle via admin + garde-fou 7 jours minimum
