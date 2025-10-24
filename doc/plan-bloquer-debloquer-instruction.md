# Plan : Modification de l'état des fiches d'instruction depuis la page pilotage

Ce plan détaille l'implémentation de la fonctionnalité permettant de bloquer et débloquer la phase d'instruction pour un ou plusieurs rattachements depuis la page pilotage.

## Inspiration

Nous nous inspirons de la fonctionnalité existante pour débloquer la consolidation :

- Handler : `src/server/evaluation/handlers/DebloquerFichesConsolidationHandler.ts`
- Tests : `src/server/evaluation/__tests__/handlers/DebloquerFichesConsolidationHandler.integration.test.ts`
- Bouton : `src/client/components/PagePilotage/BoutonDebloquerLaConsolidation.tsx`

## Différence principale

Contrairement au déblocage de consolidation qui ne gère que le passage à `read_only = false`, nous devons gérer **deux actions** :

- **Bloquer** : `read_only = true`
- **Débloquer** : `read_only = false`

## Étape 1 : Backend

### 1.1 - Créer les tests du handler

**Fichier à créer** : `src/server/evaluation/__tests__/handlers/ModifierEtatFichesInstructionHandler.integration.test.ts`

Tests à implémenter :

1. `doit débloquer plusieurs fiches instruction en une seule opération`
   - Créer 5 fiches avec des étapes INSTRUCTION dont certaines sont en `read_only: true`
   - Appeler le handler avec `readOnly: false`
   - Vérifier que seules les fiches spécifiées et en étape INSTRUCTION sont débloquées

2. `doit bloquer plusieurs fiches instruction en une seule opération`
   - Créer 5 fiches avec des étapes INSTRUCTION dont certaines sont en `read_only: false`
   - Appeler le handler avec `readOnly: true`
   - Vérifier que seules les fiches spécifiées et en étape INSTRUCTION sont bloquées

3. `ne doit modifier que l'étape INSTRUCTION et pas les autres étapes`
   - Créer une fiche avec plusieurs étapes (AUTO_EVALUATION, CONSOLIDATION, INSTRUCTION)
   - Appeler le handler pour bloquer/débloquer
   - Vérifier que seule l'étape INSTRUCTION est modifiée

4. `ne doit rien faire si la liste de fiches est vide`
   - Appeler le handler avec un tableau vide
   - Vérifier qu'aucune modification n'est effectuée

**Important** : Ne pas lancer les tests immédiatement. Ils doivent être rouges au début.

### 1.2 - Implémenter le handler

**Fichier à créer** : `src/server/evaluation/handlers/ModifierEtatFichesInstructionHandler.ts`

Structure :

```typescript
export const modifierEtatFichesInstructionCommandSchema = z.object({
  ficheEvaluationIds: z.array(z.string()),
  readOnly: z.boolean(),
});

export class ModifierEtatFichesInstructionHandler {
  constructor(dependencies: {
    transaction: Transaction;
    prisma: PrismaPilote;
  }) {}

  async execute(command: ModifierEtatFichesInstructionCommand): Promise<void> {
    // Si aucune fiche, ne rien faire
    // Dans une transaction :
    //   - Mettre à jour read_only pour les etape_evaluation
    //   - WHERE fiche_evaluation_id IN (...)
    //   - AND type = INSTRUCTION
  }
}
```

### 1.3 - Ajouter le handler au conteneur Awilix

**Fichier à modifier** : `src/server/evaluation/container.ts`

- Importer `ModifierEtatFichesInstructionHandler`
- Ajouter `modifierEtatFichesInstructionHandler` au type `PiloteEvalDependencies`
- Enregistrer avec `asClass(ModifierEtatFichesInstructionHandler)`

### 1.4 - Créer la route tRPC

**Fichier à modifier** : `src/server/infrastructure/api/trpc/routes/evaluation.ts`

Ajouter une mutation `modifierEtatFichesInstruction` :

- Input : `modifierEtatFichesInstructionCommandSchema`
- Vérifier les permissions avec `peutAccederEtapePilotage`
- Appeler le handler via le conteneur

