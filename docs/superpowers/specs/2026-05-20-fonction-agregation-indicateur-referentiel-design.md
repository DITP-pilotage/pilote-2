# Fonction d'agrégation par lien Indicateur–Référentiel

## Contexte

Aujourd'hui `getValeurDerivee` calcule la valeur d'un individu parent comme la **somme** des valeurs effectives de ses enfants, sans que cette stratégie ne soit déclarée nulle part. Le champ `agregateur: 'SUM'` dans la réponse API est un literal hardcodé.

On veut rendre la stratégie d'agrégation explicite et configurable par couple `(indicateur, référentiel)` :

- Tous les indicateurs ne sont pas dérivables (ex. moyennes, taux). Pour ceux-là, on doit pouvoir interdire le calcul de valeur dérivée.
- À terme, d'autres fonctions (AVG, MIN, MAX…) pourront être ajoutées sans changement structurel.

## Terminologie retenue

- **Dérivation** : action métier qui produit la valeur d'un parent depuis ses enfants. Conservée pour `valeurDerivee`, `getValeurDerivee`, etc.
- **Fonction d'agrégation** : méthode mathématique combinant les valeurs des enfants. Nouveau concept porté par la colonne ajoutée.

Valeurs initiales de l'enum : `SUM`, `NONE`. `NONE` signifie « pas de fonction d'agrégation déclarée → l'indicateur n'est pas dérivable pour ce référentiel ».

## Périmètre

### In scope

1. Ajout d'une enum Prisma `FonctionAgregation` et d'une colonne `fonctionAgregation` sur `IndicateurReferentiel`.
2. Migration du schéma API (`PUT /indicateurs/{id}`, `GET /indicateurs/{id}`, `GET /indicateurs`) pour exposer `referentiels: Array<{ referentielId, fonctionAgregation }>` en remplacement de `referentielIds: string[]`.
3. Mise à jour de `upsertIndicateur` pour gérer add/remove/update des liens avec leur fonction.
4. Mise à jour de `getValeurDerivee` :
   - lookup obligatoire du lien `(indicateurId, individu.referentielId)`,
   - 400 si lien absent ou `fonctionAgregation === NONE`,
   - calcul actuel inchangé quand `SUM`.
5. Mise à jour du champ de réponse : `agregateur` → `fonctionAgregation` (enum complet, plus de literal).
6. Mise à jour du seed avec un mix `SUM` / `NONE`.
7. Reset de la base (pas de migration de données legacy).
8. Mise à jour des tests back impactés.

### Out of scope

- Implémentation d'autres fonctions (AVG, MIN, MAX) : YAGNI, on garde `resolveValeurDerivee` paramétré uniquement pour SUM.
- Toute modification frontend (aucun consommateur actuel selon validation utilisateur).
- Logique de défaut côté seed/UI : la fonction est obligatoire dans le body PUT.

## Conception détaillée

### 1. Schéma Prisma

```prisma
enum FonctionAgregation {
  SUM
  NONE

  @@map("fonction_agregation_enum")
}

model IndicateurReferentiel {
  indicateurId       String             @map("indicateur_id")  @db.Uuid
  referentielId      String             @map("referentiel_id") @db.Uuid
  fonctionAgregation FonctionAgregation @map("fonction_agregation")
  createdAt          DateTime           @default(now())        @map("created_at")

  indicateur  Indicateur  @relation(fields: [indicateurId],  references: [id], onDelete: Cascade)
  referentiel Referentiel @relation(fields: [referentielId], references: [id], onDelete: Cascade)

  @@id([indicateurId, referentielId])
  @@index([referentielId])
  @@map("indicateur_referentiel")
}
```

Migration : `prisma migrate reset --force` (DB de dev, pas de prod à protéger).

### 2. Schéma API partagé (`packages/mb-shared/src/indicateur.ts`)

```ts
export const fonctionAgregationSchema = z
  .enum(['SUM', 'NONE'])
  .describe("Fonction d'agrégation appliquée lors du calcul de la valeur dérivée.")

export const indicateurReferentielLinkSchema = z.object({
  referentielId: referentielPublicIdSchema,
  fonctionAgregation: fonctionAgregationSchema,
})
export type IndicateurReferentielLink = z.infer<typeof indicateurReferentielLinkSchema>

export const indicateurApiModelSchema = z.object({
  id: indicateurPublicIdSchema,
  nom: z.string(),
  referentiels: z
    .array(indicateurReferentielLinkSchema)
    .describe('Référentiels liés à l\'indicateur, triés par identifiant public ASC.'),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
})

export const upsertIndicateurBodySchema = z.object({
  nom: z.string().min(1),
  referentiels: z
    .array(indicateurReferentielLinkSchema)
    .describe(
      'Liste complète des liens à appliquer (replace-all). Tableau vide pour aucun lien. ' +
        'Doublons silencieusement dédupliqués (sur referentielId ; la fonction du dernier l\'emporte si différente).',
    ),
})
```

Côté `valeurAvancement.ts` :

```ts
valeurDeriveeApiModelSchema = z.object({
  indicateur: indicateurPublicIdSchema,
  individu: individuPublicIdSchema,
  fonctionAgregation: fonctionAgregationSchema, // ← renommé depuis `agregateur`
  valeurDerivee: z.number().nullable(),
  contributions: z.array(contributionApiModelSchema),
  couverture: couvertureApiModelSchema,
})
```

### 3. `upsertIndicateur`

