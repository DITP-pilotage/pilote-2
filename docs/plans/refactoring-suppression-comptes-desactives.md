# Refactoring `SupprimerLesComptesDesactivesUseCase` + migration vers route API

## Contexte général

Ce use case est déclenché hebdomadairement par un cron. Il supprime définitivement les comptes désactivés depuis plus de 2 ans, après avoir anonymisé toutes leurs contributions dans les tables métier. C'est une opération irréversible sur des données de production : une anonymisation manquante laisse une FK morte en base ou une donnée personnelle non purgée (non-conformité RGPD).

Le refactoring vise trois objectifs :
1. **Corriger des bugs silencieux** : une table avec FK sans cascade (`indicateur_territoire_valeur_evenement`) et quatre adapters qui n'anonymisent pas les deux champs auteur
2. **Rendre le traitement résilient** : un utilisateur en erreur ne bloque plus les autres
3. **Aligner l'exécution** sur le pattern existant (route API cron) plutôt qu'un script standalone

---

## Convention pour les tests d'intégration

Tous les tests d'intégration de ce refactoring doivent suivre le pattern établi dans le module :
- Wrapper `createIntegrationTest` (depuis `@/server/infrastructure/test/createIntegrationTest`) — gère automatiquement le rollback via une transaction
- Fixtures (depuis `@/server/infrastructure/test/fixtures`) — pour la création des données de test
- Assertions via le client transactionnel `tx` passé par `createIntegrationTest`

> ⚠️ Les adapters testés avec `createIntegrationTest` doivent utiliser `getPrisma()` (depuis `@/server/db/PrismaTransaction`) et non `import { prisma } from "@/server/db/prisma"`. `getPrisma()` retourne le client transactionnel si dans un contexte `txStore`, garantissant que les opérations de l'adapter participent à la transaction de test et sont rollbackées. Un adapter qui importe `prisma` directement bypasse la transaction — ses écritures ne sont pas rollbackées et polluent la DB de test.

> ⚠️ Les 4 tests d'intégration existants (`PrismaCommentaireRepository`, `PrismaObjectifRepository`, `PrismaDecisionStrategiqueRepository`, `PrismaSyntheseDesResultatsRepository`) utilisent actuellement l'ancien pattern (raw `prisma`, pas de `createIntegrationTest`). Lors de l'étape 2, ces tests sont à **réécrire entièrement** selon le nouveau pattern, et les adapters correspondants doivent être migrés de `import { prisma }` vers `getPrisma()`.

---

## Étape 1 — Créer le port et l'adapter `IndicateurTerritoireValeurEvenementRepository`

**Contexte** : `indicateur_territoire_valeur_evenement` est la table qui stocke l'historique des valeurs d'avancement saisies. Elle a une FK `id_auteur_modification → utilisateur.id` **sans `onDelete: Cascade`**. Sans anonymisation préalable, la suppression de l'utilisateur lèvera une violation de contrainte FK et bloquera l'ensemble du traitement.

### 1.1 — Créer le port

`src/server/gestion-utilisateur/domain/ports/IndicateurTerritoireValeurEvenementRepository.ts`

```ts
export interface IndicateurTerritoireValeurEvenementRepository {
  anonymiserAuteurs(listeIds: string[], emailAuteurRemplacement: string): Promise<void>;
}
```

### 1.2 — Créer l'adapter Prisma

`src/server/gestion-utilisateur/infrastructure/adapters/PrismaIndicateurTerritoireValeurEvenementRepository.ts`

- Utiliser `getPrisma()` (pas le `prisma` brut) pour participer aux transactions de test
- `findFirst` utilisateur par email pour récupérer l'ID anonyme
- `updateMany` sur `indicateur_territoire_valeur_evenement` where `id_auteur_modification in listeIds`

> ⚠️ Il existe déjà un `PrismaIndicateurTerritoireValeurEvenementRepository` dans le module `indicateur-territoire-valeur-evenement` (`src/server/indicateur-territoire-valeur-evenement/`). Le nouvel adapter est distinct et spécifique au module `gestion-utilisateur`, conformément à l'architecture des autres adapters d'anonymisation. Ne pas réutiliser ni modifier l'existant.

### 1.3 — Créer le test d'intégration

`src/server/gestion-utilisateur/__tests__/infrastructure/adapters/PrismaIndicateurTerritoireValeurEvenementRepository.integration.test.ts`

Pattern : `createIntegrationTest` + `fixtures`.

