# Spec : Synchronisation des valeurs d'avancement pilote-ppg → mb-api

## Contexte et objectif

pilote-ppg stocke les valeurs d'avancement des indicateurs dans la table
`indicateur_territoire_valeur_evenement`. mb-api expose une API pour gérer des
valeurs d'avancement (`ValeurAvancement`) liées à des individus (qui, dans ce
contexte, représentent des territoires).

L'objectif est d'alimenter mb-api à partir des données de pilote-ppg via un
cron hebdomadaire. Seules les valeurs effectives sont transférées (pas les
propositions). Le transfert est incrémental : seul le delta depuis le dernier
run est envoyé.

---

## Périmètre

### Ce qui est inclus
- Synchronisation des événements `VALEUR_CREEE` et `VALEUR_MODIFIEE` → upsert dans mb-api
- Liste des indicateurs à synchroniser définie en dur dans le code
- Stockage d'un curseur de synchronisation en base pilote-ppg

### Ce qui est exclu
- Les événements de type `PROPOSITION_VALEUR_*`
- Les événements `VALEUR_HISTORISEE` (ignorés, pas de suppression côté mb-api)
- Les indicateurs non présents dans la liste de configuration

---

## Architecture

```
pilote-ppg (cron hebdomadaire)
  └── SELECT delta depuis indicateur_territoire_valeur_evenement
        └── VALEUR_CREEE / VALEUR_MODIFIEE
              └── PUT /indicateurs/{id}/valeurs:batch (mb-api, chunks ≤ 1 000)
```

Le cron est une route Next.js `pages/api/admin/cron/sync-mb-valeurs.ts`,
protégée par `onlyCron`, sur le même modèle que `rapport-service-autre.ts`.

---

## Données source

### Table `indicateur_territoire_valeur_evenement`

Champs utilisés :

| Champ               | Type     | Rôle                                      |
|---------------------|----------|-------------------------------------------|
| `indic_id`          | String   | Identifiant public de l'indicateur        |
| `territoire_code`   | String   | Public ID de l'individu dans mb-api       |
| `type_evenement`    | Enum     | Filtre sur VALEUR_CREEE / VALEUR_MODIFIEE |
| `date_valeur`       | Date     | Date de la valeur (`YYYY-MM-DD`)          |
| `valeur`            | Float?   | Valeur numérique                          |
| `date_modification` | DateTime | Curseur de delta (`@updatedAt`)           |
| `ordre`             | Int      | Départage des événements simultanés       |

### Requête delta

Pour chaque indicateur de la liste, on récupère le **dernier événement** par
triplet `(indic_id, territoire_code, date_valeur)` parmi les lignes modifiées
depuis `lastSyncAt`, en excluant les propositions :

```sql
SELECT DISTINCT ON (indic_id, territoire_code, date_valeur)
  indic_id, territoire_code, date_valeur, type_evenement, valeur
FROM indicateur_territoire_valeur_evenement
WHERE indic_id = $indicId
  AND type_evenement IN ('VALEUR_CREEE', 'VALEUR_MODIFIEE')
  AND date_modification > $lastSyncAt
ORDER BY indic_id, territoire_code, date_valeur, ordre DESC
```

---

## Données cible

### Route batch (upsert)

`PUT /indicateurs/{publicId}/valeurs:batch`

```json
{
  "items": [
    { "individu": "territoire_code", "date": "YYYY-MM-DD", "valeur": 42.5 }
  ]
}
```

- Atomique par chunk de 1 000 items maximum (limite mb-api)
- Sémantique upsert sur `(indicateurId, individuId, date)` : écrase si existant

---

## Mapping pilote-ppg → mb-api

| pilote-ppg        | mb-api             | Notes                       |
|-------------------|--------------------|-----------------------------|
| `indic_id`        | `{id}` (URL param) | Public ID identique         |
| `territoire_code` | `individu`         | Public ID identique         |
| `date_valeur`     | `date`             | Formaté en `YYYY-MM-DD`     |
| `valeur`          | `valeur`           | Float → Decimal(20,2)       |

---

## Curseur de synchronisation

### Nouveau modèle Prisma

```prisma
model mb_sync_execution {
  id                 String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  derniere_date_sync DateTime

  @@schema("public")
}
```

Même pattern que `datajobs_execution`. Une seule ligne, créée au premier run.

### Lecture

Si aucune ligne n'existe → `lastSyncAt = new Date(0)` (epoch = full sync initial).

### Écriture

