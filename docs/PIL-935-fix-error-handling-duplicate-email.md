# PIL-935 - Fix: Gestion d'erreur pour email déjà existant

## Problème

Lors de la création d'un compte utilisateur avec une adresse email déjà existante :
- **En local (development)** : Message d'erreur correct affiché : `"Un compte a déjà été créé avec cette adresse électronique."`
- **En production** : Message générique affiché : `"Une erreur est survenue"`

## Cause racine

Le problème se situe dans l'`errorFormatter` de tRPC (`src/server/infrastructure/api/trpc/trpc.ts:31-58`).

### Comportement défaillant

```typescript
const isInternalServerError =
  !(error.cause instanceof NonAutorisé) &&
  !(error.cause instanceof PiloteError);
```

Le check `instanceof PiloteError` **échoue en production** pour les raisons suivantes :

1. **Minification/Bundling** : Le code est transformé différemment en production par le build Next.js
2. **Instances multiples** : Les classes peuvent provenir de différentes copies du module après bundling
3. **Prototype chain** : La chaîne de prototypes peut être altérée lors de la minification

### Conséquence

Quand `instanceof PiloteError` retourne `false` alors que c'est bien une `PiloteError` :
- `isInternalServerError` devient `true`
- Le message d'erreur est remplacé par le message générique `"Une erreur est survenue"`
- L'utilisateur ne reçoit pas le message précis de `ConflictError`: `"Un compte a déjà été créé avec cette adresse électronique."`

## Solution implémentée

Remplacement du check `instanceof` par une **détection structurelle** plus robuste qui fonctionne même après minification.

### Code ajouté

```typescript
// Helper functions pour détecter les types d'erreurs de manière robuste
const isPiloteError = (error: unknown): error is PiloteError => {
  return (
    error instanceof PiloteError ||
    (typeof error === 'object' &&
      error !== null &&
      'status' in error &&
      'type' in error &&
      typeof (error as Record<string, unknown>).status === 'number' &&
      typeof (error as Record<string, unknown>).type === 'string')
  );
};

const isNonAutorisé = (error: unknown): error is NonAutorisé => {
  return (
    error instanceof NonAutorisé ||
    (error instanceof Error && error.constructor.name === 'NonAutorisé')
  );
};
```

### Principe

La fonction `isPiloteError` effectue deux vérifications :
1. **Check instanceof** (fonctionne en local)
2. **Duck typing** : vérifie la structure de l'objet (propriétés `status` et `type` de type correct)

Cette approche **dual check** garantit :
- Compatibilité avec le comportement local (instanceof fonctionne)
- Résilience en production (duck typing prend le relais si instanceof échoue)

## Fichier modifié

- `src/server/infrastructure/api/trpc/trpc.ts`

## Test de validation

Pour valider le fix :
1. Créer un utilisateur avec un email (ex: `test@example.com`)
2. Tenter de créer un second utilisateur avec le même email
3. Vérifier que le message d'erreur affiché est bien : `"Un compte a déjà été créé avec cette adresse électronique."`

Ceci doit fonctionner identiquement en local et en production.

## Notes techniques

### Classe ConflictError

```typescript
// src/server/app/error-boundary/conflict-error.ts
export class ConflictError extends PiloteError {
  constructor(message: string) {
    super({ message, code: 409, type: "ConflictError" });
  }
}
```

La `ConflictError` hérite de `PiloteError` avec :
- `status`: 409 (Conflict)
- `type`: "ConflictError"
- `message`: Message personnalisé

### Use Case concerné

```typescript
// src/server/gestion-utilisateur/usecases/CréerOuMettreÀJourUnUtilisateurUseCase.ts:507
if (!utilisateurExistant && utilisateurExiste) {
  throw new ConflictError(
    "Un compte a déjà été créé avec cette adresse électronique.",
  );
}
```

## Références

- Issue: PIL-935
- Fichier principal modifié: `src/server/infrastructure/api/trpc/trpc.ts`
- Related: Pattern CQRS, Domain-driven design, Error handling