Setup via fixtures :
- `fixtures.utilisateur()` × 3 : `auteurNonCible`, `auteurASupprimer`, `auteurAnonyme` (email `utilisateur.supprime@modernisation.gouv.fr`)
- `fixtures.chantierIdentite()` + `fixtures.chantierTerritoire({ territoire_code: "NAT-FR", maille: "NAT", code_insee: "FR", zone_id: "FRANCE" })`
- `fixtures.indicateurIdentite({ chantier_id })` + `fixtures.indicateurTerritoire({ territoire_code: "NAT-FR" })`
- `fixtures.indicateurTerritoireValeurEvenement()` × 3 : 1 avec `auteurNonCible`, 2 avec `auteurASupprimer`

Vérification via `tx` : `findMany({ where: { id_auteur_modification: auteurAnonyme.id } })` → `toEqual` avec `expect.objectContaining` sur les 2 IDs attendus.

> ⚠️ `fixtures.indicateurTerritoire` a une FK vers `territoire` (table `territoire`). Utiliser `territoire_code: "NAT-FR"` qui est pré-seedé dans la DB de test — ne pas créer de `territoire` manuellement.

### 1.4 — Enregistrer dans `module.ts`

- Ajouter `indicateurTerritoireValeurEvenementRepository: IndicateurTerritoireValeurEvenementRepository` dans `GestionUtilisateurCradle`
- Ajouter `indicateurTerritoireValeurEvenementRepository: asModuleClass(PrismaIndicateurTerritoireValeurEvenementRepository)` dans `register`

> ⚠️ Le `satisfies VerifyCradle<GestionUtilisateurCradle>` à la fin du `register` est un garde-fou de typage — si la déclaration dans le cradle et l'enregistrement ne sont pas cohérents, le build TypeScript échouera. Vérifier les deux.

---

## Étape 2 — Corriger les 4 adapters qui oublient un champ auteur

**Contexte** : lors de la suppression d'un utilisateur, si seul `auteur_modification_id` est anonymisé mais pas `auteur_creation_id` (ou inversement), des données personnelles subsistent en base. C'est une non-conformité RGPD silencieuse : aucune erreur n'est levée, le traitement semble réussir.

**État actuel :**

| Table | `auteur_creation_id` | `auteur_modification_id` |
|---|---|---|
| `commentaire` | ❌ oublié | ✅ |
| `objectif` | ❌ oublié | ✅ |
| `decision_strategique` | ❌ oublié | ✅ |
| `synthese_des_resultats` | ✅ | ❌ oublié |

Pour chaque adapter :
- Migrer de `import { prisma } from "@/server/db/prisma"` vers `const prisma = getPrisma()` dans le corps de la méthode
- Ajouter le second `updateMany` dans le `if (auteurAnonyme)`, les deux requêtes étant indépendantes et parallélisées avec `Promise.all`

> ⚠️ Les deux champs sont `String?` (nullable) dans le schema Prisma. Prisma exclut nativement les `null` d'un `in: [...]`, donc pas de risque d'écraser des valeurs null avec l'ID anonyme.

Pour chaque test : **réécrire entièrement** selon le pattern `createIntegrationTest` + `fixtures`, en couvrant les deux cas (auteur de création et auteur de modification) dans deux `it` distincts.

### 2.1 — `PrismaCommentaireRepository`

Adapter : migrer vers `getPrisma()` + ajouter `updateMany` sur `auteur_creation_id`.

Tests :
- Réécrire le cas existant avec `createIntegrationTest` + `fixtures.commentaire()` (nécessite `fixtures.chantierIdentite()` + `fixtures.chantierTerritoire()`)
- Ajouter : "doit anonymiser l'auteur de création" — commentaires avec `auteur_creation_id: auteurASupprimer.id`, `auteur_modification_id: null`

### 2.2 — `PrismaObjectifRepository`

Adapter : migrer vers `getPrisma()` + ajouter `updateMany` sur `auteur_creation_id`.

Tests :
- Réécrire le cas existant avec `createIntegrationTest` + `fixtures.objectifChantier()` (FK vers `chantier_identite` uniquement, pas `chantier_territoire`)
- Ajouter : "doit anonymiser l'auteur de création"

### 2.3 — `PrismaDecisionStrategiqueRepository`

Adapter : migrer vers `getPrisma()` + ajouter `updateMany` sur `auteur_creation_id`.