Le curseur est mis à jour **uniquement après** que tous les indicateurs ont été
traités avec succès. En cas d'erreur sur un seul indicateur, le curseur ne
bouge pas et le prochain run re-traitera l'intégralité du delta.
Les upserts étant idempotents, re-envoyer un delta déjà traité est sans danger.

---

## Algorithme du cron

```
1. Lire lastSyncAt depuis mb_sync_execution (epoch si absent)
2. Pour chaque indicId dans INDICATEURS_A_SYNCHRONISER :
   a. Requête delta (VALEUR_CREEE + VALEUR_MODIFIEE modifiés depuis lastSyncAt)
   b. Si aucun résultat : passer à l'indicateur suivant
   c. Chunker les items par 1 000
   d. Pour chaque chunk :
      - PUT /indicateurs/{indicId}/valeurs:batch
      - 400 BATCH_INVALID : logger les erreurs détaillées, lever une exception
        (stoppe les chunks suivants du même indicateur)
      - 4xx/5xx autre : lever une exception
3. Si tous les indicateurs ont réussi : mettre à jour derniere_date_sync = now()
4. Logger et retourner un résumé : { indicateurs: [{ id, total, chunks }] }
En cas d'exception en étape 2 : retourner 500 + notification Tchap (si PROD)
```

---

## Configuration

### Liste des indicateurs

```typescript
// src/pages/api/admin/cron/sync-mb-valeurs.ts
const INDICATEURS_A_SYNCHRONISER: string[] = [
  // à compléter avant mise en prod
]
```

### Variables d'environnement

| Variable          | Description                       |
|-------------------|-----------------------------------|
| `MB_API_BASE_URL` | URL de base de mb-api             |
| `MB_API_KEY`      | Clé API (format `pilote_live_xxx`) |

Ajoutées dans `configuration()` au même titre que les autres secrets.

### Auth

Header HTTP : `Authorization: Bearer <MB_API_KEY>`

---

## Gestion des erreurs

