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

### Étape 1 : Endpoint tRPC `recupererValeursAvancementTerritoires` — DONE

- `indicateurRouter` (`src/server/infrastructure/api/trpc/routes/indicateur.ts`)
- Input : `{ indicateurId, chantierId, jalon }`
- Wraps `ListerDetailsIndicateurTerritoireUseCaseV2` via `getContainer("chantiers")`
- Projette vers `{ territoireCode, valeurAvancement, valeurCibleAnnuelle, estApplicable }[]`

### Étape 2 : Widget client — DONE

Dossier `src/client/components/_commons/Widget/WidgetCartographieValeurAvancement/` :

| Fichier | Rôle | Statut |
|---|---|---|
| `types.ts` | Type `ValeurAvancementIndicateurTerritoire` | DONE |
| `WidgetCartographieValeurAvancement.tsx` | Composant principal, data fetching, layout | DONE |
| `useDonneesCartographieVA.tsx` | Données carto (dégradé interpolé) | DONE |
| `useLegendeVA.ts` | Légende dégradé + items conditionnels | DONE |
| `LegendeDegradeVA.tsx` | Composant légende dégradé (barre gradient) | DONE |
| `SuiviValeurAvancement.tsx` | Panneau comparaison territoires | DONE |
| `ValeursRemarquables.tsx` | Min/max/médiane | DONE — **à refactorer (voir étape 4)** |

### Étape 3 : Intégration dans `IndicateurDétails` — DONE

- Feature flag `NEXT_PUBLIC_FF_COMPARAISON_TERRITOIRES`
- `TuileWidget` + `Suspense` wrapper
- Fichier : `src/client/components/_commons/IndicateursChantier/Bloc/Détails/IndicateurDétails.tsx`

### Étape 4 : Valeurs remarquables côté serveur — TODO

**Problème** : les valeurs remarquables (min/médiane/max) sont actuellement calculées **côté client** dans `ValeursRemarquables.tsx`. Ça doit être fait **côté serveur** comme pour le TA (ref: `chantier.recupererStatistiquesAvancement`).

De plus, le calcul **doit prendre en compte la maille** (régionale ou départementale) — actuellement on calcule sur tous les territoires sans filtrer.

**À faire** :
- [ ] Créer un endpoint tRPC `indicateur.recupererStatistiquesValeurAvancement` avec input `{ indicateurId, chantierId, maille, jalon }`
- [ ] Le calcul côté serveur filtre les territoires par maille puis calcule min/médiane/max sur les `valeurAvancement` (en excluant les non applicables)
- [ ] Refactorer `ValeursRemarquables.tsx` pour consommer cet endpoint au lieu de calculer en local
- [ ] Pattern de référence : `chantier.recupererStatistiquesAvancement` (`src/server/infrastructure/api/trpc/routes/chantier.ts:52-69`)

---

## 5. Fichiers clés

| Fichier | Rôle |
|---|---|
| `src/server/infrastructure/api/trpc/routes/indicateur.ts` | Router tRPC indicateur (endpoints) |
| `src/server/infrastructure/api/trpc/routes/chantier.ts:52-69` | Pattern de référence pour statistiques serveur |
| `src/client/components/_commons/Widget/WidgetCartographieValeurAvancement/` | Widget complet |
| `src/client/components/_commons/IndicateursChantier/Bloc/Détails/IndicateurDétails.tsx` | Point d'intégration du widget |
| `src/client/components/_commons/Widget/WidgetCartographieTA/ValeursRemarquables.tsx` | Référence : valeurs remarquables avec appel tRPC |

---

## 6. Décisions prises

- [x] `territoireNom` et `maille` : résolus **côté client** via `récupérerDétailsSurUnTerritoire()` (JSON statique)
- [x] Sélection de territoires + comparaison : oui, calqué sur WidgetCartographieTA
- [x] Container DI : `getContainer("chantiers")` depuis le router indicateur
- [x] ValeursRemarquables : oui, min/max/médiane — **calcul côté serveur, filtré par maille**

## 7. Questions ouvertes

- [ ] Pour le endpoint statistiques : réutiliser le use case legacy (over-fetching + filter/compute dans l'adapter) ou query SQL dédiée ?
