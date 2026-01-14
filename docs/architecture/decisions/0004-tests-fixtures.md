# 4. Fixtures pour les tests d'intégration

Date : 2026-01-14

## Statut

Accepté

## Contexte

L'écriture de tests d'intégration avec une configuration manuelle des données entraînait plusieurs problèmes :

**Boilerplate excessif :**
```typescript
// Ancien pattern : configuration verbose
await prisma.utilisateur.create({
  data: {
    id: randomUUID(),
    email: "test@example.com",
    nom: "Test",
    prenom: "User",
    date_creation: new Date(),
    profilCode: "DITP_ADMIN",
  },
});
await prisma.referentiel_rattachement_groupe.create({
  data: { code: "GRP-001", libelle: "Groupe test" },
});
await prisma.referentiel_rattachement.create({
  data: {
    code: "RATT-001",
    groupe: "GRP-001",
    libelle: "Rattachement test",
    // ... autres propriétés obligatoires
  },
});
await prisma.fiche_evaluation.create({
  data: {
    id: randomUUID(),
    rattachement_code: "RATT-001",
    etape_courante: "AUTO_EVALUATION",
    // ... autres propriétés
  },
});
// Et ainsi de suite pour toute la chaîne de dépendances...
```

**Problèmes identifiés :**
- **Charge cognitive élevée** : le développeur doit connaître tout le modèle de données et ses relations
- **Tests illisibles** : les préconditions du test sont noyées dans le bruit de la configuration
- **Code répétitif** : chaque test recrée les mêmes entités avec les mêmes valeurs par défaut
- **Fragilité** : toute modification du schéma nécessite de mettre à jour de nombreux tests
- **Difficulté pour les agents IA** : même les assistants IA peinent à générer correctement les configurations complexes

Cette approche rend l'écriture de tests pénible et décourage la création de tests complets.

## Décision

Nous utilisons un pattern de **fixtures** pour simplifier la création de données de test.

**Principe** :
- Chaque fixture fournit des valeurs par défaut sensées pour toutes les propriétés non essentielles
- Seules les propriétés pertinentes pour le test (préconditions) doivent être spécifiées
- Les fixtures gèrent automatiquement la création des entités liées (clés étrangères)

**Implémentation** :
Les fixtures sont définies dans `src/server/infrastructure/test/fixtures.ts` comme un objet avec des méthodes asynchrones :

```typescript
export const fixtures = {
  async utilisateur(
    overrides: Partial<Prisma.utilisateurUncheckedCreateInput> = {},
  ) {
    const prisma = getPrisma(); // Utilise le contexte transactionnel
    return prisma.utilisateur.create({
      data: {
        id: randomUUID(),
        email: `user-${randomUUID().slice(0, 8)}@example.com`,
        nom: "Test",
        prenom: "User",
        date_creation: new Date(),
        profilCode: "DITP_ADMIN",
        ...overrides, // Les overrides ont priorité
      },
    });
  },

  async etapeEvaluation(
    overrides: Partial<Prisma.etape_evaluationUncheckedCreateInput> & {
      fiche?: Partial<Prisma.fiche_evaluationUncheckedCreateInput>;
    } = {},
  ) {
    const { fiche, ...rest } = overrides;

    // Auto-création de la fiche si non fournie
    const fiche_evaluation_id =
      rest.fiche_evaluation_id ?? (await fixtures.fiche(fiche ?? {})).id;

    const prisma = getPrisma();
    return prisma.etape_evaluation.create({
      data: {
        id: randomUUID(),
        fiche_evaluation_id,
        type: "AUTO_EVALUATION",
        updated_at: new Date(),
        ...rest,
      },
    });
  },
};
```

**Deux patterns de composition :**

1. **Auto-création des dépendances** : la fixture crée automatiquement les entités liées si elles ne sont pas fournies
   ```typescript
   // Crée automatiquement fiche + rattachement + groupe
   const etape = await fixtures.etapeEvaluation({ type: "CONSOLIDATION" });
   ```

