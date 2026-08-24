---
date: 2026-05-12
topic: liaison Indicateur ↔ Référentiels (scope d'un indicateur)
status: draft
---

# Liaison Indicateur ↔ Référentiels

## Contexte

Aujourd'hui, le modèle de données ne contient aucun lien direct entre un
`Indicateur` et un `Referentiel`. Le seul lien indirect passe par les
`ValeurAvancement` : un individu est implicitement "couvert" par un
indicateur s'il a au moins une valeur saisie. Conséquence :

- Impossible de déterminer *a priori* quels individus un indicateur a
  vocation à couvrir (avant toute saisie de valeur).
- L'endpoint `GET /indicateurs/:id/individus` ne peut lister que les
  individus ayant déjà des valeurs, ce qui exclut tous ceux pour qui on
  *devrait* pouvoir saisir.
- Il n'existe pas de contrôle applicatif pour vérifier qu'une valeur
  est saisie sur un individu pertinent vis-à-vis de l'indicateur.

On introduit une liaison explicite N..N entre `Indicateur` et
`Referentiel`. Un indicateur déclare l'ensemble des référentiels dont
les individus sont autorisés. Cette liaison sert de fondation à des
fonctionnalités ultérieures (notamment l'upsert batch de valeurs, dont
le spec est en attente).

## Objectifs

1. Introduire une relation N..N `Indicateur ↔ Referentiel`.
2. Faire de `PUT /indicateurs/:id` la source de vérité de cette
   liaison, avec sémantique replace-all idempotente.
3. Exposer les référentiels liés en lecture, à la fois en ID seul (sur
   la ressource indicateur) et en ressources complètes (endpoint dédié).
4. Ne pas dupliquer côté `mb-api` une logique d'agrégation
   "individus autorisés par indicateur" — le client compose à partir
   des endpoints existants.

## Non-objectifs

- Modèle de permission sur `Referentiel`. Les référentiels restent
  publiquement lisibles, comme aujourd'hui.
- Cascade de validation rétroactive sur les `ValeurAvancement`
  existants : aucune valeur n'est invalidée par la liaison.
- Endpoint d'agrégation `GET /indicateurs/:id/individus-autorises` :
  le client appelle `GET /referentiels/:refId/individus` pour chaque
  référentiel listé.
- Tests E2E : non couverts par ce spec (hors scope).

## Modèle de données

Nouvelle table de liaison dans `apps/mb-api/prisma/schema.prisma` :

```prisma
model IndicateurReferentiel {
  indicateurId  String   @map("indicateur_id")  @db.Uuid
  referentielId String   @map("referentiel_id") @db.Uuid
  createdAt     DateTime @default(now())        @map("created_at")

  indicateur  Indicateur  @relation(fields: [indicateurId],  references: [id], onDelete: Cascade)
  referentiel Referentiel @relation(fields: [referentielId], references: [id], onDelete: Cascade)

  @@id([indicateurId, referentielId])
  @@index([referentielId])
  @@map("indicateur_referentiel")
}
```

Relations inverses ajoutées :

- `Indicateur.referentiels IndicateurReferentiel[]`
- `Referentiel.indicateurs IndicateurReferentiel[]`

Foreign keys avec `onDelete: Cascade` des deux côtés : supprimer un
indicateur ou un référentiel retire silencieusement les liens
correspondants. Pas d'effet de bord sur `ValeurAvancement` (qui ne
référence pas la table de liaison).

Migration Prisma `add_indicateur_referentiel` : création de la table
uniquement, aucun backfill. Les indicateurs existants se retrouvent avec
0 lien et restent fonctionnels (lecture / valeurs existantes
préservées) ; ils deviennent "inertes" vis-à-vis des consommateurs qui
veulent les individus autorisés tant qu'un `PUT` ne les a pas
rattachés.

Le seed (`apps/mb-api/prisma/seed.ts`) est étoffé pour créer quelques
liaisons de démo entre indicateurs et référentiels existants.

## Surface API

### Modifié — `PUT /indicateurs/:id`

Body évolue (breaking change) :

```ts
upsertIndicateurBodySchema = z.object({
  nom: z.string().min(1),
  referentielIds: z.array(referentielPublicIdSchema),
})
```

`referentielIds` est **requis** ; un tableau vide est valide et signifie
"aucun référentiel lié".

Sémantique : replace-all idempotent. À chaque PUT, l'ensemble des
liens devient strictement celui décrit dans le body. Pour minimiser
l'écriture, l'implémentation calcule le diff :

- `idsAAjouter = body \ existant`
- `idsASupprimer = existant \ body`

Les deux opérations s'exécutent dans la même transaction Prisma que
l'upsert du nom (`withTransaction`).

Validation :

- Schéma Zod sur chaque ID (`referentielPublicIdSchema`). Échec → `400`.
- Doublons dans `referentielIds` : autorisés mais dédupliqués
  silencieusement avant écriture.
- **Pré-check d'existence** : un `findMany` sur
  `referentiel.publicId IN (uniques)`. Si la diff `demandés \ trouvés`
  n'est pas vide → `400` :

  ```json
  {
    "code": "VALIDATION_ERROR",
    "message": "Référentiels inconnus",
    "details": { "unknownReferentielIds": ["REF-X", "REF-Y"] }
  }
  ```