| Cas                         | Comportement                                                   |
|-----------------------------|----------------------------------------------------------------|
| `BATCH_INVALID` (400)       | Log des indices en erreur + exception, chunks suivants stoppés |
| Erreur réseau / 5xx mb-api  | Exception immédiate, curseur non avancé                        |
| 403 sur un indicateur       | Exception (l'indicateur doit avoir les permissions WRITE)      |
| Delta vide pour un indic.   | Run silencieux, pas d'appel HTTP                               |
| Double exécution (retry)    | Idempotent : les upserts écrasent sans effet de bord           |

---

## Tests attendus

### Unit
- `mapEvenementsToItems` : mapping correct des champs pilote-ppg → mb-api
- `chunkItems` : découpe correctement à 1 000

### Intégration
- Delta contenant des VALEUR_CREEE et VALEUR_MODIFIEE → appel batch avec les bons items
- Curseur avancé après succès complet
- Curseur non avancé si un indicateur échoue
- Événements antérieurs à `lastSyncAt` → exclus du delta
- VALEUR_HISTORISEE dans le delta → ignorée (pas présente dans les items envoyés)
- Delta vide → aucun appel HTTP, curseur avancé normalement

---

## Points ouverts

- Confirmer que `territoire_code` dans pilote-ppg correspond bien 1:1 au
  `publicId` de l'individu dans mb-api pour chaque indicateur synchronisé.
- Renseigner `INDICATEURS_A_SYNCHRONISER` avant la mise en prod.
- Confirmer que la `MB_API_KEY` a bien les permissions WRITE sur tous les
  indicateurs listés.

---

## Plan d'implémentation

### Étape 1 — Prisma : nouveau modèle `mb_sync_execution`

**Fichier :** `src/database/prisma/schema.prisma`

Ajouter le modèle :

```prisma
model mb_sync_execution {
  id                 String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  derniere_date_sync DateTime

  @@schema("public")
}
```

Puis générer et appliquer la migration :
```bash
pnpm database:migration
```

---

### Étape 2 — Config : variables d'environnement mb-api

**Fichier :** `src/config.ts`

Ajouter un bloc `mbApi` au même niveau que `tchap` :

```typescript
mbApi: {
  baseUrl: {
    format: String,
    default: "",
    env: "MB_API_BASE_URL",
  },
  apiKey: {
    format: String,
    default: "",
    env: "MB_API_KEY",
  },
},
```

Ajouter également un `roomIdSyncMbValeurs` dans le bloc `tchap` pour les
notifications d'erreur :

```typescript
roomIdSyncMbValeurs: {
  format: String,
  default: "",
  env: "TCHAP_ROOM_ID_SYNC_MB_VALEURS",
},
```

---

### Étape 3 — Module `mb-sync`

Créer `src/server/mb-sync/` avec la structure suivante :

```
src/server/mb-sync/
├── MbSyncExecutionRepository.ts   # lecture/écriture du curseur
├── MbApiClient.ts                 # appels HTTP vers mb-api
├── SyncMbValeursUseCase.ts        # orchestration principale
└── module.ts                      # enregistrement DI
```

#### `MbSyncExecutionRepository.ts`

Deux méthodes :
- `recupererDerniereDateSync(): Promise<Date>` — lit `mb_sync_execution.findFirst()`,
  retourne `new Date(0)` si absent
- `mettreAJourDerniereDateSync(date: Date): Promise<void>` — upsert sur la ligne unique

#### `MbApiClient.ts`

Une méthode :
- `upsertBatch(indicateurId: string, items: UpsertItem[]): Promise<void>` —
  chunke `items` en tranches de 1 000, envoie chaque chunk via
  `PUT /indicateurs/{id}/valeurs:batch` avec le header
  `Authorization: Bearer <apiKey>`. Lève une exception sur 4xx/5xx.

Type `UpsertItem` : `{ individu: string; date: string; valeur: number }`

#### `SyncMbValeursUseCase.ts`

Orchestration :

```
1. lastSyncAt ← MbSyncExecutionRepository.recupererDerniereDateSync()
2. Pour chaque indicId dans INDICATEURS_A_SYNCHRONISER :
   a. prisma.indicateur_territoire_valeur_evenement.findMany({
        where: {
          indic_id: indicId,
          type_evenement: { in: [VALEUR_CREEE, VALEUR_MODIFIEE] },
          date_modification: { gt: lastSyncAt },
        },
        distinct: ['indic_id', 'territoire_code', 'date_valeur'],
        orderBy: [
          { territoire_code: 'asc' },
          { date_valeur: 'asc' },
          { ordre: 'desc' },
        ],
      })
   b. Mapper chaque ligne → UpsertItem
   c. MbApiClient.upsertBatch(indicId, items)
3. MbSyncExecutionRepository.mettreAJourDerniereDateSync(now)
4. Retourner { indicateurs: [{ id, total }] }
```

> Note sur le DISTINCT : Prisma ne supporte pas `DISTINCT ON` nativement.
> Utiliser `prisma.$queryRaw` pour la requête delta, ou post-filtrer en mémoire
> en déduplicant par `(territoire_code, date_valeur)` après tri par `ordre DESC`.

#### `module.ts`

Enregistrer `MbSyncExecutionRepository`, `MbApiClient` et
`SyncMbValeursUseCase` dans le conteneur DI, avec import du module `shared`.

---

### Étape 4 — Route cron

**Fichier :** `src/pages/api/admin/cron/sync-mb-valeurs.ts`

Modèle identique à `rapport-service-autre.ts` :

```typescript
async function handler(req, res) {
  const isProd = configuration().scalingoEnvironment === "PROD"
  const { baseUrl, roomId, accessToken } = /* tchap sync config */

  try {
    const useCase = getContainer("mb-sync").resolve("syncMbValeursUseCase")
    const result = await useCase.execute()
    logger.info({ ... }, "Sync mb-valeurs terminée")
    return res.status(200).json(result)
  } catch (error) {
    logger.error({ ... }, `Erreur sync mb-valeurs : ${error.message}`)
    if (isProd) envoieMessageTchap(messageErreur, baseUrl, roomId, accessToken)
    return res.status(500).json({ error: "Internal server error" })
  }
}

export default onlyCron(handler)
```

---

### Ordre d'implémentation recommandé

| # | Tâche                                              | Fichiers touchés                               |
|---|---------------------------------------------------|------------------------------------------------|
| 1 | Modèle Prisma + migration                          | `schema.prisma`, migration générée             |
| 2 | Variables de config                                | `src/config.ts`                                |
| 3 | `MbSyncExecutionRepository` + tests               | `src/server/mb-sync/`                          |
| 4 | `MbApiClient` + tests (mock fetch)                | `src/server/mb-sync/`                          |
| 5 | `SyncMbValeursUseCase` + tests d'intégration      | `src/server/mb-sync/`                          |
| 6 | `module.ts`                                        | `src/server/mb-sync/`                          |
| 7 | Route cron                                         | `src/pages/api/admin/cron/sync-mb-valeurs.ts`  |
