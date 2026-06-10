# Spec : Synchronisation des objectifs (vc) vers mb-api

Date : 2026-06-10

## Contexte

Le cron `sync-mb-valeurs` synchronise déjà les métadonnées et les valeurs d'avancement (va) de PPG vers mb-api. Les valeurs cibles (`metric_type = 'vc'`) stockées dans `mesure_indicateur` ne sont pas encore synchronisées. Cette spec couvre l'ajout de cette synchronisation dans la même route cron.

---

## Objectif

Pour chaque indicateur de `INDICATEURS_A_SYNCHRONISER` :

1. Lire la dernière valeur cible par couple `(zone_id, metric_date)` dans `mesure_indicateur`
2. Convertir `zone_id` en `territoire.code` (format mb-api)
3. Envoyer un upsert batch vers la nouvelle route `PUT /indicateurs/:id/objectifs:batch` de mb-api
4. Supprimer dans mb-api les objectifs dont `metric_value` est `null`

---

## Périmètre

- Même liste d'indicateurs que les valeurs : `INDICATEURS_A_SYNCHRONISER`
- Synchronisation complète à chaque exécution du cron (pas de delta/événements)
- Pas de suppression si une vc disparaît côté PPG (seule la mise à null déclenche un DELETE)
- Pas de prise en compte de l'idempotence à ce stade (sera traité ultérieurement)

---

## Architecture

### Vue d'ensemble

```
cron handler (sync-mb-valeurs.ts)
  └── SyncMbObjectifsUseCase
        ├── MesureIndicateurObjectifRepository  (port)
        │     └── PrismaMesureIndicateurObjectifRepository  (adapter)
        └── MbApiClient  (port — méthodes ajoutées)
              └── HttpMbApiClient  (adapter — méthodes ajoutées)
                    └── PUT /indicateurs/:id/objectifs:batch  (mb-api — nouveau endpoint)
```

---

## Détail : mb-api

### Nouveau endpoint `PUT /indicateurs/:id/objectifs:batch`

Modélisé sur `PUT /indicateurs/:id/valeurs:batch` existant.

**Fichiers à créer / modifier :**

| Action | Fichier |
|--------|---------|
| Nouveau schéma | `packages/mb-shared/src/objectifIndicateurIndividu/index.ts` |
| Nouveau endpoint | `apps/mb-api/src/objectifIndicateurIndividu/routes.ts` |
| Nouvelle command | `apps/mb-api/src/objectifIndicateurIndividu/commands/upsertObjectifsIndicateurBatch.ts` |

#### Schémas Zod à ajouter dans `mb-shared`

```ts
export const upsertObjectifsIndicateurBatchItemSchema = z.object({
  individu: individuPublicIdSchema,
  dateCible: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  valeurCible: z.number(),
})

export const upsertObjectifsIndicateurBatchBodySchema = z.object({
  items: z.array(upsertObjectifsIndicateurBatchItemSchema).min(1).max(1000),
})

export const upsertObjectifsIndicateurBatchResultApiModelSchema = z.object({
  total: z.number(),
  created: z.number(),
  updated: z.number(),
})
```

#### Comportement de la command

- **Validation préalable** (tout-ou-rien) :
  - Détection des doublons `(individu, dateCible)` dans le payload → `DUPLICATE_KEY`
  - Vérification que chaque `individu` existe ET est rattaché à un référentiel lié à l'indicateur → `INDIVIDU_INCONNU`
  - Si erreurs → retour `BATCH_INVALID` sans aucun write
- **Write** : upsert sur la clé `(indicateur, individu, dateCible)` — remplace `valeurCible` si existe
- **Réponse** : `{ total, created, updated }`

#### Route

```
PUT /indicateurs/{id}/objectifs:batch
```

Réponses :
- `200` : `UpsertObjectifsIndicateurBatchResultApiModel`
- `400` : `BATCH_INVALID` (avec `details.errors`) ou `VALIDATION_ERROR`
- `403` : Pas de permission WRITE

---

## Détail : pilote-ppg

### Port : `MesureIndicateurObjectifRepository`

```ts
// domain/ports/MesureIndicateurObjectifRepository.ts
export type ObjectifMesure = {
  zone_id: string;       // ex. "DEPT-75", "NAT-FR", "REG-84"
  metric_date: string;   // ex. "2025-12-31"
  metric_value: number | null;
}

export interface MesureIndicateurObjectifRepository {
  recupererDernieresValeurssCibles(args: {
    indicId: string;
  }): Promise<ObjectifMesure[]>;
}
```

