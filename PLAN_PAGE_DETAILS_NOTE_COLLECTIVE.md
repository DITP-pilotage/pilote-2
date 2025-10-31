# Plan de mise en place - Page détails note collective

## Contexte
Création d'une page de détails pour la note collective accessible depuis la CardNoteCollective dans ListeAutoEvaluations.tsx.
Cette page permettra de consulter le détail des chantiers collectifs pour un rattachement et un jalon donnés.

---

## Étape 1 : Backend

### 1. Modification du schéma Prisma
**Fichier** : `src/database/prisma/schema.prisma`

**Action** : Ajouter une clé étrangère entre `chantier_evaluation` et `chantier_identite`

**Détails** :
- Ajouter un champ `chantier_identite` dans le modèle `chantier_evaluation`
- Créer la relation avec `chantier_identite` via le champ `id`
- Cette relation permettra de récupérer les informations du chantier (nom, ministères, icônes)

**Schéma actuel à modifier** :
```prisma
model chantier_evaluation {
  id               String
  code_insee       String
  maille           Maille
  territoire_code  String
  zone_id          String
  taux_avancement  Float?
  date_calcul      DateTime          @db.Date
  jalon            Int
  fiche_evaluation fiche_evaluation? @relation(...)

  @@id([id, territoire_code, date_calcul])
}
```

**Modification à apporter** :
- Ajouter la relation vers `chantier_identite` via `id`

---

### 2. Migration de la base de données
**Responsabilité** : Développeur (manuel)

**Actions** :
- Créer la migration avec `npm run database:migration`
- Appliquer la migration
- Vérifier que la relation est bien créée dans la base

---

### 3. Création de la query
**Fichier à créer** : `src/server/evaluation/queries/RecupererDetailsNoteCollectiveQuery.ts`

**Signature de la classe** :
```typescript
export class RecupererDetailsNoteCollectiveQuery {
  constructor(private readonly dependencies: { prisma: PrismaPilote }) {}

  async run({
    rattachementCode,
    jalon
  }: {
    rattachementCode: string;
    jalon: number;
  }) {
    // Implémentation à venir
    return [];
  }
}
```

**Objectif** : Laisser la query vide dans un premier temps pour suivre une approche TDD.

---

### 4. Création des tests
**Fichier à créer** : `src/server/evaluation/queries/RecupererDetailsNoteCollectiveQuery.test.ts`

**Scénarios de test à couvrir** :

#### Test 1 : Retourne les chantiers évaluation pour un rattachement et jalon donnés
- **Given** :
  - Un rattachement avec code "DIRMINISTERIELLE_001"
  - Un jalon 1
  - Plusieurs chantiers évaluation avec dates de calcul différentes
  - Des chantiers_identite associés avec ministères
- **When** : On appelle la query avec le rattachementCode et jalon
- **Then** :
  - On récupère uniquement les chantiers pour la dernière date_calcul
  - Chaque chantier contient : id, nom, icone_ministere, taux_avancement
  - Les chantiers sont triés de manière cohérente

#### Test 2 : Ne retourne que les chantiers de la dernière date_calcul
- **Given** :
  - Des chantiers évaluation avec date_calcul = 2024-01-01
  - Des chantiers évaluation avec date_calcul = 2024-02-01 (plus récente)
- **When** : On appelle la query
- **Then** :
  - Seuls les chantiers avec date_calcul = 2024-02-01 sont retournés

#### Test 3 : Retourne une liste vide si aucun chantier pour le rattachement
- **Given** : Un rattachement sans chantiers évaluation
- **When** : On appelle la query
- **Then** : La query retourne une liste vide []

#### Test 4 : Gère correctement les taux_avancement null
- **Given** : Des chantiers avec taux_avancement = null
- **When** : On appelle la query
- **Then** : Les chantiers sont retournés avec taux_avancement = null

**Structure des données de test** :
```typescript
interface ResultatAttendu {
  id: string;
  nom: string;
  icone_ministere: string | null;
  taux_avancement: number | null;
}
```

**Notes** :
- Utiliser `expect(result).toEqual([{...}])` plutôt que `toHaveLength + index access`
- Pas de variables à 1 ou 2 caractères
- Utiliser `$Enums` de Prisma pour les valeurs enum
- Commentaires uniquement pour given/when/then

---

### 5. Validation des tests en rouge
**Responsabilité** : Développeur (manuel)

**Action** :
- Ne pas lancer les tests automatiquement
- Vérifier manuellement que les tests sont bien rouges (échec attendu)

---

### 6. Implémentation de la query
**Fichier** : `src/server/evaluation/queries/RecupererDetailsNoteCollectiveQuery.ts`

**Inspiration** : S'inspirer de `ListerFichesAutoEvaluationQuery.ts`

**Logique d'implémentation** :
1. Récupérer la dernière date_calcul depuis `chantier_evaluation`
   ```typescript
   const derniereDateCalcul = await this.dependencies.prisma
     .getInstance()
     .chantier_evaluation.findFirst({
       orderBy: { date_calcul: "desc" },
       select: { date_calcul: true },
     });
   ```

2. Récupérer les chantiers évaluation avec les données nécessaires
   - Filtrer par `territoire_code = rattachementCode` (directement, sans passer par la relation fiche_evaluation)
   - Filtrer par `jalon`
   - Filtrer par `date_calcul` (dernière date uniquement)
   - Inclure `chantier_identite` pour récupérer le nom
   - Récupérer l'icône du ministère via la relation `chantier_identite.ministeres`

3. Mapper les résultats au format attendu
   ```typescript
   return chantiers.map(chantier => ({
     id: chantier.id,
     nom: chantier.chantier_identite.nom,
     icone_ministere: chantier.chantier_identite.ministeres[0]?.icone ?? null,
     taux_avancement: chantier.taux_avancement,
   }));
   ```

**Points d'attention** :
- Gérer le cas où `derniereDateCalcul` est null
- Gérer les ministères multiples (prendre le premier)
- Gérer les taux_avancement null
- Optimiser les requêtes Prisma avec les bons `include` et `select`

---

### 7. Validation des tests au vert
**Responsabilité** : Développeur (manuel)

**Action** :
- Lancer les tests
- Vérifier que tous les tests passent au vert
- Corriger les éventuels problèmes d'implémentation

---

## Étape 2 : Frontend

**À planifier ultérieurement**

Cette étape couvrira :
- Création de la page détails note collective
- Création du composant d'affichage des chantiers
- Intégration du tRPC endpoint
- Mise en place du routage
- Gestion de l'état et du chargement

---

## Dépendances techniques

### Backend
- Prisma : Gestion de la relation entre `chantier_evaluation` et `chantier_identite`
- tRPC : Exposition de l'endpoint (à venir dans étape 2)
- Tests : Jest avec mocks Prisma

### Fichiers impactés
- `src/database/prisma/schema.prisma`
- `src/server/evaluation/queries/RecupererDetailsNoteCollectiveQuery.ts` (nouveau)
- `src/server/evaluation/queries/RecupererDetailsNoteCollectiveQuery.test.ts` (nouveau)

---

## Checklist de validation

### Étape 1 - Backend
- [ ] Clé étrangère ajoutée dans le schéma Prisma
- [ ] Migration créée et appliquée
- [ ] Fichier query créé avec méthode vide
- [ ] Fichier de tests créé avec tous les scénarios
- [ ] Tests vérifiés en rouge
- [ ] Query implémentée
- [ ] Tous les tests passent au vert
- [ ] Code review effectué
