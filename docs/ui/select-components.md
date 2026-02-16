# Composants de sélection (Select)

## Vue d'ensemble

Le projet contient **6 approches différentes** pour gérer les composants de sélection, avec une duplication importante et des patterns non uniformisés.

## Catégorisation

### Composants génériques (réutilisables)

#### 1. **Select** (Radix UI)
- **Localisation** : `src/client/components/shared/Select.tsx`
- **Type** : Sélection simple (single select)
- **Technologie** : Radix UI Select primitive
- **Caractéristiques** :
  - API compositionnelle (Select.Trigger, Select.Content, Select.Item, etc.)
  - Styling DSFR personnalisé
  - Support des groupes et séparateurs
  - Gestion native de l'accessibilité via Radix
  - Portal pour le positionnement du dropdown

**Utilisations** :
- `src/client/components/_commons/SelecteurNew/SelecteurNew.tsx`

**Exemple d'utilisation** :
```tsx
<Select.Root value={value} onValueChange={onChange}>
  <Select.Trigger>
    <Select.Value />
  </Select.Trigger>
  <Select.Content>
    <Select.Item value="option1">Option 1</Select.Item>
    <Select.Item value="option2">Option 2</Select.Item>
  </Select.Content>
</Select.Root>
```

---

#### 2. **MultiSelectNew**
- **Localisation** : `src/client/components/_commons/MultiSelectNew/MultiSelect.tsx`
- **Type** : Multi-sélection avec recherche
- **Technologie** : Composant custom avec DSFR
- **Caractéristiques** :
  - Recherche intégrée
  - Boutons "Tout sélectionner/désélectionner"
  - Options groupées
  - Style DSFR natif
  - Dropdown personnalisé (non-Radix)
  - Hook `useMultiSelect` pour la logique

**Composants spécialisés basés sur MultiSelectNew** :
- `MultiSelectChantier` : Sélection de chantiers
- `MultiSelectTerritoire` : Sélection de territoires
- `MultiSelectPérimètreMinistériel` : Sélection de périmètres ministériels
- `MultiSelectProfil` : Sélection de profils utilisateur

**Exemple d'utilisation** :
```tsx
<MultiSelect
  label="Sélectionner des options"
  optionsGroupées={[
    {
      label: "Groupe 1",
      options: [
        { value: "opt1", label: "Option 1" },
        { value: "opt2", label: "Option 2" }
      ]
    }
  ]}
  valeursSélectionnéesParDéfaut={[]}
  changementValeursSélectionnéesCallback={(values) => onChange(values)}
  afficherBoutonsSélection={true}
/>
```

---

#### 3. **MultiSelect** (ancien)
- **Localisation** : `src/client/components/_commons/MultiSelect/MultiSelect.tsx`
- **Type** : Multi-sélection avec recherche
- **Technologie** : Composant custom avec DSFR
- **Caractéristiques** :
  - Très similaire à MultiSelectNew
  - Différence mineure : utilisation de `!!afficherBoutonsSélection` au lieu de ternaire
  - Semble être la version précédente de MultiSelectNew

**Composants spécialisés basés sur MultiSelect** :
- `MultiSelectChantier` : Sélection de chantiers (version ancienne)
- `MultiSelectTerritoire` : Sélection de territoires (version ancienne)
- `MultiSelectPérimètreMinistériel` : Sélection de périmètres ministériels (version ancienne)

**⚠️ Problème** : Duplication complète avec MultiSelectNew, nécessite une consolidation.

---

#### 4. **MultiSelectFiltre**
- **Localisation** : `src/client/components/_commons/MultiSelectFiltre/MultiSelectFiltre.tsx`
- **Type** : Multi-sélection avec recherche et groupes
- **Technologie** : Radix Dropdown + Checkbox custom
- **Caractéristiques** :
  - Utilise Radix Dropdown pour le positionnement
  - Composant Checkbox personnalisé
  - Sélection au niveau du groupe (avec état indéterminé)
  - Recherche avec filtrage en temps réel
  - Boutons "Tout sélectionner/désélectionner"
  - Options configurables (showGroupSelection, showSearch)
  - getOptionLabel et getPlaceholder personnalisables

**Utilisations** :
- `src/client/components/PageUtilisateurPiloteEval/FormulaireConfigurationDroits.tsx`
- `src/client/components/Evaluation/FiltresTableauEvaluation.tsx`