### Adapter : `PrismaMesureIndicateurObjectifRepository`

**Requête Prisma** : dernière `metric_value` par `(zone_id, metric_date)` pour `metric_type = 'vc'`.

Le concept de "dernière" est défini par la `date_import` la plus récente. Prisma n'ayant pas de `DISTINCT ON`, on utilise une approche `groupBy` + sous-requête, ou une raw query SQL :

```sql
SELECT DISTINCT ON (zone_id, metric_date)
  zone_id,
  metric_date,
  metric_value
FROM raw_data.mesure_indicateur
WHERE indic_id = $1
  AND metric_type = 'vc'
ORDER BY zone_id, metric_date, date_import DESC
```

Implémenté via `prisma.$queryRaw` avec paramètre positionnel pour éviter l'injection SQL.

### Conversion `zone_id` → `territoire.code`

La fonction `convertirZoneIdEnTerritoireCode` (dans `src/server/app/domain/Territoire.ts`) réalise la conversion :

| zone_id (mesure_indicateur) | territoire.code (individu mb-api) |
|-----------------------------|----------------------------------|
| `NAT-FR`                    | `FRANCE`                         |
| `DEPT-75`                   | `D75`                            |
| `REG-84`                    | `R84`                            |

Cette conversion est appliquée dans le use case, pas dans le repository (qui reste orienté domaine PPG).

### Port `MbApiClient` — méthodes à ajouter

```ts
export type UpsertObjectifIndicateurItem = {
  individu: string;
  dateCible: string;
  valeurCible: number;
}

export type DeleteObjectifIndicateurItem = {
  individu: string;
  dateCible: string;
}

// Dans l'interface MbApiClient :
upsertObjectifsIndicateurBatch(args: {
  indicId: string;
  items: UpsertObjectifIndicateurItem[];
}): Promise<number>;

deleteObjectifIndicateur(args: {
  indicId: string;
  item: DeleteObjectifIndicateurItem;
}): Promise<void>;
```

### Implémentation `HttpMbApiClient`

- `upsertObjectifsIndicateurBatch` : `PUT /indicateurs/:indicId/objectifs:batch`
  - Chunking par tranches de 1000 si `items.length > 1000`
  - Agrège les compteurs de chaque chunk et retourne le total d'upserts
  - Throws sur HTTP non-2xx
- `deleteObjectifIndicateur` : `DELETE /indicateurs/:indicId/objectifs`
  - Body : `{ individu, dateCible }`
  - Throws sur HTTP non-2xx

### Use Case : `SyncMbObjectifsUseCase`

```ts
export type SyncObjectifsResultat = {
  indicateurs: Array<{ id: string; upserts: number; deletes: number }>;
}
```

**Algorithme par indicateur :**

```
1. Récupérer toutes les dernières vc via MesureIndicateurObjectifRepository
2. Séparer en deux groupes :
   - upserts : metric_value !== null
   - deletes : metric_value === null
3. Convertir zone_id → territoire.code pour chaque item
4. Si upserts > 0 : appeler upsertObjectifsIndicateurBatch (avec chunking auto dans l'adapter)
5. Pour chaque delete : appeler deleteObjectifIndicateur (séquentiel, comme les valeurs)
6. Logger le résultat par indicateur
```

Même comportement d'erreur que `SyncMbValeursUseCase` : toute exception sur un indicateur fait échouer l'ensemble du use case (pas de try/catch par indicateur).

### Module `mbSync` — changements

**Nouveau port à enregistrer** :

```ts
mesureIndicateurObjectifRepository: asModuleClass(PrismaMesureIndicateurObjectifRepository),
```

**Nouvel export** :

```ts
syncMbObjectifsUseCase: asModuleClass(SyncMbObjectifsUseCase),
```

Mise à jour de `MbSyncExports` et `MbSyncCradle` en conséquence.

### Cron handler — changements

Ajout d'un troisième bloc `try/catch` dans `handler` après les valeurs :

