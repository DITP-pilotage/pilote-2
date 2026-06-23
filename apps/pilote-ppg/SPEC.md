# Spec : sync des métadonnées indicateurs vers mb-api

Date : 2026-06-05

## Contexte

La PR #2187 a mis en place la synchronisation hebdomadaire des **valeurs d'avancement** de pilote-ppg vers mb-api (`PUT /indicateurs/{id}/valeurs:batch`). Avant d'envoyer les valeurs, mb-api doit connaître l'indicateur (son nom, sa visibilité, ses référentiels). Aujourd'hui cet enregistrement est manuel. Cette spec couvre l'ajout d'une synchronisation automatique des **métadonnées** des indicateurs, exécutée en amont de la sync valeurs dans le même cron hebdomadaire.

## Objectif

Pour chaque indicateur de `INDICATEURS_A_SYNCHRONISER`, appeler `PUT /indicateurs/{id}` sur mb-api avec le nom, la visibilité et les référentiels dérivés de pilote-ppg, **avant** d'envoyer les valeurs.

---

## Architecture

### Nouveau use case : `SyncMbMetadonneesUseCase`

Fichier : `src/server/mb-sync/usecases/SyncMbMetadonneesUseCase.ts`

Responsabilités :
- Lire `indicateur_identite` en base pour chaque indicateur de `INDICATEURS_A_SYNCHRONISER`
- Construire le payload de métadonnées (nom, visibilité, référentiels)
- Appeler `PUT /indicateurs/{id}` via un nouveau port `MbIndicateurClient`
- Retourner un résumé par indicateur (`ok` ou `non_trouve`)

