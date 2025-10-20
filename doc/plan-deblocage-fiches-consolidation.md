# Plan d'implémentation - Déblocage des fiches de consolidation

## Vue d'ensemble

Cette fonctionnalité permet de gérer le mode lecture seule des fiches de consolidation via l'écran pilotage. Les fiches en mode lecture seule ne pourront pas être modifiées jusqu'à ce qu'elles soient débloquées par l'interface de pilotage.

## Étape 1 : Refonte de l'affichage du tableau de consolidation

**Objectif** : Réorganiser l'affichage des 3 colonnes actuelles en 3 lignes

### État actuel
- Colonne 1 : Type + Libellé + Commentaire auto-évalué + Commentaire consolidation
- Colonne 2 : Note auto-évaluation (lecture seule)
- Colonne 3 : Note consolidation (éditable)

### État cible
- Ligne 1 (1 colonne) : Type + Libellé
- Ligne 2 (2 colonnes) : Commentaire consolidation + Note consolidation
- Ligne 3 (2 colonnes) : Commentaire auto-évalué + note auto-évalué

### Fichiers concernés
- `src/client/components/PageConsolidation/useTableauConsolidation.tsx:113-194`
- `src/client/components/PageConsolidation/FormulaireConsolidation.tsx`

### Actions
1. Modifier la structure des cellules dans `useTableauConsolidation.tsx`
2. Réorganiser le layout pour passer à un affichage vertical
3. Ajuster les styles CSS pour le nouvel affichage

---

## Étape 2 : Ajout de l'application PILOTE_EVAL_PILOTAGE et de l'attribut read_only

**Objectif** : Ajouter l'application PILOTE_EVAL_PILOTAGE et le champ read_only dans une seule migration

### Base de données - Migration unique
**Fichiers concernés** : `src/database/prisma/schema.prisma`

**Actions** :
1. Modifier le schema Prisma :
   - Ajouter `PILOTE_EVAL_PILOTAGE` dans l'enum `application_accessible` (ligne 734-739)
   - Ajouter `read_only Boolean @default(false)` dans le modèle `etape_evaluation` (ligne 817)
2. Générer la migration Prisma : `npm run database:migration`
3. Nommer la migration de manière descriptive : `add_pilote_eval_pilotage_and_read_only`
4. Exécuter la migration

### Frontend - Ajout de l'option dans le sélecteur
**Fichier** : `src/client/components/PageUtilisateurFormulaire/UtilisateurFormulaire/SaisieDesInformationsUtilisateur/SelecteurApplication.tsx:6-17`

Ajouter la nouvelle application dans le tableau `applications` :
```typescript
{
  id: "pilote-eval-pilotage",
  label: "Pilote eval pilotage", 
  value: $Enums.application_accessible.PILOTE_EVAL_PILOTAGE as const,
}
```

### Query - AfficherConsolidationQuery
**Fichier** : `src/server/evaluation/queries/AfficherConsolidationQuery.ts:9`

1. **D'abord** : Modifier les tests unitaires pour inclure le nouveau champ `read_only`
2. **Ensuite** : Lancer les tests pour vérifier qu'ils échouent (validation TDD)
3. **Puis** : Modifier l'implémentation de la query pour retourner le champ `read_only`
4. **Enfin** : Vérifier que les tests passent

### Interface utilisateur
**Fichier** : `src/client/components/PageConsolidation/FormulaireConsolidation.tsx:38-43`

- Ajouter la prop readOnly au contexte ou aux props du composant
- Masquer le bouton "Enregistrer le brouillon" quand `readOnly === true`

### Fichiers concernés
- `src/database/prisma/schema.prisma`
- `src/server/evaluation/queries/AfficherConsolidationQuery.ts`
- Tests associés à `AfficherConsolidationQuery`
- `src/client/components/PageConsolidation/FormulaireConsolidation.tsx`
- `src/client/components/PageConsolidation/PageConsolidationServerSideContext.tsx` (contexte)

---

## Étape 3 : Passage en lecture seule des champs de consolidation

**Objectif** : Rendre les commentaires et notes de consolidation en lecture seule quand `readOnly === true`

### Design de référence
Réutiliser le design des champs auto-évaluation :
- Commentaire : `src/client/components/PageConsolidation/useTableauConsolidation.tsx:142-144`
- Note : `src/client/components/PageConsolidation/useTableauConsolidation.tsx:166-169`

### Actions
1. Modifier `CommentaireTextareaConsolidation` pour accepter une prop `disabled`
2. Modifier `InputNoteConsolidation` pour accepter une prop `disabled`
3. Passer la prop `disabled` basée sur la valeur de `readOnly`
4. Styliser les champs en lecture seule de manière similaire aux champs auto-évaluation

### Fichiers concernés
- `src/client/components/PageConsolidation/CommentaireTextareaConsolidation.tsx`
- `src/client/components/PageConsolidation/InputNoteConsolidation.tsx`
- `src/client/components/PageConsolidation/useTableauConsolidation.tsx`

### Note
Un refactoring de qualité pourra être effectué après cette étape pour améliorer la réutilisabilité du code.

---

## Étape 4 : Affichage du statut readOnly dans le tableau de pilotage