```ts
try {
  const objectifs = await container
    .resolve("syncMbObjectifsUseCase")
    .execute(INDICATEURS_A_SYNCHRONISER);

  logger.info(
    { categorie: "sync", source: "cron/sync-mb-valeurs", metadonnees, valeurs, objectifs },
    "Synchronisation mb-objectifs terminée avec succès",
  );

  return res.status(200).json({ metadonnees, valeurs, objectifs });
} catch (error) {
  logger.error(...);
  if (isProd) envoieMessageTchap("## ⚠️ Erreur lors de la synchronisation mb-objectifs...");
  return res.status(500).json({ error: "Internal server error" });
}
```

---

## Gestion des erreurs

| Situation | Comportement |
|-----------|-------------|
| `INDIVIDU_INCONNU` dans le batch mb-api | Throw (erreur HTTP 400) → indicateur courant échoue → cron échoue |
| `metric_value` non parseable en number | À évaluer : soit filtrer+logger, soit laisser échouer le batch |
| HTTP timeout sur mb-api | Throw → cron échoue |
| zone_id sans correspondance dans la conversion | `convertirZoneIdEnTerritoireCode` throw → cron échoue |

> **Point d'attention :** `metric_value` est stocké en `String` dans `mesure_indicateur`. Il faudra parser `parseFloat(metric_value)` et filtrer les valeurs non numériques (`NaN`) avec un warning logger, plutôt que de laisser le batch échouer sur un artefact de donnée.

---

## Reporting

La réponse JSON du cron intègre un troisième champ `objectifs` avec la même structure que `valeurs` :

```json
{
  "metadonnees": { ... },
  "valeurs": { "indicateurs": [...], "lastSyncAt": "..." },
  "objectifs": {
    "indicateurs": [
      { "id": "IND-510", "upserts": 12, "deletes": 0 },
      ...
    ]
  }
}
```

Notification Tchap identique en cas d'erreur.

---

## Fichiers à créer / modifier

### mb-shared (`packages/mb-shared`)

| Action | Fichier |
|--------|---------|
| Modifier | `src/objectifIndicateurIndividu/index.ts` — ajout des schémas batch |

### mb-api (`apps/mb-api`)

| Action | Fichier |
|--------|---------|
| Modifier | `src/objectifIndicateurIndividu/routes.ts` — ajout route batch |
| Créer | `src/objectifIndicateurIndividu/commands/upsertObjectifsIndicateurBatch.ts` |

### pilote-ppg (`apps/pilote-ppg`)

| Action | Fichier |
|--------|---------|
| Créer | `src/server/mb-sync/domain/ports/MesureIndicateurObjectifRepository.ts` |
| Créer | `src/server/mb-sync/infrastructure/adapters/PrismaMesureIndicateurObjectifRepository.ts` |
| Modifier | `src/server/mb-sync/domain/ports/MbApiClient.ts` — ajout types + méthodes |
| Modifier | `src/server/mb-sync/infrastructure/adapters/HttpMbApiClient.ts` — impl. méthodes |
| Créer | `src/server/mb-sync/usecases/SyncMbObjectifsUseCase.ts` |
| Modifier | `src/server/mb-sync/module.ts` — enregistrement + export |
| Modifier | `src/pages/api/admin/cron/sync-mb-valeurs.ts` — appel use case + logging |

### Tests

| Action | Fichier |
|--------|---------|
| Créer | `src/server/mb-sync/__tests__/usecases/SyncMbObjectifsUseCase.unit.test.ts` |
| Créer | `src/server/mb-sync/__tests__/infrastructure/adapters/PrismaMesureIndicateurObjectifRepository.integration.test.ts` |
| Créer | `apps/mb-api/src/objectifIndicateurIndividu/__tests__/commands/upsertObjectifsIndicateurBatch.integration.test.ts` |

---

## Points ouverts

- **Parsing de `metric_value`** : filter+warn sur données non numériques (NaN)
- **Idempotence** : sera traitée dans une itération ultérieure
- **Fréquence du cron** : non spécifiée à ce stade

---

## Plan d'implémentation

Les étapes sont ordonnées par dépendances : mb-shared d'abord (consommé par mb-api et pilote-ppg), puis mb-api, puis pilote-ppg de l'intérieur vers l'extérieur.

### Étape 1 — `mb-shared` : schémas batch objectifs

**Fichier :** `packages/mb-shared/src/objectifIndicateurIndividu/index.ts`

Ajouter :
- `upsertObjectifsIndicateurBatchItemSchema`
- `upsertObjectifsIndicateurBatchBodySchema`
- `upsertObjectifsIndicateurBatchResultApiModelSchema`

