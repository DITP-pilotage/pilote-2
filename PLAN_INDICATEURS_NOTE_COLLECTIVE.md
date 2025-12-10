# Plan d'implémentation : Ajout des indicateurs dans la note collective

## 1. Modifications du schéma Prisma

**Fichier**: `src/database/prisma/schema.prisma`

### 1.1 Ajouter les relations dans `indicateur_evaluation`
- Ajouter relation vers `chantier_evaluation` via `chantier_id`, `territoire_code`, `date_calcul`
- Ajouter relation vers `indicateur_territoire_jalon` via les clés appropriées

**Note**: Migration créée par le demandeur

---

## 2. Modifications de la query backend

**Fichier**: `src/server/evaluation/queries/RecupererDetailsNoteCollectiveQuery.ts`

### 2.1 Créer un type de retour explicite
```typescript
type DetailsNoteCollectiveResult = {
  id: string;
  nom: string;
  iconeMinistere: string | null;
  tauxAvancement: number | null;
  tauxAvancementPilote: number | null;
  indicateurs: Array<{
    id: string;
    nom: string;
    tauxAvancement: number | null;
    tauxAvancementPilote: number | null;
  }>;
}
```

### 2.2 Modifier la requête Prisma
- Ajouter un `include` pour récupérer les `indicateur_evaluation` liés
- Inclure les informations nécessaires depuis `indicateur_territoire_jalon` pour obtenir le nom de l'indicateur
- Récupérer `taux_avancement` (note) et le taux d'avancement Pilote de chaque indicateur

### 2.3 Transformer les données en camelCase
- Mapper tous les champs snake_case vers camelCase dans le résultat
- Structurer les indicateurs avec leurs informations complètes

---

## 3. Modifications de l'affichage front

**Fichier**: `src/pages/evaluation/note-collective/[rattachementCode].tsx`

### 3.1 Design proposé : Table hiérarchique avec expansion

#### Structure visuelle
```
┌─────────────────────────────────────────────────────────────┐
│ Chantier                    │ Note      │ Note Pilote      │
├─────────────────────────────────────────────────────────────┤
│ > 🏛️ Nom du chantier         │ 75 / 100  │ 80 / 100         │
│   ├─ 📊 Indicateur 1         │ 70 / 100  │ 75 / 100         │
│   ├─ 📊 Indicateur 2         │ 80 / 100  │ 85 / 100         │
│   └─ 📊 Indicateur 3         │ ND        │ 80 / 100         │
├─────────────────────────────────────────────────────────────┤
│ > 🏛️ Autre chantier          │ 85 / 100  │ 90 / 100         │
│   └─ 📊 Indicateur 4         │ 85 / 100  │ 90 / 100         │
└─────────────────────────────────────────────────────────────┘
```

#### Fonctionnalités
- **Lignes chantiers** :
  - Fond blanc par défaut
  - Chevron `>` cliquable pour expand/collapse
  - Survol en gris clair
  - Icône ministère + nom en gras

- **Lignes indicateurs** :
  - Fond gris très clair (bg-gray-50)
  - Indentation visuelle avec espace ou trait
  - Icône 📊 pour différencier des chantiers
  - Nom d'indicateur en taille normale (non gras)
  - Affichage conditionnel (visible seulement si chantier expandé)

- **Badges notes** :
  - Chantiers : fond violet (bg-purple-100 text-purple-700) pour Note, fond bleu (bg-blue-100 text-blue-700) pour Note Pilote
  - Indicateurs : mêmes couleurs mais légèrement plus pâles ou avec opacity réduite

### 3.2 Implémentation technique
- Ajouter un state React `expandedChantiers: Set<string>` pour gérer les chantiers ouverts
- Fonction `toggleChantier(chantierId: string)` pour expand/collapse
- Rendu conditionnel des lignes indicateurs basé sur l'état d'expansion
- Accessibilité : boutons avec aria-expanded, aria-controls

### 3.3 Gestion des cas limites
- Chantier sans indicateurs : pas de chevron, ligne normale
- Indicateurs avec valeur null : afficher "ND" comme actuellement
- Table vide : message "Aucun chantier trouvé" existant conservé

---

## 4. Points de vigilance

### 4.1 Performance
- Vérifier que l'ajout des includes n'impacte pas trop les performances
- Possibilité d'optimiser avec des `select` ciblés si nécessaire

### 4.2 Cohérence des données
- S'assurer que les indicateurs récupérés correspondent bien au même `date_calcul` et `jalon`
- Vérifier la logique de jointure entre `indicateur_evaluation` et `indicateur_territoire_jalon`

### 4.3 Tests
- L'utilisateur lancera les tests après implémentation
- Préparer des données de test avec et sans indicateurs

---

## 5. Ordre d'exécution

1. ✅ **Attendre validation du plan**
2. Attendre la création de la migration Prisma (par le demandeur)
3. Modifier `RecupererDetailsNoteCollectiveQuery.ts` (backend)
4. Modifier `[rattachementCode].tsx` (frontend)
5. L'utilisateur lance les tests et la vérification visuelle