## Étape 2 : Frontend

### 2.1 - Créer les composants de boutons

**Fichiers à créer** :

- `src/client/components/PagePilotage/BoutonBloquerInstruction.tsx`
- `src/client/components/PagePilotage/BoutonDebloquerInstruction.tsx`

Inspirés de `BoutonDebloquerLaConsolidation.tsx` :

- Accepter `disabled` et `fichesSelectionneesIds` en props
- Utiliser le hook `useModifierEtatFichesInstruction` (à créer en même temps)
- Pour l'instant, le hook renvoie juste un console.log (implémentation ultérieure)

**Hook à créer (temporaire)** : `src/client/components/PagePilotage/useModifierEtatFichesInstruction.ts`

```typescript
export const useModifierEtatFichesInstruction = () => {
  return {
    bloquer: (ficheEvaluationIds: string[]) => {
      console.log("Bloquer fiches instruction:", ficheEvaluationIds);
      return Promise.resolve();
    },
    debloquer: (ficheEvaluationIds: string[]) => {
      console.log("Débloquer fiches instruction:", ficheEvaluationIds);
      return Promise.resolve();
    },
  };
};
```

### 2.2 - Intégrer les boutons dans le menu d'actions

**Fichier à modifier** : `src/client/components/PagePilotage/MenuActionTableauPilotage.tsx`

Modifications :

1. Importer et ajouter les deux nouveaux boutons
2. Ajouter une condition pour vérifier si toutes les fiches sélectionnées sont en étape INSTRUCTION
3. Les boutons sont `disabled` si au moins une fiche sélectionnée n'est pas en étape INSTRUCTION

```typescript
const peutModifierLInstructionViaPilotage = toutesFichesEnEtape(
  $Enums.etape_evaluation_enum.INSTRUCTION,
);

<BoutonBloquerInstruction
  disabled={!peutModifierLInstructionViaPilotage}
  fichesSelectionneesIds={fichesSelectionneesIds}
/>
<BoutonDebloquerInstruction
  disabled={!peutModifierLInstructionViaPilotage}
  fichesSelectionneesIds={fichesSelectionneesIds}
/>
```

### 2.3 - Mettre en place l'appel au backend

**Fichier à modifier** : `src/client/components/PagePilotage/useModifierEtatFichesInstruction.ts`

Implémenter le hook pour qu'il appelle réellement la route tRPC :

```typescript
export const useModifierEtatFichesInstruction = () => {
  const mutation = api.evaluation.modifierEtatFichesInstruction.useMutation();

  return {
    bloquer: (ficheEvaluationIds: string[]) =>
      mutation.mutateAsync(
        { ficheEvaluationIds, readOnly: true },
        {
          onSuccess: () => {
            toast.success("Fiches bloquées avec succès");
            window.location.reload();
          },
        },
      ),
    debloquer: (ficheEvaluationIds: string[]) =>
      mutation.mutateAsync(
        { ficheEvaluationIds, readOnly: false },
        {
          onSuccess: () => {
            toast.success("Fiches débloquées avec succès");
            window.location.reload();
          },
        },
      ),
  };
};
```

## Résumé des fichiers

### Fichiers à créer (5)

1. `src/server/evaluation/__tests__/handlers/ModifierEtatFichesInstructionHandler.integration.test.ts` ✅
2. `src/server/evaluation/handlers/ModifierEtatFichesInstructionHandler.ts` ✅
3. `src/client/components/PagePilotage/BoutonBloquerInstruction.tsx`
4. `src/client/components/PagePilotage/BoutonDebloquerInstruction.tsx`
5. `src/client/components/PagePilotage/useModifierEtatFichesInstruction.ts`

### Fichiers à modifier (3)

1. `src/server/evaluation/container.ts`
2. `src/server/infrastructure/api/trpc/routes/evaluation.ts`
3. `src/client/components/PagePilotage/MenuActionTableauPilotage.tsx`