Tests :
- Réécrire le cas existant avec `createIntegrationTest` + `fixtures.decisionStrategique()` (même pattern que `objectif`)
- Ajouter : "doit anonymiser l'auteur de création"

### 2.4 — `PrismaSyntheseDesResultatsRepository`

Adapter : migrer vers `getPrisma()` + ajouter `updateMany` sur `auteur_modification_id`.

Tests :
- Réécrire le cas existant avec `createIntegrationTest` + `fixtures.syntheseDesResultats()` (nécessite `fixtures.chantierIdentite()` + `fixtures.chantierTerritoire()`)
- Ajouter : "doit anonymiser l'auteur de modification" — synthèses avec `auteur_modification_id: auteurASupprimer.id`, `auteur_creation_id: null`

---

## Étape 3 — Refactoring du use case

**Contexte** : le use case traite actuellement tous les utilisateurs en batch (une seule requête `anonymiserAuteurs` pour toute la liste, puis suppression en lot). Si un utilisateur échoue (ex : Keycloak inaccessible pour un email spécifique), l'exception interrompt tout le traitement — les utilisateurs suivants ne sont pas traités. En production, ce use case tourne une fois par semaine : un échec bloquant retarde d'une semaine la suppression de tous les autres comptes.

### 3.1 — Nouveau type de retour

```ts
type ResultatSuppression = {
  supprimes: { id: string; email: string }[];
  erreurs: { id: string; email: string; erreur: string }[];
};

async run(): Promise<ResultatSuppression>
```

### 3.2 — Traitement par utilisateur avec gestion d'erreur

Remplacer le batch global par une boucle `for...of` sur `utilisateursInactifs` avec `try/catch` par utilisateur. Pour chaque utilisateur :
1. `Promise.all` de tous les `anonymiserAuteurs` (indépendants)
2. `utilisateurRepository.supprimerListeUtilisateur([utilisateur.id])`
3. `utilisateurIAMRepository.supprime(utilisateur.email)`

En cas d'erreur : `logger.error` avec l'email, push dans `erreurs`, `continue`.

> ⚠️ L'ordre des opérations dans le `try` est important : les anonymisations doivent précéder la suppression BDD, qui doit précéder la suppression IAM. Inverser cet ordre laisserait des données personnelles orphelines ou un compte IAM actif sans entrée BDD.

> ⚠️ `supprimerListeUtilisateur` prend une liste — l'appeler avec `[utilisateur.id]` (tableau d'un élément) plutôt que de modifier sa signature. Ne pas changer l'interface du repository.

### 3.3 — Injecter `indicateurTerritoireValeurEvenementRepository`

Ajouter à la destructuration du constructor et au type `Inject<>`.

### 3.4 — Retirer `propositionValeurAvancementRepository`

Supprimer de la destructuration, du type `Inject<>`, et de l'appel dans `run()`. La table `proposition_valeur_actuelle` est supprimée par la migration `20260325085557` présente sur cette branche.

> ⚠️ Supprimer aussi l'import du port et de l'adapter dans `module.ts` uniquement si rien d'autre dans le module ne les utilise — vérifier avant de supprimer.

---

## Étape 4 — Mettre à jour les tests du use case

**Contexte** : le test existant vérifie que chaque `anonymiserAuteurs` est appelé avec la liste complète des IDs. Avec le passage au traitement par utilisateur, les appels se font maintenant un par un — les assertions `toHaveBeenCalledWith([id1, id2], ...)` doivent devenir des assertions par utilisateur individuel.

### 4.1 — Adapter le `beforeEach`

- Supprimer mock `propositionValeurAvancementRepository`
- Ajouter mock `indicateurTerritoireValeurEvenementRepository`

### 4.2 — Réécrire le test de succès

