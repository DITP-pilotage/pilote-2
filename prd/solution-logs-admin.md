# PRD : Solution de Logs dans le Panel Administrateur

## Contexte

Pas de possibilité d'installer une solution APM (Datadog, New Relic, etc.) sur l'infra PILOTE. On a besoin d'une alternative "maison" pour observer ce qui se passe dans l'application. Aujourd'hui le logger (`src/server/infrastructure/Logger.ts`) écrit dans stdout via Pino, sans persistance ni consultation possible depuis l'UI.

## Objectif

Persister les logs applicatifs en base de données et exposer une interface de consultation dans le panel admin, avec tableau filtrable et graphes de tendances.

---

## 1. Modèle de données

### Enum `log_level`

```prisma
enum log_level {
  INFO
  WARN
  ERROR
  DEBUG
}
```

### Table `application_log`

| Champ | Type | Description |
|-------|------|-------------|
| `id` | UUID | Identifiant unique |
| `timestamp` | DateTime | Date/heure du log (défaut: now) |
| `level` | log_level | Niveau du log |
| `categorie` | String | Catégorie métier (auth, import, pva, etc.) |
| `message` | String | Message du log |
| `contexte` | Json? | Données structurées libres (userId, stack trace, etc.) |
| `source` | String? | Fichier/module d'origine |
| `duree_ms` | Int? | Pour les logs de performance |

Index sur `timestamp`, `categorie`, `level`, et composite `(categorie, timestamp)`.

---

## 2. Persistance des logs

Le logger existant est enrichi d'un **transport Pino** qui persiste les logs en base via un worker thread séparé (non-bloquant).

Le logger expose une API stricte avec signature **`(obj, msg)`**, conforme à la signature native de Pino. Les deux arguments sont obligatoires, et `obj` doit contenir au minimum `categorie` et `source` :

```typescript
logger.info({ categorie: "import", source: "VerifierFichierUseCase" }, "Validation réussie");
logger.error({ categorie: "auth", source: "TokenAPIJWTService", duree_ms: 1200 }, "Timeout Keycloak");
```

- **`categorie`** (obligatoire) : catégorie métier du log (voir tableau ci-dessous)
- **`source`** (obligatoire) : fichier ou module d'origine
- **`msg`** (obligatoire) : message humainement lisible, affiché dans la colonne "Message" du tableau admin
- Propriétés supplémentaires (email, chantierId, etc.) : passées dans `obj`, stockées dans le champ `contexte` JSON

Les logs sans `categorie` sont classés dans `"systeme"` par défaut côté transport.

**Contraintes techniques :**
- Le transport doit être en JS pur (CommonJS) car le worker thread Pino ne passe pas par la compilation Next.js/Turbopack
- Le chemin du transport est résolu via `__dirname` (et non `process.cwd()`) pour compatibilité avec le mode `output: "standalone"` de Next.js
- Le transport DB n'est activé que si `DATABASE_URL` est défini (garde-fou pour les tests et environnements incomplets)

### Catégories de logs

| Catégorie | Description |
|-----------|------------|
| `auth` | Authentification, sessions, Keycloak |
| `import` | Import de données indicateurs |
| `pva` | Propositions de valeur d'avancement |
| `rapport` | Rapports hebdomadaires |
| `api` | Erreurs API, latences élevées |
| `indicateur` | Calculs et mises à jour indicateurs |
| `utilisateur` | Gestion utilisateurs, habilitations |
| `notification` | Envoi de messages Tchap |
| `database` | Erreurs repositories Prisma |
| `systeme` | Événements système (défaut) |

### Logs déjà branchés

