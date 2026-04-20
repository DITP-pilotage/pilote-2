# 3. Tests d'intégration

Date : 2026-01-14

## Statut

Accepté

## Contexte

Les tests d'intégration initiaux de la codebase écrivaient directement dans la base de données sans isolation entre les tests. Cela entraînait plusieurs problèmes :

- **Impossibilité d'exécuter les tests en parallèle** : tous les tests partageaient le même état de base de données, créant des conflits et des résultats imprévisibles
- **Nécessité d'exécuter les tests séquentiellement** (avec `--runInBand`) : ralentissement significatif de la suite de tests
- **Logique de nettoyage complexe** : chaque test devait nettoyer manuellement les données avant et/ou après son exécution
- **Risques de pollution entre tests** : un test mal nettoyé pouvait affecter les résultats des tests suivants
- **Tests fragiles** : échec du nettoyage pouvait entraîner des échecs en cascade

Cette approche rendait les tests lents, fragiles et difficiles à maintenir.

## Décision

Nous utilisons un pattern basé sur les transactions avec rollback automatique pour isoler chaque test d'intégration.

**Principe** :
- Chaque test s'exécute dans une transaction Prisma
- La transaction est automatiquement annulée (rollback) à la fin du test
- Aucune donnée de test n'est persistée en base de données

**Implémentation** :
1. Utiliser le helper `createIntegrationTest` pour envelopper chaque test
2. Le helper utilise `AsyncLocalStorage` de Node.js pour propager le contexte transactionnel
3. Toutes les requêtes Prisma dans le test utilisent automatiquement la transaction
4. À la fin du test, un symbole `ROLLBACK` force l'annulation de la transaction

**Pattern de test** :
```typescript
describe("MonHandler", () => {
  let handler: MonHandler;

  beforeEach(() => {
    handler = new MonHandler({
      ...deps
    });
  });

  it(
    "doit créer une nouvelle ressource",
    createIntegrationTest(async (tx) => {
      // Given
      const utilisateur = { ... }

      // When
      await handler.execute({...}, utilisateur.id);

      // Then
      const result = await tx.resource.findUnique({...});
      expect(result).toMatchObject({...});
    }),
  );
});
```

**Exemple de référence** : `src/server/evaluation/__tests__/handlers/EnregistrerBrouillonAutoEvaluationCriteresHandler.integration.test.ts`

## Conséquences

**Avantages :**
- **Exécution parallèle** : les tests peuvent s'exécuter en parallèle sans interférences
- **Pas de nettoyage manuel** : plus besoin de logique `beforeEach`/`afterEach` pour nettoyer la base
- **Isolation complète** : chaque test est totalement isolé des autres
- **Tests plus rapides** : exécution parallèle et absence de cleanup réduisent le temps d'exécution
- **Tests plus fiables** : élimination des échecs liés à un mauvais nettoyage
- **Code de test plus lisible** : focus sur la logique métier plutôt que sur la gestion de l'état

**Inconvénients :**
- **Courbe d'apprentissage** : nécessite de comprendre le pattern et `AsyncLocalStorage`
- **Migration progressive** : les anciens tests doivent être migrés vers ce pattern
- **Debugging** : les transactions rollback peuvent compliquer l'inspection de l'état de la base pendant le debug

**Migration** :
Les anciens modules utilisent encore l'ancien pattern. Ils devront être migrés progressivement vers ce nouveau pattern.
