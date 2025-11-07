# Plan : Ordonnancement des rattachements dans le tableau de pilotage

## Objectif
Permettre d'afficher les rattachements dans le tableau de pilotage par groupes et dans un ordre spécifique, avec un espacement visuel entre chaque groupe.

## Étapes de réalisation

### Étape 1 : Modification du schéma Prisma
**Fichier :** `src/database/prisma/schema.prisma`

**Modifications à apporter :**
- Ajouter une colonne `groupe` de type `String` au modèle `referentiel_rattachement`
- Ajouter une colonne `ordre` de type `Int` au modèle `referentiel_rattachement`

**Détails techniques :**
```prisma
model referentiel_rattachement {
  code                                 String                                 @id
  libelle                              String
  groupe                               String                                 // NOUVEAU
  ordre                                Int                                    // NOUVEAU
  created_at                           DateTime                               @default(now())
  updated_at                           DateTime                               @updatedAt
  objectifs                            referentiel_objectif[]
  fiche_evaluation                     fiche_evaluation[]
  rattachement_utilisateur_etape_jalon rattachement_utilisateur_etape_jalon[]

  @@schema("public")
}
```

**Note :** La migration sera créée manuellement par l'équipe.

---

### Étape 2 : Récupération des données dans la query
**Fichier :** `src/server/evaluation/queries/AfficherPilotageQuery.ts`

**Modifications à apporter :**
1. Modifier la méthode `fetchFichesEvaluation()` pour ajouter un `orderBy` composite :
   - Tri principal par `rattachement.groupe` (asc)
   - Tri secondaire par `rattachement.ordre` (asc)

2. Inclure les champs `groupe` et `ordre` dans le retour de la méthode `run()` :
   - Ajouter `groupe` et `ordre` dans l'objet `rattachement` retourné

**Code attendu :**
```typescript
// Dans fetchFichesEvaluation()
orderBy: [
  {
    rattachement: {
      groupe: "asc",
    },
  },
  {
    rattachement: {
      ordre: "asc",
    },
  },
]

// Dans run()
rattachement: {
  code: rattachement.code,
  libelle: rattachement.libelle,
  groupe: rattachement.groupe,    // NOUVEAU
  ordre: rattachement.ordre,      // NOUVEAU
}
```

---

### Étape 3 : Adaptation du layout du tableau
**Fichier :** `src/client/components/PagePilotage/TableauPilotage.tsx`

**Modifications à apporter :**

1. **Groupement des fiches par groupe :**
   - Créer une fonction utilitaire pour regrouper les `fichesEvaluation` par `groupe`
   - Utiliser un `Map` ou un objet pour organiser les données : `{ [groupe: string]: FicheEvaluation[] }`

2. **Affichage avec espacement entre groupes :**
   - Parcourir les groupes dans l'ordre
   - Pour chaque groupe, afficher toutes les fiches correspondantes
   - Ajouter un espacement visuel (margin/padding) entre chaque groupe

3. **Structure HTML attendue :**
   ```tsx
   {Object.entries(fichesParGroupe).map(([groupe, fiches], groupeIndex) => (
     <div key={groupe}>
       {/* Optionnel : Afficher le nom du groupe */}
       {/* <h3>{groupe}</h3> */}

       {fiches.map((fiche) => (
         // Rendu de la fiche existant
       ))}

       {/* Espacement entre groupes (sauf pour le dernier) */}
       {groupeIndex < Object.keys(fichesParGroupe).length - 1 && (
         <div className="h-8" /> // ou autre méthode d'espacement
       )}
     </div>
   ))}
   ```

4. **Classes CSS suggérées :**
   - Utiliser `space-y-8` ou `gap-8` pour l'espacement entre groupes
   - Possibilité d'ajouter une bordure ou une ligne de séparation entre groupes si nécessaire

---

## Vérifications à effectuer

### Tests à créer/modifier
- [ ] Tester le tri par groupe et ordre dans `AfficherPilotageQuery.test.ts`
- [ ] Tester le groupement visuel dans le composant `TableauPilotage`
- [ ] Vérifier le rendu avec plusieurs groupes
- [ ] Vérifier le rendu avec un seul groupe
- [ ] Vérifier l'espacement entre les groupes

### Points d'attention
- S'assurer que l'ordre au sein d'un même groupe est respecté
- Vérifier que l'espacement n'apparaît pas après le dernier groupe
- Gérer le cas où `groupe` ou `ordre` pourrait être null/undefined (valeurs par défaut ?)
- Maintenir la compatibilité avec les données existantes

---

## Dépendances et prérequis

### Avant l'étape 1
- Décider des valeurs par défaut pour les colonnes `groupe` et `ordre` sur les données existantes

### Avant l'étape 2
- Migration de base de données exécutée
- Données existantes migrées avec des valeurs appropriées

### Avant l'étape 3
- Backend déployé avec les nouvelles données

---

## Impact et risques

### Impacts
- **Base de données :** Ajout de 2 colonnes au modèle `referentiel_rattachement`
- **API :** Modification de la structure de retour de `AfficherPilotageQuery`
- **Frontend :** Modification du rendu du `TableauPilotage`

### Risques
- **Données manquantes :** Si `groupe` ou `ordre` sont null, le tri pourrait être imprévisible
- **Compatibilité :** S'assurer que les types TypeScript sont mis à jour en conséquence
- **Performance :** Le tri devrait avoir un impact minimal car déjà effectué en base

---

## Estimation
- Étape 1 : 10 minutes (modification schema + création migration)
- Étape 2 : 20 minutes (modification query + tests)
- Étape 3 : 30 minutes (modification layout + tests)
- Tests et vérifications : 30 minutes

**Total estimé :** ~1h30

---

## Date de création
2025-11-07