2. **Clés étrangères explicites** : pour les contraintes métier importantes, certains IDs doivent être fournis explicitement
   ```typescript
   async evaluationObjectif(
     overrides: Partial<Prisma.evaluation_objectifUncheckedCreateInput> & {
       etape_evaluation_id: string; // REQUIS (contrainte métier)
       auteur_id: string;            // REQUIS (contrainte métier)
     },
   )
   ```

**Surcharges imbriquées :**
Les fixtures supportent les surcharges d'entités imbriquées :
```typescript
const etape = await fixtures.etapeEvaluation({
  type: "AUTO_EVALUATION",
  fiche: { etape_courante: "CONSOLIDATION" }, // Contrôle l'entité imbriquée
});
```

**Exemple de test avec fixtures** :
```typescript
it(
  "doit créer de nouvelles évaluations de critères",
  createIntegrationTest(async (tx) => {
    // Given - configuration minimale, focus sur les préconditions
    const utilisateur = await fixtures.utilisateur();
    const critere = await fixtures.critere();
    const etape = await fixtures.etapeEvaluation({
      type: "AUTO_EVALUATION", // Seule propriété pertinente pour le test
    });

    const evaluationCritereId = randomUUID();

    // When
    await handler.execute(
      {
        ficheEvaluationId: etape.fiche_evaluation_id,
        evaluationsCriteres: [
          {
            id: evaluationCritereId,
            critereId: critere.id,
            note: 3,
            commentaire: "Acceptable",
            annexe: "une annexe",
          },
        ],
      },
      utilisateur.id,
    );

    // Then
    const evaluationCritere = await tx.evaluation_critere.findUnique({
      where: { id: evaluationCritereId },
    });
    expect(evaluationCritere).toMatchObject({
      id: evaluationCritereId,
      note: 3,
      commentaire: "Acceptable",
    });
  }),
);
```

**Exemple de référence** : `src/server/evaluation/__tests__/handlers/EnregistrerBrouillonAutoEvaluationCriteresHandler.integration.test.ts`

## Conséquences

**Avantages :**
- **Réduction drastique du boilerplate** : 3 lignes au lieu de 50+ pour une configuration complexe
- **Lisibilité améliorée** : le test se concentre sur la logique métier, pas sur la plomberie des données
- **Charge cognitive minimale** : pas besoin de connaître tout le graphe de dépendances
- **Tests plus faciles à écrire** : pour les humains ET les agents IA (Claude Code, Copilot, etc.)
- **Maintenance simplifiée** : les changements de schéma se répercutent dans les fixtures, pas dans chaque test
- **Données cohérentes** : valeurs par défaut uniformes (emails, UUIDs, dates) sans coordination
- **Composition flexible** : création automatique des dépendances ou contrôle explicite selon les besoins

**Comparaison avant/après :**
```typescript
// AVANT : 20+ lignes de configuration manuelle
await prisma.utilisateur.create({ data: {...} });
await prisma.referentiel_rattachement_groupe.create({ data: {...} });
await prisma.referentiel_rattachement.create({ data: {...} });
await prisma.fiche_evaluation.create({ data: {...} });
await prisma.etape_evaluation.create({ data: {...} });

// APRÈS : 1 ligne, tout est créé automatiquement
const etape = await fixtures.etapeEvaluation({ type: "AUTO_EVALUATION" });
```

**Inconvénients :**
- **Courbe d'apprentissage** : nécessite de comprendre l'API des fixtures et les patterns de composition
- **Complexité cachée** : peut masquer les dépendances, rendant difficile la compréhension du graphe complet
- **Effort initial** : création et maintenance des fixtures demande du temps
- **Debugging** : en cas d'erreur, il faut comprendre ce que les fixtures créent automatiquement

**Impact sur l'équipe :**
- Les tests deviennent plus accessibles aux nouveaux développeurs
- Les agents IA peuvent générer des tests de meilleure qualité avec moins d'effort
- L'effort de maintenance est transféré des tests individuels vers les fixtures partagées