Ce use case est **sans curseur** : il effectue toujours un full sync (les métadonnées ne génèrent pas d'événements, le `PUT` est idempotent).

### Nouveau port : `MbIndicateurClient`

Fichier : `src/server/mb-sync/domain/ports/MbIndicateurClient.ts`

```typescript
export type UpsertIndicateurPayload = {
  nom: string;
  visibilite: "PRIVE" | "PUBLIC";
  referentiels: Array<{
    id: string;
    fonctionAgregation: "SUM" | "AVG" | "NONE";
  }>;
};

export interface MbIndicateurClient {
  upsertIndicateur(
    id: string,
    payload: UpsertIndicateurPayload,
  ): Promise<void>;
}
```

### Nouvel adapteur : `HttpMbIndicateurClient`

Fichier : `src/server/mb-sync/infrastructure/adapters/HttpMbIndicateurClient.ts`

Appelle `PUT ${baseUrl}/indicateurs/${id}` avec le Bearer token `MB_API_KEY`. Lève une exception si la réponse n'est pas 2xx.

### Enregistrement DI (`module.ts`)

Ajouter dans le cradle :
- `mbIndicateurClient: asModuleClass(HttpMbIndicateurClient)`
- `syncMbMetadonneesUseCase: asModuleClass(SyncMbMetadonneesUseCase)`

Exporter `syncMbMetadonneesUseCase` dans `MbSyncExports`.

---

## Comportement de `SyncMbMetadonneesUseCase`

```
Pour chaque indicId dans INDICATEURS_A_SYNCHRONISER :
  1. Lire indicateur_identite WHERE id = indicId
  2. Si absent → logger.warn + pousser { id: indicId, statut: "non_trouve" } + continuer
  3. Si présent :
     a. Construire le payload (voir mapping ci-dessous)
     b. Appeler mbIndicateurClient.upsertIndicateur(indicId, payload)
     c. Si l'appel échoue → lever l'exception (bloque la suite du cron)
     d. Pousser { id: indicId, statut: "ok" }

Retourner : { indicateurs: Array<{ id: string; statut: "ok" | "non_trouve" }> }
```

---

## Mapping pilote-ppg → mb-api

| Champ mb-api | Source pilote-ppg | Règle |
|---|---|---|
| `nom` | `indicateur_identite.nom` | Valeur directe |
| `visibilite` | — | Toujours `"PRIVE"` |
| `referentiels` | `indicateur_identite.mailles_applicables` | Voir tableau ci-dessous |

### Mapping mailles → référentiels

| Maille (`mailles_applicables`) | `id` |
|---|---|
| `NAT` | `REF-NAT` |
| `REG` | `REF-REG` |
| `DEPT` | `REF-DEPT` |

Chaque maille présente dans `mailles_applicables` produit un élément dans le tableau `referentiels`. Sémantique replace-all : toute configuration de référentiels posée manuellement dans mb-api sera écrasée à chaque run.

> **Point à confirmer** : valeur de `fonctionAgregation` par référentiel. Les valeurs sont saisies directement dans pilote (pas dérivées par agrégation), ce qui suggère `"NONE"` pour tous les référentiels. À valider avant implémentation.

---

## Gestion d'erreurs

| Situation | Comportement |
|---|---|
| `indicateur_identite` absent pour un `indicId` | Log warning, statut `non_trouve`, on continue avec l'indicateur suivant |
| Appel HTTP échoue (4xx / 5xx) | Exception levée, cron retourne 500, curseur valeurs non avancé, Tchap notifié |
| Metadata OK, valeurs échouent | Tchap notifié, curseur non avancé, prochain run refait metadata + valeurs |

---

## Orchestration dans le handler cron

Fichier : `src/pages/api/admin/cron/sync-mb-valeurs.ts`

Séquence :
1. Appeler `syncMbMetadonneesUseCase.execute()` → résultat métadonnées
2. Si exception → Tchap + 500 (avec message identifiant l'étape metadata)
3. Appeler `syncMbValeursUseCase.execute()` → résultat valeurs
4. Si exception → Tchap + 500 (avec message identifiant l'étape valeurs)
5. Retourner 200 avec les deux résultats

### Notification Tchap

Un seul message générique par étape, avec le nom de l'étape dans le corps :

- Metadata : `"⚠️ Erreur sync mb-metadonnees — voir les logs"`
- Valeurs : `"⚠️ Erreur sync mb-valeurs — voir les logs"`

### Réponse JSON enrichie (200)

```json
{
  "metadonnees": {
    "indicateurs": [
      { "id": "IND-003", "statut": "ok" }
    ]
  },
  "valeurs": {
    "lastSyncAt": "2026-05-29T00:00:00.000Z",
    "indicateurs": [
      { "id": "IND-003", "total": 12 }
    ]
  }
}
```

---

## Tests à écrire

Fichier : `src/server/mb-sync/__tests__/usecases/SyncMbMetadonneesUseCase.integration.test.ts`

| Cas | Attendu |
|---|---|
| Indicateur présent avec mailles `[NAT, REG]` | `upsertIndicateur` appelé avec `referentiels: [REF-NAT, REF-REG]`, statut `ok` |
| Indicateur absent de `indicateur_identite` | `upsertIndicateur` non appelé, statut `non_trouve` |
| `upsertIndicateur` lève une erreur | Exception propagée |

---

## Fichiers à créer / modifier

| Action | Fichier |
|---|---|
| Créer | `src/server/mb-sync/domain/ports/MbIndicateurClient.ts` |
| Créer | `src/server/mb-sync/infrastructure/adapters/HttpMbIndicateurClient.ts` |
| Créer | `src/server/mb-sync/usecases/SyncMbMetadonneesUseCase.ts` |
| Créer | `src/server/mb-sync/__tests__/usecases/SyncMbMetadonneesUseCase.integration.test.ts` |
| Modifier | `src/server/mb-sync/module.ts` — enregistrer les nouveaux composants |
| Modifier | `src/pages/api/admin/cron/sync-mb-valeurs.ts` — orchestration + réponse enrichie |

---

## Point ouvert bloquant

**`fonctionAgregation`** : valeur à utiliser pour chaque référentiel (`SUM`, `AVG`, `NONE`). À confirmer avant de coder `SyncMbMetadonneesUseCase`.