**Objectif** : Afficher une icône indiquant le statut readOnly dans le tableau de pilotage

### Query - AfficherPilotageQuery
**Fichier** : `src/server/evaluation/queries/AfficherPilotageQuery.ts:4`

1. Récupérer l'attribut `read_only` des fiches dans la query
2. Retourner ce champ dans les données de chaque fiche

### Tableau de pilotage
**Fichier** : `src/client/components/PagePilotage/useTableauPilotage.tsx:105-106`

1. Ajouter une nouvelle colonne avant la colonne "Étape"
2. Afficher une icône indiquant le statut de verrouillage
   - Icône temporaire 1 : pour `readOnly === true` (verrouillé)
   - Icône temporaire 2 : pour `readOnly === false` (déverrouillé)
3. Les icônes finales seront choisies ultérieurement

### Fichiers concernés
- `src/server/evaluation/queries/AfficherPilotageQuery.ts`
- `src/client/components/PagePilotage/useTableauPilotage.tsx`

---

## Étape 5 : Action de déblocage des fiches

**Objectif** : Permettre le déblocage des fiches sélectionnées depuis l'écran pilotage

### Backend - Handler

**Fichier de référence** : `src/server/evaluation/handlers/EnregistrerBrouillonConsolidationHandler.ts:9`

Créer un nouveau handler : `DebloquerFichesConsolidationHandler`

1. **D'abord** : Créer les tests unitaires pour le handler
   - Tester le déblocage d'une fiche
   - Tester le déblocage de plusieurs fiches
   - Tester les cas d'erreur
2. **Ensuite** : Lancer les tests (ils doivent échouer)
3. **Puis** : Implémenter le handler
   - Prendre en entrée une liste de `ficheEvaluationIds`
   - Pour chaque fiche, mettre à jour `read_only` à `false` dans l'étape de consolidation
4. **Enfin** : Vérifier que les tests passent

### Container
**Fichier** : `src/server/evaluation/container.ts:23`

1. Enregistrer le nouveau handler dans le container Awilix
2. Ajouter le type dans `PiloteEvalDependencies`

### Route tRPC

Créer une nouvelle route tRPC pour exposer le handler

1. Définir le schéma Zod pour valider l'entrée (liste de ficheEvaluationIds)
2. Créer la route dans le router d'évaluation
3. Appeler le handler depuis la route

### Frontend - Bouton de déblocage
**Fichier** : `src/client/components/PagePilotage/MenuActionTableauPilotage.tsx:37-41`

1. Récupérer les `fichesSelectionneesIds` depuis `src/client/components/PagePilotage/TableauPilotage.tsx:8`
2. Créer un hook custom `useDebloquerFiches` qui appelle la route tRPC
3. Connecter le bouton "Retour en consolidation" à cette action
4. Gérer l'état de chargement pendant l'appel

### Fichiers concernés
- `src/server/evaluation/handlers/DebloquerFichesConsolidationHandler.ts` (nouveau)
- Tests pour `DebloquerFichesConsolidationHandler` (nouveau)
- `src/server/evaluation/container.ts`
- `src/server/infrastructure/api/trpc/routers/evaluationRouter.ts`
- `src/client/components/PagePilotage/MenuActionTableauPilotage.tsx`
- `src/client/components/PagePilotage/useDebloquerFiches.ts` (nouveau)

---

## Étape 6 : Notification de succès

**Objectif** : Afficher un toast de confirmation après déblocage réussi

### Implémentation
**Fichier de référence** : `src/client/components/PageEvaluation/useEnregistrerBrouillon.ts:40-43`

Dans le hook `useDebloquerFiches` créé à l'étape 5 :

1. Ajouter un callback `onSuccess` à la mutation tRPC
2. Afficher un toast avec le message : "Les fiches ont correctement été débloquées"
3. Utiliser les options suivantes :
   - `position: "top-right"`
   - `richColors: true`
4. Rafraîchir les données du tableau après le succès

### Fichiers concernés
- `src/client/components/PagePilotage/useDebloquerFiches.ts`

---

## Notes importantes

### Approche TDD
Pour les étapes 2 et 5, il est crucial de suivre l'approche Test-Driven Development :
1. Écrire les tests en premier
2. Lancer les tests (vérifier qu'ils échouent)
3. Implémenter le code
4. Vérifier que les tests passent

### Points de vigilance
- S'assurer que les migrations Prisma sont réversibles
- Maintenir la cohérence des types TypeScript entre backend et frontend
- Tester les cas limites (aucune fiche sélectionnée, fiches déjà débloquées, etc.)
- Gérer les erreurs réseau et afficher des messages appropriés
- Vérifier que le rafraîchissement des données fonctionne correctement après déblocage

### Refactoring potentiel
Après l'étape 3, un refactoring pourrait améliorer :
- La réutilisabilité des composants d'affichage de commentaire
- La réutilisabilité des composants d'affichage de note
- La gestion centralisée du mode lecture seule

### Technologies utilisées
- **Base de données** : Prisma + PostgreSQL
- **Backend** : tRPC, Awilix (DI)
- **Frontend** : React, React Hook Form, Zod, TanStack Table
- **Notifications** : Sonner (toast)
- **Tests** : Jest