| Source | Catégorie | Niveaux | Ce qui est loggé |
|--------|-----------|---------|------------------|
| Error handler global API | `api` | ERROR | Toutes les erreurs API (PiloteError + erreurs internes) avec statusCode et type |
| Vérification fichier import | `import` | INFO, WARN, ERROR | Validation réussie/échouée/exception avec indicateurId, nomDuFichier |
| Publication fichier import | `import` | INFO | Publication réussie avec rapportId, nombreMesures |
| Créer/modifier utilisateur | `utilisateur` | INFO | Création ou modification avec action, email, profil, ancien/nouveau |
| Désactiver utilisateur | `utilisateur` | INFO | Désactivation avec email, profil |
| Réactiver utilisateur | `utilisateur` | INFO | Réactivation avec email, profil |
| Désactiver comptes inactifs | `utilisateur` | ERROR | Erreur lors de la désactivation batch avec email |
| Supprimer comptes désactivés | `utilisateur` | INFO, ERROR | Suppression réussie/échouée avec email, nombreSupprimés |
| Envoyer relances | `utilisateur` | ERROR | Erreur envoi relance avec email, typeRelance |
| Importer utilisateurs | `utilisateur` | INFO | Import batch avec nombreImportés, nombreErreurs |
| Décodage token API JWT | `auth` | WARN | Échec décodage avec errorMessage |
| Authentification utilisateur API | `auth` | WARN | Utilisateur introuvable avec email, utilisateurTrouve, tokenTrouve |
| Endpoints open-api (commentaires, objectifs, décisions stratégiques, synthèses, données chantier, données indicateur) | `api` | INFO | Import/export avec chantierId, indicateurId |
| Import commentaires handler | `api` | WARN | Accès refusé (403), JSON invalide, validation Zod/métier échouée avec chantierId, email, nombreErreurs |
| Import objectifs handler | `api` | WARN | Accès refusé (403), JSON invalide, validation Zod échouée avec chantierId, email, nombreErreurs |
| Import décisions stratégiques handler | `api` | WARN | Accès refusé (403), JSON invalide, validation Zod échouée avec chantierId, email, nombreErreurs |
| Import synthèses des résultats handler | `api` | WARN | Accès refusé (403), JSON invalide, validation Zod/métier échouée avec chantierId, email, nombreErreurs |
| Import données indicateur handler | `import` | ERROR | Erreur traitement JSON avec indicateurId, contentType |
| FetchHttpClient (Validata) | `import` | INFO, ERROR | Soumission/réponse/erreur Validata avec nomDuFichier, errorStack |
| ValidataFichierIndicateurValidationService | `import` | ERROR | Erreur validation fichier avec nomDuFichier, utilisateurEmail |

---

## 3. API tRPC

Route `applicationLog` avec 3 procédures, toutes réservées DITP_ADMIN :

### `applicationLog.lister`
- **Input** : `{ page, taillePage, filtreLevel?, filtreCategorie?, filtreRecherche?, dateDebut?, dateFin? }`
- **Output** : `{ logs: ApplicationLogEntree[], total: number }`
- Pagination côté serveur, filtres combinables, tri timestamp DESC

### `applicationLog.statistiques`
- **Input** : `{ dateDebut, dateFin, granularite: "heure" | "jour" | "semaine" }`
- **Output** : `{ parLevel: { level, count }[], parCategorie: { categorie, count }[], timeline: { date, info, warn, error }[] }`
- Données agrégées pour les graphes

### `applicationLog.purger`
- **Input** : `{ csrf, anterieurA: Date }`
- Supprime les logs plus anciens qu'une date donnée
- Garde-fou : minimum 7 jours de rétention

---

## 4. Frontend - Page Panel Admin

### Navigation

Entrée "Logs applicatifs" dans le menu latéral admin → `/panel-administrateur/logs`

### Onglet 1 : Tableau des logs

- **Filtres combinables** : niveau, catégorie, date début, recherche texte dans message
- **Tableau** : timestamp, niveau (badge coloré), catégorie, message, source
- **Ligne expandable** : clic déplie le JSON `contexte` formaté
- **Pagination** : 50 logs par page côté serveur
- **Purge** : bouton ouvrant une modale de confirmation avec sélecteur de date

### Onglet 2 : Graphes

Filtres : période (7j / 30j) + granularité (heure / jour / semaine)

3 graphes ECharts :

1. **Line chart temporel** : courbes par niveau (ERROR, WARN, INFO) pour visualiser les tendances montée/baisse
2. **Donut chart** : répartition par niveau sur la période
3. **Bar chart horizontal** : top catégories par volume

---

## 5. Points d'attention

- **Performance** : transport Pino dans un worker thread séparé, non-bloquant
- **Volume** : commencer par les `error` + `warn` + les `info` importants. Ajuster au fil du temps
- **Rétention** : purge manuelle via admin (garde-fou 7j). Optionnel à terme : job CRON > 90 jours
- **Sécurité** : ne jamais persister de données sensibles dans `contexte` (mots de passe, tokens)
- **Accès** : réservé DITP_ADMIN (vérification dans getServerSideProps + chaque procédure tRPC)
- **Migration progressive** : on ajoute `categorie`/`source` dans les logger.info/error/warn existants au fur et à mesure
