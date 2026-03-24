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

### Output tRPC (par territoire)

Le endpoint tRPC retourne les **données métier uniquement**. Le `territoireNom` et la `maille` sont résolus côté client.

```typescript
type ValeurAvancementIndicateurTerritoire = {
  territoireCode: string;        // = CodeInsee (clé du Record retourné par le use case)
  valeurAvancement: number | null;
  valeurCibleAnnuelle: number | null;
  estApplicable: boolean | null;
};
```

### Résolution territoire côté client

`territoireNom` et `maille` sont des données de **présentation** — elles sont résolues côté client via :
- `récupérerDétailsSurUnTerritoire(territoireCode)` depuis `src/client/constants/territoires.ts`
- Retourne `{ nom, nomAffiché, maille, codeInsee, codeParent }` à partir du JSON statique (`territoires.json`, 1004 entrées)
- Déjà utilisé partout dans l'app (y compris le hook legacy `useCartographieValeurAvancementIndicateur`)

> **Sujet futur** : un `TerritoireProvider` React centralisé serait pertinent pour éviter les imports directs de `récupérerDétailsSurUnTerritoire` éparpillés partout.

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
  Output: ValeurAvancementIndicateurTerritoire[]
```

**Implémentation côté serveur** : la query tRPC appelle `ListerDetailsIndicateurTerritoireUseCaseV2.run([indicateurId], chantierId, habilitations, profil, jalon)` puis projette le résultat :

```typescript
// pseudo-code de l'adapter
const result = await useCase.run([input.indicateurId], input.chantierId, ...);
const details = result[input.indicateurId]; // Record<CodeInsee, DetailsIndicateur>
return Object.entries(details).map(([codeInsee, detail]) => ({
  territoireCode: codeInsee,
  valeurAvancement: detail.valeurAvancement,
  valeurCibleAnnuelle: detail.valeurCibleAnnuelle,
  estApplicable: detail.estApplicable,
}));
```

---

## 4. Plan d'implémentation

Référence : `WidgetCartographieTA` est le modèle à suivre pour l'architecture ET l'UI (sélection de territoires, comparaison, `AjouterTerritoirePicker`, etc.).

### Étape 1 : Endpoint tRPC

- Ajouter `recupererValeursAvancementTerritoires` dans `indicateurRouter` (`src/server/infrastructure/api/trpc/routes/indicateur.ts`)
- Input : `{ indicateurId: string, chantierId: string, jalon: number }`
- Appelle `getContainer("chantiers").resolve("listerDetailsIndicateurTerritoireUseCaseV2")` (pas de module indicateur dédié, OK d'utiliser le container chantiers)
- Projette la sortie vers `ValeurAvancementIndicateurTerritoire[]` (données métier uniquement, pas de nom/maille)

### Étape 2 : Widget `WidgetCartographieValeurAvancement`

Nouveau dossier `src/client/components/_commons/Widget/WidgetCartographieValeurAvancement/` avec :

| Fichier | Rôle | Calqué sur (dans WidgetCartographieTA) |
|---|---|---|
| `WidgetCartographieValeurAvancement.tsx` | Composant principal, data fetching tRPC, layout | `WidgetCartographieTA.tsx` |
| `useDonneesCartographieVA.tsx` | Transformer données → `Record<string, CartographieV2Donnee>` (dégradé) | `useDonneesCartographieTA.tsx` |
| `useLegendeVA.ts` | Légende dégradé + états spéciaux | `useLegendeTA.ts` |
| `SuiviValeurAvancement.tsx` | Panneau latéral de comparaison des territoires sélectionnés | `SuiviTauxAvancement.tsx` |
| `ValeursRemarquables.tsx` | Min/max/médiane affichés sur la carto | `ValeursRemarquables.tsx` |

### Composants partagés réutilisés (aucune modification)

- `BaseCartographieWidgetLayout` — layout carto + panneau latéral
- `CartographieV2` — rendu de la carte
- `LegendeCartographie` — affichage légende
- `AjouterTerritoirePicker` — picker d'ajout de territoires
- `useSelectionTerritoires` — gestion sélection/comparaison (depuis `WidgetCartographieMeteo/`)

### Étape 3 : Hooks carto (détail)

**`useDonneesCartographieVA`** — adapté de `useCartographieValeurAvancementIndicateur` pour `CartographieV2` :
- Input : `ValeurAvancementIndicateurTerritoire[]`, `jalon`, `unite`
- Output : `Record<string, CartographieV2Donnee>`
- Résout `territoireNom` via `récupérerDétailsSurUnTerritoire()` côté client
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

## 6. Décisions prises

- [x] `territoireNom` et `maille` : résolus **côté client** via `récupérerDétailsSurUnTerritoire()` (JSON statique). Le tRPC ne retourne que les données métier.
- [x] Sélection de territoires + comparaison : oui, calqué sur WidgetCartographieTA
- [x] Container DI : `getContainer("chantiers")` depuis le router indicateur (pas de module indicateur dédié)
- [x] ValeursRemarquables : oui, min/max/médiane comme dans WidgetCartographieTA

## 7. Questions ouvertes

Aucune — toutes les décisions sont prises.