- `resolveReferentielIds` → `resolveReferentielLinks(links: IndicateurReferentielLink[])` : valide l'existence de tous les `referentielId` publics, retourne `Array<{ referentielId: <uuid>, fonctionAgregation }>`.
- Déduplication sur `referentielId` : si même `referentielId` apparaît deux fois avec des fonctions différentes, on garde la dernière occurrence (documentée).
- `replaceReferentielLinks` réécrit la logique de diff pour gérer trois groupes :
  - **toRemove** : liens en DB absents du body.
  - **toAdd** : liens du body absents en DB.
  - **toUpdate** : même `referentielId` mais `fonctionAgregation` différente → `update` ciblé via `prisma.indicateurReferentiel.update({ where: { indicateurId_referentielId: ... }, data: { fonctionAgregation } })`.

L'utilitaire générique `diff` actuel (compare des strings) ne convient plus ; on écrit la comparaison à plat dans `replaceReferentielLinks` (pas d'abstraction prématurée).

### 4. `getValeurDerivee` / `buildResult`

Nouveau flux :

```ts
const buildResult = async (
  indicateurPublicId: string,
  individuPublicId: string,
): Promise<Result<ValeurDeriveeApiModel, ValidationError>> => {
  const principalId = requireCurrentPrincipalId()

  const indicateur = await db().indicateur.findFirstOrThrow({
    where: withIndicateurReadPermission({ publicId: indicateurPublicId }, principalId),
  })

  const cible = await db().individu.findUniqueOrThrow({
    where: { publicId: individuPublicId },
  })

  const lien = await db().indicateurReferentiel.findUnique({
    where: {
      indicateurId_referentielId: {
        indicateurId: indicateur.id,
        referentielId: cible.referentielId,
      },
    },
  })

  if (!lien) {
    return err(new ValidationError(
      "L'indicateur n'est pas configuré pour le référentiel de cet individu",
    ))
  }

  if (lien.fonctionAgregation === 'NONE') {
    return err(new ValidationError(
      "Cet indicateur n'est pas dérivable pour ce référentiel (fonction d'agrégation NONE)",
    ))
  }

  // ... reste du calcul SUM inchangé
  return ok({ ..., fonctionAgregation: lien.fonctionAgregation, ... })
}
```

Signature de `getValeurDerivee` : `ResultAsync<ValeurDeriveeApiModel, never>` → `ResultAsync<ValeurDeriveeApiModel, ValidationError>`. La route `GET /indicateurs/{id}/individus/{individuId}/valeur-derivee` (ou équivalent) cesse de passer `never` au `match` côté erreur et renvoie un 400 explicite.

`resolveValeurDerivee` n'est pas modifié pour l'instant.

### 5. Seed

Répartition proposée dans `indicateurReferentielsSeed` (8 liaisons existantes) :

| Indicateur | Référentiel | Fonction |
| --- | --- | --- |
| IND-001 (Taux de chômage) | REF-DEPT | NONE *(taux → non sommable)* |
| IND-001 (Taux de chômage) | REF-NAT | NONE |
| IND-002 (Émissions CO2) | REF-DEPT | SUM |
| IND-002 (Émissions CO2) | REF-REG | SUM |
| IND-003 (Couverture fibre) | REF-REG | NONE *(taux)* |
| IND-003 (Couverture fibre) | REF-DEPT | NONE |
| IND-004 (Délai préfectures) | REF-DEPT | NONE *(moyenne pondérée requise)* |
| IND-005 (Effectif police) | REF-REG | SUM |
| IND-005 (Effectif police) | REF-NAT | SUM |
| IND-006 (REF-EMPTY) | REF-EMPTY | NONE |
| IND-007 (REF-EMPTY) | REF-EMPTY | NONE |
| IND-008 (REF-EMPTY) | REF-EMPTY | NONE |

Ratio final : 4 `SUM`, 8 `NONE`. Couvre les deux code paths côté tests manuels et e2e.

### 6. Tests back impactés

À vérifier dans `apps/mb-api/src/**/__tests__/` :

- `upsertIndicateur` : tests existants à mettre à jour pour le nouveau body ; ajouter des cas (création/update de fonction, dédup avec fonctions différentes).
- `getValeurDerivee` : ajouter les deux branches 400 (lien absent, fonction `NONE`) ; conserver le cas SUM.
- `getIndicateurByPublicId` / `listIndicateurs` : adapter aux nouveaux champs de sortie (`referentiels` au lieu de `referentielIds`).
- Tests d'intégration utilisant l'OpenAPI (s'il y en a) : régénérer.

Les détails (nombre exact de tests, chemins) seront listés lors de l'écriture du plan d'implémentation.

## Risques & points d'attention

- **Reset DB** : impact dev/CI uniquement. À communiquer dans le titre de la PR.
- **Breaking API** : `referentielIds` → `referentiels` casse tout consommateur du PUT/GET indicateur. Validé : aucun consommateur en prod ou en dev (selon utilisateur).
- **Champ `fonctionAgregation` dans la réponse `getValeurDerivee`** : la valeur renvoyée sera toujours `SUM` (puisque `NONE` part en 400). Conservé pour cohérence et extensibilité future.
- **Edge case** : si à l'avenir on supporte plusieurs fonctions, `resolveValeurDerivee` devra recevoir la fonction en paramètre. Pas anticipé ici (YAGNI), mais le wiring dans `buildResult` rend ça trivial à ajouter.

## Ordre d'implémentation suggéré

1. Schéma Prisma + reset DB + génération client.
2. Schémas Zod partagés (`mb-shared`).
3. `upsertIndicateur` + tests.
4. `getValeurDerivee` + tests.
5. Adaptation des autres queries (`getIndicateurByPublicId`, `listIndicateurs`) pour exposer la nouvelle forme.
6. Seed mis à jour.
7. Lint + vérification globale.