Exporter les types TypeScript inférés correspondants.

---

### Étape 2 — `mb-api` : command `upsertObjectifsIndicateurBatch`

**Fichier à créer :** `apps/mb-api/src/objectifIndicateurIndividu/commands/upsertObjectifsIndicateurBatch.ts`

Calquer sur `upsertValeursAvancementBatch` :
1. Valider l'absence de doublons `(individu, dateCible)`
2. Résoudre les individus (existence + rattachement au référentiel de l'indicateur)
3. Retourner `BATCH_INVALID` si erreurs, sinon upsert et retourner `{ total, created, updated }`

---

### Étape 3 — `mb-api` : route `PUT /indicateurs/:id/objectifs:batch`

**Fichier à modifier :** `apps/mb-api/src/objectifIndicateurIndividu/routes.ts`

Ajouter la route en suivant le pattern de `upsertValeursAvancementBatchRoute` :
- Réponses : `200` (résultat batch), `400` (`BATCH_INVALID` ou `VALIDATION_ERROR`), `403`
- Brancher sur `upsertObjectifsIndicateurBatch`

---

### Étape 4 — `pilote-ppg` : port `MesureIndicateurObjectifRepository`

**Fichier à créer :** `src/server/mb-sync/domain/ports/MesureIndicateurObjectifRepository.ts`

Définir le type `ObjectifMesure` et l'interface avec `recupererDernieresValeursCibles({ indicId })`.

---

### Étape 5 — `pilote-ppg` : adapter `PrismaMesureIndicateurObjectifRepository`

**Fichier à créer :** `src/server/mb-sync/infrastructure/adapters/PrismaMesureIndicateurObjectifRepository.ts`

Implémenter via `prisma.$queryRaw` avec `DISTINCT ON (zone_id, metric_date) ORDER BY date_import DESC`.

Écrire le test d'intégration en parallèle :
`src/server/mb-sync/__tests__/infrastructure/adapters/PrismaMesureIndicateurObjectifRepository.integration.test.ts`

---

### Étape 6 — `pilote-ppg` : extension de `MbApiClient`

**Fichier à modifier :** `src/server/mb-sync/domain/ports/MbApiClient.ts`

Ajouter les types `UpsertObjectifIndicateurItem` et `DeleteObjectifIndicateurItem`, et les deux méthodes à l'interface.

---

### Étape 7 — `pilote-ppg` : extension de `HttpMbApiClient`

**Fichier à modifier :** `src/server/mb-sync/infrastructure/adapters/HttpMbApiClient.ts`

Implémenter :
- `upsertObjectifsIndicateurBatch` : découpage en chunks de 1000, appels séquentiels, agrégation des compteurs
- `deleteObjectifIndicateur` : DELETE unitaire avec body `{ individu, dateCible }`

---

### Étape 8 — `pilote-ppg` : `SyncMbObjectifsUseCase`

**Fichier à créer :** `src/server/mb-sync/usecases/SyncMbObjectifsUseCase.ts`

Implémenter l'algorithme décrit dans la spec :
- Récupérer les vc, séparer upserts / deletes
- Convertir `zone_id` → `territoire.code` via `convertirZoneIdEnTerritoireCode` (filtrer les NaN avec logger.warn)
- Appeler `upsertObjectifsIndicateurBatch` puis les deletes individuels
- Retourner `SyncObjectifsResultat`

Écrire le test unitaire en parallèle :
`src/server/mb-sync/__tests__/usecases/SyncMbObjectifsUseCase.unit.test.ts`

---

### Étape 9 — `pilote-ppg` : enregistrement dans le module

**Fichier à modifier :** `src/server/mb-sync/module.ts`

- Ajouter `mesureIndicateurObjectifRepository` dans le cradle
- Ajouter `syncMbObjectifsUseCase` dans les exports
- Mettre à jour `MbSyncExports` et `MbSyncCradle`

---

### Étape 10 — `pilote-ppg` : mise à jour du cron handler

**Fichier à modifier :** `src/pages/api/admin/cron/sync-mb-valeurs.ts`

- Résoudre `syncMbObjectifsUseCase` depuis le container
- Ajouter le bloc try/catch après les valeurs
- Inclure `objectifs` dans le log final et la réponse JSON