**Exemple d'utilisation** :
```tsx
<MultiSelectFiltre
  label="Filtrer par"
  values={selectedValues}
  optionGroups={[
    {
      label: "Groupe 1",
      options: ["option1", "option2"]
    }
  ]}
  onChange={(values) => setSelectedValues(values)}
  suffixLabel="éléments"
  getOptionLabel={(value) => labels[value]}
  showGroupSelection={true}
  showSearch={true}
/>
```

---

### Composants spécifiques (non réutilisables)

#### 5. **FiltresSelectionUnique**
- **Localisation** : `src/client/components/PageAccueil/Filtres/FiltresSelectionUnique/FiltresSelectionUnique.tsx`
- **Type** : Sélection simple avec tags
- **Usage** : Filtres de statut sur la page d'accueil
- **Caractéristiques** :
  - Composant spécifique aux filtres de la page d'accueil
  - Utilise le système de collapse DSFR
  - Intégration avec nuqs pour la gestion d'état via URL
  - Sauvegarde automatique des filtres dans le store
  - Boutons tags DSFR avec état actif
  - Gestion spéciale pour le statut "ARCHIVE"
  - Infobulles optionnelles

**Ne supporte que** : filtres de type "statut"

---

#### 6. **FiltresSelectionMultiple**
- **Localisation** : `src/client/components/PageAccueil/Filtres/FiltresSelectionMultiple/FiltresSelectionMultiple.tsx`
- **Type** : Multi-sélection avec checkboxes
- **Usage** : Filtres d'axes et territorialisation sur la page d'accueil
- **Caractéristiques** :
  - Composant spécifique aux filtres de la page d'accueil
  - Utilise le système de collapse DSFR
  - Intégration avec nuqs pour la gestion d'état via URL
  - Checkboxes DSFR natives
  - Gestion de la sélection via chaîne CSV dans l'URL

**Ne supporte que** : filtres de type "axes" ou "territorialisation"

---

## Problèmes identifiés

### 1. Duplication importante
- **MultiSelect** et **MultiSelectNew** sont quasiment identiques
- Les composants spécialisés existent en double (MultiSelectChantier, MultiSelectTerritoire, etc.)
- Code de recherche et filtrage dupliqué entre MultiSelect et MultiSelectFiltre

### 2. Manque de cohérence
- 3 technologies différentes : Radix Select, Radix Dropdown, composants custom
- Patterns d'API inconsistants entre les composants
- Nommage incohérent (Select vs Selecteur, anglais/français mélangés)

### 3. Architecture non scalable
- FiltresSelectionUnique et FiltresSelectionMultiple sont trop couplés à la page d'accueil
- Logique métier (nuqs, store) mélangée avec l'UI
- Difficile d'ajouter de nouveaux types de filtres

### 4. Accessibilité variable
- Radix offre une bonne accessibilité native
- Les composants custom (MultiSelect, MultiSelectNew) ont une accessibilité manuelle
- Pas de tests d'accessibilité uniformes

## Recommandations

### Court terme
1. **Supprimer la duplication** : Choisir entre MultiSelect et MultiSelectNew, supprimer l'autre
2. **Documenter les cas d'usage** : Clarifier quand utiliser quel composant
3. **Ajouter des tests** : Particulièrement pour l'accessibilité

### Moyen terme
1. **Unifier sur Radix UI** : Migrer tous les select vers Radix pour la cohérence
2. **Extraire la logique** : Séparer la logique des filtres (nuqs, store) de l'UI
3. **Créer des variantes** : Utiliser un composant de base avec des variantes (single, multi, avec recherche, etc.)

### Long terme
1. **Design system** : Intégrer dans un vrai système de design
2. **Storybook** : Documenter visuellement tous les composants
3. **Tests E2E** : Ajouter des tests Playwright pour les interactions complexes

## Matrice de décision

| Besoin | Composant recommandé | Alternative |
|--------|---------------------|-------------|
| Sélection simple générique | `Select` (Radix) | - |
| Multi-sélection avec recherche | `MultiSelectNew` | `MultiSelectFiltre` |
| Filtres spécifiques page d'accueil | `FiltresSelectionUnique` / `FiltresSelectionMultiple` | À refactorer |
| Sélection avec groupes complexes | `MultiSelectFiltre` | `MultiSelectNew` |
| Nouveau composant | `Select` (Radix) ou dérivé | Éviter les composants custom |

## Prochaines étapes

1. ✅ Documenter l'état actuel (ce document)
2. ⬜ Décider quelle version de MultiSelect conserver
3. ⬜ Créer un plan de migration pour unifier les composants
4. ⬜ Ajouter des tests pour éviter les régressions
5. ⬜ Migrer progressivement vers une solution unifiée
