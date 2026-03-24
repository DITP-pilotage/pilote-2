# Widget Cartographie Valeur d'Avancement - Document de travail

## Objectif

Nouveau widget cartographie pour afficher les **valeurs d'avancement** d'un indicateur par territoire (VA + VC par territoire, avec dégradé de couleurs).

Contexte : on a déjà `WidgetCartographieTA` (taux d'avancement chantiers) et `WidgetCartographieMeteo` (météo chantier). On veut un widget similaire mais à l'échelle d'un **indicateur**.

---

## 1. Traçabilité des données existantes

### Flux actuel (legacy)

```
Page chantier getServerSideProps
  │
  │  ListerDetailsIndicateurTerritoireUseCaseV2.run(
  │    listeIndicateurId[], chantierId, habilitations, profil, jalon
  │  )
  │
  ├─► PrismaIndicateurRepository.récupérerDétailsTerritoirePourUnIndicateur()
  │     - Query: indicateur_territoire JOIN indicateur_identite
  │                                    JOIN indicateur_territoire_jalon
  │                                    JOIN indicateur_territoire_valeur_evenement
  │     - Query: tous les territoires
  │     - Query: metadata_parametrage_indicateurs
  │     - Query: événements régionaux/départementaux
  │
  ├─► presenterEnDetailsIndicateursTerritoireContrat() (pass-through quasi 1:1)
  │
  └─► Result: Record<indicateurId, Record<CodeInsee, DetailsIndicateur>>
        │
        │  Transmis via SSR props → pageChantier context
        │
        ├─► IndicateurBloc → IndicateurDétails
        │     extracts detailsIndicateursTerritoire[indicateur.id]
        │
        └─► CartographieAvecSelecteurIndicateur
              ├─ useCartographieAvancementIndicateur (taux d'avancement)
              ├─ useCartographieValeurAvancementIndicateur (← CE QUI NOUS INTÉRESSE)
              └─ useCartographiePropositionValeurIndicateur
```

### Le hook `useCartographieValeurAvancementIndicateur`

**Fichier** : `src/client/components/_commons/Cartographie/CartographieAvecSelecteurIndicateur/useCartographieValeurAvancementIndicateur.tsx`

**Champs consommés de `DetailsIndicateur`** (par territoire) :
- `valeurAvancement` (number | null)
- `valeurCibleAnnuelle` (number | null)
- `estApplicable` (boolean | null)

**Paramètres additionnels** :
- `jalon` (pour l'affichage "VC {jalon}")
- `unité` (pour formatter "%", etc.)

**Logique de rendu** :
- Couleur = dégradé interpolé entre `#8bcdb1` → `#083a25` selon position relative (min/max)
- Si non applicable → hachures
- Si null → gris `#bababa`
- Tooltip = "VA: {valeur}" + "VC {jalon}: {valeurCibleAnnuelle}"

---

## 2. Analyse : le compute est-il au bon endroit ?

### Problème principal : données dans le gSSP

Le `detailsIndicateursTerritoire` est calculé dans le `getServerSideProps` de la page chantier (`src/pages/chantier/[id]/[territoireCode].tsx:222-233`). C'est un pattern legacy — les nouveaux widgets (TA, Météo) font du **data fetching côté client via tRPC**.

### Le UseCase existant est réutilisable

`ListerDetailsIndicateurTerritoireUseCaseV2` :
- Prend une liste d'indicateurs → on lui passera un tableau d'un seul élément
- Retourne tout `DetailsIndicateur` (25+ champs) → over-fetching, mais acceptable en V1
- Nécessite `chantierId` pour la vérification d'habilitations → passé en prop du widget
- Dépend de `datajobsExecution` → déjà géré dans le use case, pas d'impact pour nous

### Conclusion

**On réutilise le use case legacy.** L'endpoint tRPC sert d'**adapter** : il appelle le use case existant et projette la sortie vers le format minimal dont le widget a besoin. Pas de nouvelle requête SQL. On pourra optimiser plus tard si nécessaire.

---

## 3. Ce dont le widget a besoin

### ViewModel (par territoire)

Calqué sur `TauxAvancementComparaisonTerritoireViewModel` qui est le ViewModel de référence pour `WidgetCartographieTA` :

```typescript
type ValeurAvancementIndicateurTerritoireViewModel = {
  territoireCode: string;
  territoireNom: string;
  maille: MailleTerritoireSelectionne;
  valeurAvancement: number | null;
  valeurCibleAnnuelle: number | null;
  estApplicable: boolean | null;
};
```

### Props du widget

```typescript
{
  indicateurId: string;
  chantierId: string;   // pour habilitations, V1
  jalon: number;
  unite: string | null; // passé en prop pour le moment
  maille: MailleInterne;
  territoireCode: string;
}
```

### Endpoint tRPC

```
indicateur.recupererValeursAvancementTerritoires
  Input:  { indicateurId: string, chantierId: string, jalon: number }
  Output: ValeurAvancementIndicateurTerritoireViewModel[]
```

**Implémentation côté serveur** : la query tRPC appelle `ListerDetailsIndicateurTerritoireUseCaseV2.run([indicateurId], chantierId, habilitations, profil, jalon)` puis projette le résultat :

```typescript
// pseudo-code de l'adapter
const result = await useCase.run([input.indicateurId], input.chantierId, ...);
const details = result[input.indicateurId]; // Record<CodeInsee, DetailsIndicateur>
return Object.entries(details).map(([codeInsee, detail]) => ({
  territoireCode: codeInsee,
  territoireNom: ???, // à résoudre — le use case ne retourne pas le nom
  maille: ???,        // à résoudre — idem
  valeurAvancement: detail.valeurAvancement,
  valeurCibleAnnuelle: detail.valeurCibleAnnuelle,
  estApplicable: detail.estApplicable,
}));
```

> **Point d'attention** : `ListerDetailsIndicateurTerritoireUseCaseV2` retourne un `Record<CodeInsee, DetailsIndicateur>` mais `DetailsIndicateur` ne contient ni `territoireNom` ni `maille`. Or ces champs sont nécessaires pour `useSelectionTerritoires` (qui filtre par `territoireCode`) et pour le panneau latéral de comparaison (qui affiche le nom). Il faudra enrichir la projection — soit en récupérant les territoires depuis un autre source (ex: le store client des territoires), soit en enrichissant côté serveur dans l'adapter tRPC.

---

## 4. Plan d'implémentation

Référence : `WidgetCartographieTA` est le modèle à suivre pour l'architecture ET l'UI (sélection de territoires, comparaison, `AjouterTerritoirePicker`, etc.).

### Étape 1 : Endpoint tRPC

- Ajouter `recupererValeursAvancementTerritoires` dans `indicateurRouter` (`src/server/infrastructure/api/trpc/routes/indicateur.ts`)
- Input : `{ indicateurId: string, chantierId: string, jalon: number }`
- Appelle `getContainer("chantiers").resolve("listerDetailsIndicateurTerritoireUseCaseV2")` (pas de module indicateur dédié, OK d'utiliser le container chantiers)
- Projette la sortie vers `ValeurAvancementIndicateurTerritoireViewModel[]`
- Résoudre `territoireNom` et `maille` côté serveur dans l'adapter

### Étape 2 : Widget `WidgetCartographieValeurAvancement`

Nouveau dossier `src/client/components/_commons/Widget/WidgetCartographieValeurAvancement/` avec :

| Fichier | Rôle | Calqué sur (dans WidgetCartographieTA) |
|---|---|---|
| `WidgetCartographieValeurAvancement.tsx` | Composant principal, data fetching tRPC, layout | `WidgetCartographieTA.tsx` |
| `useDonneesCartographieVA.tsx` | Transformer données → `Record<string, CartographieV2Donnee>` (dégradé) | `useDonneesCartographieTA.tsx` |
| `useLegendeVA.ts` | Légende dégradé + états spéciaux | `useLegendeTA.ts` |
| `SuiviValeurAvancement.tsx` | Panneau latéral de comparaison des territoires sélectionnés | `SuiviTauxAvancement.tsx` |

### Composants partagés réutilisés (aucune modification)

- `BaseCartographieWidgetLayout` — layout carto + panneau latéral
- `CartographieV2` — rendu de la carte
- `LegendeCartographie` — affichage légende
- `AjouterTerritoirePicker` — picker d'ajout de territoires
- `useSelectionTerritoires` — gestion sélection/comparaison (depuis `WidgetCartographieMeteo/`)

### Étape 3 : Hooks carto (détail)

**`useDonneesCartographieVA`** — adapté de `useCartographieValeurAvancementIndicateur` pour `CartographieV2` :
- Input : `ValeurAvancementIndicateurTerritoireViewModel[]`, `jalon`, `unite`
- Output : `Record<string, CartographieV2Donnee>`
- Logique : dégradé interpolé `#8bcdb1` → `#083a25` (min/max), hachures si non applicable, gris si null
- Tooltip : "VA: {valeur}" + "VC {jalon}: {valeurCibleAnnuelle}"

**`useLegendeVA`** — légende dégradé :
- Dégradé min/max avec unité
- Entrées conditionnelles "Non applicable" et "Non renseigné"

**`SuiviValeurAvancement`** — panneau comparaison (calqué sur `SuiviTauxAvancement`) :
- Liste triée des territoires sélectionnés
- Affiche VA et VC par territoire avec couleur par territoire
- Bouton supprimer (sauf territoire courant)

---

## 5. Fichiers clés

| Fichier | Rôle |
|---|---|
| `src/server/chantiers/usecases/ListerDetailsIndicateurTerritoireUseCaseV2.ts` | UseCase réutilisé via tRPC (adapter) |
| `src/server/infrastructure/api/trpc/routes/indicateur.ts` | Router tRPC indicateur (ajouter endpoint ici) |
| `src/server/infrastructure/api/trpc/routes/chantier.ts:37-51` | Pattern tRPC de référence |
| `src/client/components/_commons/Cartographie/CartographieAvecSelecteurIndicateur/useCartographieValeurAvancementIndicateur.tsx` | Logique de rendu legacy à porter vers CartographieV2 |
| `src/client/components/_commons/Widget/WidgetCartographieTA/` | **Référence principale** : architecture ET UI |
| `src/client/components/_commons/Widget/WidgetCartographieMeteo/useSelectionTerritoires.ts` | Hook partagé pour sélection territoires |
| `src/server/chantiers/app/contrats/TauxAvancementComparaisonTerritoireViewModel.ts` | ViewModel de référence pour la shape des données |
| `src/client/components/_commons/Widget/BaseCartographieWidgetLayout.tsx` | Layout partagé |
| `src/client/components/_commons/Widget/AjouterTerritoirePicker.tsx` | Picker partagé |

---

## 6. Questions ouvertes

- [ ] Comment résoudre `territoireNom` et `maille` dans l'adapter tRPC ? Le use case legacy ne les retourne pas. Options : (a) enrichir côté serveur en requêtant les territoires, (b) résoudre côté client via un store/hook existant.
- [ ] Faut-il une `ValeursRemarquables` (min/max/médiane) comme dans WidgetCartographieTA ?