- Foreign keys en base servent de filet de sécurité (defense-in-depth).

Permissions : inchangées. `WRITE` sur indicateur si déjà existant ; le
principal créateur reçoit `READ`+`WRITE` à la création.

### Modifié — `GET /indicateurs/:id` et `GET /indicateurs`

`indicateurApiModelSchema` (shared) gagne un champ :

```ts
referentielIds: z.array(referentielPublicIdSchema)
```

Présent sur la ressource détaillée et sur chaque item de la liste
paginée. Trié par `publicId` ASC pour la prédictibilité.

La query `listIndicateurs` reste cursor-based ; l'ajout de
`referentielIds` se fait via une jointure (ou un `include`) puis un map.

### Nouveau — `GET /indicateurs/:id/referentiels`

Retourne la liste **non paginée** des référentiels liés sous forme de
ressources complètes :

```ts
{ items: ReferentielApiModel[] }
```

Pas de pagination : le nombre de référentiels liés à un indicateur
restera petit (borné par le nombre de référentiels existants). Tri par
`publicId` ASC.

Permissions : `READ` sur indicateur. 404 `ENTITY_NOT_FOUND` si
l'indicateur n'existe pas ou n'est pas lisible par le principal. `200`
`{ items: [] }` si l'indicateur n'a aucun lien.

### Inchangés

- `GET /indicateurs/:id/individus` (individus ayant des valeurs)
- `GET /indicateurs/:id/valeurs`
- `GET /indicateurs/:id/valeurs-remarquables`
- `GET /referentiels/:id/individus` — réutilisé tel quel par les
  clients qui veulent itérer sur les `referentielIds` d'un indicateur.

### Récapitulatif

| Verbe | Route | Statut |
|---|---|---|
| GET  | `/indicateurs` | modifié (ajout `referentielIds`) |
| GET  | `/indicateurs/:id` | modifié (ajout `referentielIds`) |
| PUT  | `/indicateurs/:id` | modifié (body breaking : `referentielIds` requis) |
| GET  | `/indicateurs/:id/referentiels` | nouveau |
| GET  | `/indicateurs/:id/individus` | inchangé |
| GET  | `/indicateurs/:id/valeurs` | inchangé |
| GET  | `/indicateurs/:id/valeurs-remarquables` | inchangé |
| GET  | `/referentiels/:id/individus` | existant, réutilisé |

## Tests

Conventions actuelles `apps/mb-api/src/**/*.test.ts` (Vitest, base de
test).

| Cible | Cas couverts |
|---|---|
| `upsertIndicateur` | crée indicateur + liens • update indicateur + replace-all (ajout, suppression, idempotence) • body avec doublons dédupliqué • body avec `[]` supprime tous les liens • `referentielIds` inconnus → erreur applicative listant les IDs manquants |
| `PUT /indicateurs/:id` (route) | 400 Zod si `referentielIds` absent • 400 avec `details.unknownReferentielIds` si IDs inconnus • 403 si pas `WRITE` (régression) • 200 avec body de sortie incluant `referentielIds` |
| `listIndicateurs` / `getIndicateurByPublicId` | `referentielIds` exposé, trié `publicId` ASC, `[]` pour un indicateur sans lien |
| `listReferentielsForIndicateur` (nouvelle query) | 404 si indicateur introuvable • 200 `{ items: [] }` si aucun lien • 200 avec ressources complètes triées |

Les tests existants `listValeursForIndicateur`,
`listIndividusWithValeurs`, `listValeursRemarquablesForIndicateur` ne
sont **pas** modifiés (leur sémantique est inchangée).

## Impact côté `mb-webapp`

Le body de `PUT /indicateurs/:id` étant breaking, tout appel actuel
doit inclure `referentielIds`. La source du `Select` de la page
`apps/mb-webapp/src/routes/_authenticated/indicateurs/$id.tsx` doit
basculer sur la composition `GET /indicateurs/:id` →
`GET /referentiels/:refId/individus` (pour chaque `referentielId`).

La page doit gérer le cas "aucun référentiel lié" avec un message
explicite ("Aucun référentiel associé à cet indicateur") distinct du
cas actuel "aucune valeur saisie". L'ergonomie précise (sélecteur de
référentiels en amont du sélecteur d'individu, etc.) est laissée au
plan d'implémentation et n'est pas figée ici.

Aucun test E2E n'est introduit dans ce scope.

## Risques et points d'attention

- **Breaking change `PUT /indicateurs/:id`** : tous les consommateurs
  internes doivent migrer en même temps que le déploiement.
  L'ordonnancement du plan d'implémentation doit prévoir une PR unique
  ou une séquence courte pour éviter qu'un appelant casse en
  production.
- **Performance de `listIndicateurs`** : l'ajout de `referentielIds`
  ajoute une jointure. À 100 indicateurs par page max (`pageSize`
  borné), l'impact reste négligeable, mais la query doit être écrite
  pour ne pas exploser en N+1.
- **Volume de la table de liaison** : a priori faible (quelques
  référentiels par indicateur). Pas d'optimisation préventive.