- Vérifier le retour avec `toEqual({ supprimes: [...], erreurs: [] })`
- Vérifier les appels `anonymiserAuteurs` avec `[id]` (tableau d'un seul élément) par utilisateur, non plus avec la liste complète
- Ajouter la vérification de `indicateurTerritoireValeurEvenementRepository.anonymiserAuteurs`
- Supprimer la vérification de `propositionValeurAvancementRepository`

### 4.3 — Ajouter un test d'erreur partielle

Scénario : 2 utilisateurs, `utilisateurIAMRepository.supprime` rejette pour le 2ème.

```ts
expect(resultat).toEqual({
  supprimes: [{ id: "...", email: "..." }],
  erreurs: [{ id: "...", email: "...", erreur: "message d'erreur" }],
});
```

> ⚠️ Vérifier dans ce test que les anonymisations du 2ème utilisateur ont bien été appelées : l'erreur survient après les anonymisations, lors de la suppression IAM — les anonymisations sont donc effectuées même pour l'utilisateur en erreur.

---

## Étape 5 — Créer la route API et supprimer le script

**Contexte** : `scripts/suppressionUtilisateursDesactives.ts` est un script Node exécuté via un scheduler externe. Les autres jobs équivalents (`desactivation-comptes`, `rapports-coordinateurs`) sont des routes API protégées par `onlyCron`. Migrer vers ce pattern unifie la gestion des crons, leur monitoring (logs Scalingo, alertes Tchap) et leur sécurisation.

### 5.1 — `src/config.ts`

```ts
roomIdSuppressionComptes: {
  format: String,
  default: "",
  env: "TCHAP_ROOM_ID_SUPPRESSION_COMPTES",
},
```

### 5.2 — Créer `src/pages/api/admin/cron/suppression-comptes.ts`

Sur le modèle exact de `desactivation-comptes.ts` :
- `onlyCron(handler)` + guard `configuration().scalingoEnvironment !== "PROD"`
- `configuration().tchap.roomIdSuppressionComptes`
- Message Tchap succès : nb supprimés, liste emails, section `⚠️ Y erreur(s)` avec les emails en erreur si `erreurs.length > 0`
- `res.status(200).json(resultat)`
- `catch` global → message Tchap erreur critique + `res.status(500)`

> ⚠️ Le script existant récupérait `TCHAP_ROOM_ID` (variable générique). La nouvelle route utilise une variable dédiée `TCHAP_ROOM_ID_SUPPRESSION_COMPTES`. Documenter cette nouvelle variable d'environnement pour l'équipe infra/ops.

### 5.3 — Supprimer `scripts/suppressionUtilisateursDesactives.ts`

> ⚠️ Vérifier que le script n'est référencé nulle part ailleurs : `package.json` (scripts npm), fichiers de configuration cron Scalingo, documentation. Supprimer ou mettre à jour toutes les références.

---

## Récapitulatif des fichiers

| Fichier | Action |
|---|---|
| `gestion-utilisateur/domain/ports/IndicateurTerritoireValeurEvenementRepository.ts` | Créer |
| `gestion-utilisateur/adapters/PrismaIndicateurTerritoireValeurEvenementRepository.ts` | Créer — utilise `getPrisma()` |
| `gestion-utilisateur/__tests__/adapters/PrismaIndicateurTerritoireValeurEvenementRepository.integration.test.ts` | Créer — `createIntegrationTest` + `fixtures` |
| `gestion-utilisateur/adapters/PrismaCommentaireRepository.ts` | Migrer vers `getPrisma()` + ajouter `auteur_creation_id` |
| `gestion-utilisateur/adapters/PrismaObjectifRepository.ts` | Migrer vers `getPrisma()` + ajouter `auteur_creation_id` |
| `gestion-utilisateur/adapters/PrismaDecisionStrategiqueRepository.ts` | Migrer vers `getPrisma()` + ajouter `auteur_creation_id` |
| `gestion-utilisateur/adapters/PrismaSyntheseDesResultatsRepository.ts` | Migrer vers `getPrisma()` + ajouter `auteur_modification_id` |
| `gestion-utilisateur/__tests__/adapters/PrismaCommentaireRepository.integration.test.ts` | Réécrire + ajouter cas création |
| `gestion-utilisateur/__tests__/adapters/PrismaObjectifRepository.integration.test.ts` | Réécrire + ajouter cas création |
| `gestion-utilisateur/__tests__/adapters/PrismaDecisionStrategiqueRepository.integration.test.ts` | Réécrire + ajouter cas création |
| `gestion-utilisateur/__tests__/adapters/PrismaSyntheseDesResultatsRepository.integration.test.ts` | Réécrire + ajouter cas modification |
| `gestion-utilisateur/module.ts` | Ajouter + retirer dépendances |
| `gestion-utilisateur/usecases/SupprimerLesComptesDesactivesUseCase.ts` | Refactoring principal |
| `gestion-utilisateur/__tests__/usecases/SupprimerLesComptesDesactivesUseCase.unit.test.ts` | Réécrire + ajouter cas erreur |
| `pages/api/admin/cron/suppression-comptes.ts` | Créer |
| `src/config.ts` | Ajouter clé Tchap |
| `scripts/suppressionUtilisateursDesactives.ts` | Supprimer |
