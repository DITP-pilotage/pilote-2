# Plan : Ajout d'une alerte sur la non mise à jour des indicateurs au rapport PVA

## Objectif
Ajouter une alerte dans le rapport hebdomadaire envoyé par mail aux directeurs de projet pour les informer des indicateurs nécessitant une mise à jour.

## Contexte
Le use case `EnvoyerLesRapportsPropositionValeurAvancementUseCase` envoie actuellement un rapport aux directeurs de projet listant les chantiers avec des propositions de valeur d'avancement (PVA) en cours. Nous devons ajouter une section alertant sur les indicateurs qui ne sont pas à jour.

---

## ÉTAPE 1 : Création de la fonction dans PrismaIndicateurRepository

### 1.1 Créer les tests et la fonction vide

**Fichier** : `src/server/chantiers/infrastructure/adapters/PrismaIndicateurRepository.integration.test.ts` (ou créer si n'existe pas)

**Tests à créer** :
- **Test 1** : Doit retourner les indicateurs non à jour (est_a_jour = false ou null) pour tous les chantiers publiés
- **Test 2** : Doit exclure les indicateurs avec est_applicable = false ou null
- **Test 3** : Doit grouper les indicateurs par chantier_id
- **Test 4** : Doit retourner une Map vide si aucun indicateur n'est non à jour
- **Test 5** : Doit retourner seulement les chantiers ayant au moins un indicateur non à jour
- **Test 6** : Ne doit pas retourner les chantiers et les indicateurs non publiés

**Structure de retour attendue** :
```typescript
Map<string, string[]>
// Où :
// - clé = chantier_id
// - valeur = array d'indicateur_id
```

**Signature de la fonction à créer** :
```typescript
async recupererIndicateursNonAJourParChantierId(): Promise<Map<string, string[]>>
```

**Implémentation vide** :
```typescript
async recupererIndicateursNonAJourParChantierId(): Promise<Map<string, string[]>> {
  // TODO: À implémenter
  return new Map();
}
```

### 1.2 Vérification des tests en rouge
- **Action manuelle** : L'utilisateur vérifiera que les tests sont bien en rouge
- Ne pas implémenter la fonction à ce stade

### 1.3 Implémentation de la fonction

**Logique Prisma à implémenter** :
1. Requête sur `indicateur_territoire` avec :
   - Filtrage sur `indicateur_identite.statut = "PUBLIE"`
   - Filtrage sur `indicateur_identite.chantier_identite.statut = "PUBLIE"` (ou équivalent pour chantiers publiés)
   - Filtrage sur `est_applicable = true`
   - Filtrage sur `est_a_jour IN [false, null]`
   - Select uniquement : `indicateur_identite.id` et `indicateur_identite.chantier_id`
2. Grouper les résultats par `chantier_id` dans une Map
3. Pour chaque chantier, ne garder que les ids uniques des indicateurs

**Requête Prisma attendue** :
```typescript
const indicateurs = await prisma.indicateur_territoire.findMany({
  where: {
    indicateur_identite: {
      statut: "PUBLIE",
      chantier_identite: {
        statut: "PUBLIE",
      },
    },
    est_applicable: true,
    OR: [
      { est_a_jour: false },
      { est_a_jour: null },
    ],
  },
  select: {
    indicateur_identite: {
      select: {
        id: true,
        chantier_id: true,
      },
    },
  },
  distinct: ['id'],
});
```

**Transformation en Map** :
- Parcourir les résultats
- Créer une Map avec chantier_id comme clé
- Ajouter les indicateur_id uniques pour chaque chantier

### 1.4 Vérification des tests au vert
- **Action manuelle** : L'utilisateur vérifiera que les tests passent au vert

---

## ÉTAPE 2 : Mise à jour du use case EnvoyerLesRapportsPropositionValeurAvancementUseCase

### 2.1 Mettre à jour les tests

**Fichier** : `src/server/chantiers/__tests__/usecases/EnvoyerLesRapportsPropositionValeurAvancementUseCase.unit.test.ts`

**Modifications à apporter au test existant** :

1. **Ajouter le mock `indicateurRepository`** dans les déclarations :
   ```typescript
   let indicateurRepository: MockProxy<IndicateurRepository>;
   ```

2. **Initialiser le mock dans `beforeEach`** :
   ```typescript
   indicateurRepository = mock<IndicateurRepository>();
   ```

3. **Ajouter `indicateurRepository` aux dépendances du use case** :
   ```typescript
   envoyerLesRapportsPropositionValeurAvancementUseCase =
     new EnvoyerLesRapportsPropositionValeurAvancementUseCase({
       chantierRepository,
       utilisateurRepository,
       envoieEmailService,
       indicateurTerritoireValeurEvenementRepository,
       indicateurRepository, // NOUVEAU
     });
   ```

4. **Dans le test existant, ajouter le mock de `recupererIndicateursNonAJourParChantierId`** (dans la section Given) :
   ```typescript
   const indicateursNonAJourParChantier = new Map([
     ['CH-001', ['IND-001', 'IND-002']],
     ['CH-002', ['IND-003']],
   ]);

   indicateurRepository.recupererIndicateursNonAJourParChantierId.mockResolvedValue(
     indicateursNonAJourParChantier,
   );
   ```

5. **Mettre à jour les appels à `genererParametresEnvoieRapportProposition`** pour inclure le 4ème paramètre :
   ```typescript
   const paramsDirecteur1 = genererParametresEnvoieRapportProposition(
     listeDirecteursDeProjet[0].listeChantiers,
     mapChantiersPropositionInformation,
     propositionsParChantier,
     indicateursNonAJourParChantier, // NOUVEAU
   );
   ```

6. **Ajouter les assertions pour vérifier l'appel** (dans la section Then) :
   ```typescript
   expect(
     indicateurRepository.recupererIndicateursNonAJourParChantierId,
   ).toHaveBeenCalledTimes(1);
   expect(
     indicateurRepository.recupererIndicateursNonAJourParChantierId,
   ).toHaveBeenCalledWith();
   ```

### 2.2 Vérification des tests en rouge
- **Action manuelle** : L'utilisateur vérifiera que les tests sont bien en rouge

### 2.3 Mise à jour du use case

**Fichier 1** : `src/server/chantiers/usecases/EnvoyerLesRapportsPropositionValeurAvancementUseCase.ts`

**Modifications à apporter** :

1. **Ajouter `indicateurRepository` à l'interface `Dependencies`** (ligne ~7) :
   ```typescript
   interface Dependencies {
     chantierRepository: ChantierRepository;
     utilisateurRepository: UtilisateurRepository;
     envoieEmailService: EnvoieEmailService;
     indicateurTerritoireValeurEvenementRepository: IndicateurTerritoireValeurEvenementRepository;
     indicateurRepository: IndicateurRepository; // NOUVEAU
   }
   ```

2. **Ajouter l'import de `IndicateurRepository`** en haut du fichier :
   ```typescript
   import { IndicateurRepository } from "@/server/chantiers/domain/ports/IndicateurRepository";
   ```

3. **Ajouter la propriété privée** dans la classe (ligne ~21) :
   ```typescript
   private indicateurRepository: IndicateurRepository;
   ```

4. **Initialiser la propriété dans le constructeur** (ligne ~27) :
   ```typescript
   constructor({
     chantierRepository,
     utilisateurRepository,
     envoieEmailService,
     indicateurTerritoireValeurEvenementRepository,
     indicateurRepository, // NOUVEAU
   }: Dependencies) {
     this.chantierRepository = chantierRepository;
     this.utilisateurRepository = utilisateurRepository;
     this.envoieEmailService = envoieEmailService;
     this.indicateurTerritoireValeurEvenementRepository =
       indicateurTerritoireValeurEvenementRepository;
     this.indicateurRepository = indicateurRepository; // NOUVEAU
   }
   ```

5. **Dans la méthode `run()`**, après la ligne 42 (récupération des chantiers avec propositions) :
   ```typescript
   // Ligne ~42 : const listeChantiersIdsAvecProposition = [...]

   // AJOUTER ICI :
   const indicateursNonAJourParChantier =
     await this.indicateurRepository.recupererIndicateursNonAJourParChantierId();
   ```

6. **Modifier l'appel à `genererParametresEnvoieRapportProposition`** (ligne ~63) :
   ```typescript
   // AVANT :
   const { chantiers, conseillerEmail } = genererParametresEnvoieRapportProposition(
     directeur.listeChantiers,
     mapChantiersPropositionInformation,
     propositionsParChantier,
   );

   // APRÈS :
   const { chantiers, conseillerEmail } = genererParametresEnvoieRapportProposition(
     directeur.listeChantiers,
     mapChantiersPropositionInformation,
     propositionsParChantier,
     indicateursNonAJourParChantier,
   );
   ```

**Fichier 2** : `src/server/chantiers/app/contrats/ParametresEnvoieEmailRapportProposition.ts`

**Modifications à apporter** :

1. **Mettre à jour la signature de la fonction `genererParametresEnvoieRapportProposition`** :
   - Ajouter un 4ème paramètre : `indicateursNonAJourParChantier: Map<string, string[]>`
   - Rendre ce paramètre optionnel pour ne pas casser les autres utilisations

2. **Adapter la logique pour inclure les indicateurs non à jour dans le retour** :
   - Pour chaque chantier, extraire la liste des indicateurs non à jour depuis la Map
   - Ajouter cette information dans l'objet chantier retourné
   - Si le chantier n'a pas d'indicateurs non à jour, retourner un tableau vide

---

## Points d'attention

### Données de test
- Préparer des fixtures avec des indicateurs ayant différentes valeurs de `est_a_jour` et `est_applicable`
- S'assurer que les tests couvrent tous les cas de figure (null, false, true)
- Inclure des cas avec des indicateurs et chantiers non publiés

### Performance
- La fonction récupère tous les indicateurs non à jour de tous les chantiers publiés
- Surveiller les performances si le nombre total d'indicateurs est important
- Considérer l'ajout d'un index sur `(est_a_jour, est_applicable)` si nécessaire

### Template email Brevo
- Vérifier le template email (id: 4) dans Brevo
- S'assurer que le template supporte l'affichage des indicateurs non à jour
- Possiblement contacter l'équipe email si le template doit être modifié

### Interface de retour
- Le format de la Map doit être compatible avec le template email
- Possiblement transformer la Map en objet simple avant l'envoi à Brevo

### Tests d'intégration
- Après l'implémentation, tester le flux complet :
  1. Créer des propositions de valeur
  2. Marquer des indicateurs comme non à jour
  3. Exécuter le use case
  4. Vérifier le contenu de l'email envoyé

---

## Fichiers impactés

### Fichiers à créer :
- `src/server/chantiers/infrastructure/adapters/PrismaIndicateurRepository.integration.test.ts` (si n'existe pas)
- `src/server/chantiers/usecases/EnvoyerLesRapportsPropositionValeurAvancementUseCase.unit.test.ts` (si n'existe pas)

### Fichiers à modifier :
1. `src/server/chantiers/infrastructure/adapters/PrismaIndicateurRepository.ts`
   - Ajout de la méthode `recupererIndicateursNonAJourParChantierId`

2. `src/server/chantiers/domain/ports/IndicateurRepository.ts`
   - Ajout de la signature de méthode dans l'interface

3. `src/server/chantiers/usecases/EnvoyerLesRapportsPropositionValeurAvancementUseCase.ts`
   - Ajout de l'appel à la nouvelle méthode du repository
   - Passage des indicateurs non à jour à la génération des paramètres email

4. `src/server/chantiers/app/contrats/ParametresEnvoieEmailRapportProposition.ts`
   - Mise à jour de la fonction `genererParametresEnvoieRapportProposition`
   - Ajout du paramètre `indicateursNonAJourParChantier`
   - Adaptation du retour pour inclure ces informations

---

## Ordre d'exécution

### Phase 1 - Repository
1. ✅ Créer les tests pour `recupererIndicateursNonAJourParChantierId`
2. ✅ Créer la fonction vide dans le repository
3. ✅ Ajouter la signature dans l'interface `IndicateurRepository`
4. ⏸️ **STOP** - L'utilisateur vérifie que les tests sont rouges
5. ✅ Implémenter la fonction dans `PrismaIndicateurRepository`
6. ⏸️ **STOP** - L'utilisateur vérifie que les tests sont verts

### Phase 2 - Use Case
7. ✅ Créer/Mettre à jour les tests du use case
8. ⏸️ **STOP** - L'utilisateur vérifie que les tests sont rouges
9. ✅ Mettre à jour la fonction `genererParametresEnvoieRapportProposition`
10. ✅ Mettre à jour le use case `EnvoyerLesRapportsPropositionValeurAvancementUseCase`
11. ⏸️ **STOP** - L'utilisateur vérifie que les tests sont verts

---

## Questions ouvertes à clarifier

1. **Format de l'alerte dans l'email** :
   - Comment les indicateurs non à jour doivent-ils être affichés ?
   - Faut-il afficher le nom des indicateurs ou juste un compteur ?
   - Y a-t-il un lien vers une page détaillée ?

2. **Template Brevo** :
   - Le template id 4 existe-t-il déjà ?
   - Supporte-t-il déjà l'affichage des indicateurs non à jour ?
   - Faut-il créer un nouveau paramètre dans le template ?

3. **Périmètre des indicateurs** :
   - Doit-on filtrer par les territoires accessibles au directeur ?

4. **Niveau d'alerte** :
   - Faut-il différencier `est_a_jour = false` de `est_a_jour = null` ?
   - Y a-t-il un seuil de jours de retard à considérer ?
