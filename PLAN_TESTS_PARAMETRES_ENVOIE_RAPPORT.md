# Plan : Tests unitaires pour genererParametresEnvoieRapportProposition

## Objectif

Créer une suite de tests unitaires pour la fonction `genererParametresEnvoieRapportProposition` afin de garantir son bon fonctionnement dans tous les cas d'usage.

## Contexte

La fonction génère les paramètres nécessaires pour l'envoi d'emails de rapport aux directeurs de projet. Elle doit gérer :

- Les propositions de valeur d'avancement (PVA)
- Les indicateurs non mis à jour
- L'affichage conditionnel des sections
- L'agrégation des données par chantier

---

## Propositions de tests

### Groupe 1 : Tests sur les propositions de valeur d'avancement

**Test 1.1** : Doit générer les paramètres avec les propositions pour un chantier avec une proposition sur un territoire

- **Given** : Un chantier avec une proposition sur un territoire (DEPT-01)
- **When** : Appel de la fonction
- **Then** :
  - `afficherSectionPropositions` = true
  - `indicateursPropositions` contient 1 indicateur avec 1 territoire
  - `nombre_propositions` = "1 proposition territoriale de valeur d'avancement"

**Test 1.2** : Doit générer les paramètres avec les propositions pour un chantier avec plusieurs propositions

- **Given** : Un chantier avec plusieurs propositions (2 indicateurs × 2 territoires = 4 propositions)
- **When** : Appel de la fonction
- **Then** :
  - `afficherSectionPropositions` = true
  - `indicateursPropositions` contient 2 indicateurs
  - `nombre_propositions` = "4 propositions territoriales de valeur d'avancement"

---

### Groupe 2 : Tests sur les indicateurs non mis à jour

**Test 2.1** : Doit afficher la section MAJ avec des indicateurs non à jour

- **Given** : Un chantier avec 2 indicateurs non à jour
- **When** : Appel de la fonction avec `indicateursNonAJourParChantier`
- **Then** :
  - `afficherSectionMajIndicateur` = true
  - `indicateursNonMisAJour` = ["IND-001", "IND-002"]

**Test 2.2** : Ne doit pas afficher la section MAJ sans indicateurs non à jour

- **Given** : Un chantier sans indicateurs non à jour
- **When** : Appel de la fonction avec `indicateursNonAJourParChantier` vide pour ce chantier
- **Then** :
  - `afficherSectionMajIndicateur` = false
  - `indicateursNonMisAJour` = []

---

### Groupe 3 : Tests sur les combinaisons de sections

**Test 3.1** : Doit afficher les deux sections quand il y a des propositions ET des indicateurs non à jour

- **Given** : Un chantier avec propositions ET indicateurs non à jour
- **When** : Appel de la fonction
- **Then** :
  - `afficherSectionPropositions` = true
  - `afficherSectionMajIndicateur` = true

**Test 3.2** : Doit afficher seulement la section propositions quand il n'y a pas d'indicateurs non à jour

- **Given** : Un chantier avec propositions mais sans indicateurs non à jour
- **When** : Appel de la fonction
- **Then** :
  - `afficherSectionPropositions` = true
  - `afficherSectionMajIndicateur` = false

**Test 3.3** : Doit afficher seulement la section MAJ quand il n'y a pas de propositions

- **Given** : Un chantier sans propositions mais avec indicateurs non à jour
- **When** : Appel de la fonction
- **Then** :
  - `afficherSectionPropositions` = false
  - `indicateursPropositions` = []
  - `afficherSectionMajIndicateur` = true

**Test 3.4** : Ne doit pas retourner un chantier sans propositions ni indicateurs non à jour

- **Given** : Un chantier présent dans `mapChantiersInformation` mais sans propositions ni indicateurs non à jour
- **When** : Appel de la fonction
- **Then** :
  - Le chantier n'est PAS inclus dans le résultat
  - Le tableau `chantiers` ne contient pas ce chantier

## Structure des tests proposée

```typescript
describe("genererParametresEnvoieRapportProposition", () => {
  describe("Propositions de valeur d'avancement", () => {
    it("Test 1.1: ...");
    it("Test 1.2: ...");
    // etc.
  });

  describe("Indicateurs non mis à jour", () => {
    it("Test 2.1: ...");
    it("Test 2.2: ...");
    // etc.
  });

  describe("Combinaisons de sections", () => {
    it("Test 3.1: ...");
    it("Test 3.2: ...");
    // etc.
  });

  describe("Gestion de plusieurs chantiers", () => {
    it("Test 4.1: ...");
    it("Test 4.2: ...");
  });

  describe("Conseiller email", () => {
    it("Test 5.1: ...");
  });

  describe("Edge cases", () => {
    it("Test 6.1: ...");
    it("Test 6.2: ...");
    it("Test 6.3: ...");
  });
});
```

---

## Points d'attention

1. **Bug potentiel identifié** : La ligne 100 du fichier actuel fait `params[0].conseiller_email`, ce qui peut causer une erreur si `params` est vide. Il faudrait gérer ce cas ou garantir qu'il y a toujours au moins un chantier.

2. **Paramètre optionnel** : Le paramètre `indicateursNonAJourParChantier` a une valeur par défaut `new Map()`, ce qui est bien pour la rétrocompatibilité.

3. **Nommage** : Le type utilise `RapportDirecteurProjetChantierInformation` au lieu de `PropositionValeurAvancementChantierInformation` - vérifier la cohérence.

4. **Coverage** : Ces tests devraient couvrir ~95% du code de la fonction.

---

## Prochaines étapes

1. Valider cette liste de tests avec vous
2. Créer le fichier de test avec les fixtures nécessaires
3. Implémenter les tests un par un
4. Corriger le bug potentiel sur `params[0]` si confirmé
5. Atteindre 100% de couverture de code

---

**Question pour vous** : Cette liste de tests vous semble-t-elle complète ? Y a-t-il des cas d'usage spécifiques que je devrais ajouter ?
