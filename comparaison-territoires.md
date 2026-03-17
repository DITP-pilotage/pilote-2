# Comparaison territoriale — WidgetCartographieTA

## Objectif

Créer un nouveau widget `WidgetCartographieTA` qui affiche la cartographie des **taux d'avancement** par territoire, avec comparaison territoriale (sélection multiple de territoires). Ce widget s'inspire de `WidgetCartographieMeteo` existant.

Contrainte principale : la source de données doit être un **endpoint tRPC dédié**, et non couplée à `getServerSideProps`.

---

## Analyse de l'existant

### Architecture widget actuelle

```
Widget/
├── TuileWidget/                          # Conteneur partagé (responsive grid + context)
│   ├── TuileWidget.tsx                   # Layout responsive avec ResizeObserver
│   └── TuileWidgetContext.tsx            # Context fournissant taille/mode disposition
│
└── WidgetCartographieMeteo/              # Widget méteo (modèle à suivre)
    ├── WidgetCartographieMeteo.tsx        # Composant principal
    ├── RepartitionNiveauxDeConfiance.tsx  # Tableau de comparaison des territoires
    ├── useDonneesCartographie.tsx         # Transformation données → CartographieV2
    ├── useLegendeMeteo.ts                # Calcul de la légende
    └── useSelectionTerritoires.ts        # Gestion sélection via URL (nuqs)
```

### Composants réutilisables (déjà partagés)

| Composant | Fichier | Rôle |
|-----------|---------|------|
| `TuileWidget` | `Widget/TuileWidget/TuileWidget.tsx` | Conteneur responsive |
| `useTuileWidget` | `Widget/TuileWidget/TuileWidgetContext.tsx` | Hook context taille/mode |
| `CartographieV2` | `CartographieV2/CartographieV2.tsx` | Carte SVG interactive |
| `LegendeCartographie` | `CartographieV2/LegendeCartographie.tsx` | Légende de la carte |
| `Picker` / `Select` | `shared/Picker.tsx`, `shared/Select.tsx` | Sélecteur de territoires |
| `getCouleurTerritoire` | `utils/couleur/paletteTerritoires.ts` | Palette couleurs comparaison |
| `useTerritoiresCompares` | `hooks/useTerritoiresCompares.ts` | Sync sélection ↔ URL |
| `territoiresGroupesPourPicker` | `constants/territoires.ts` | Groupes territoires pour picker |

### Source de données actuelle pour l'avancement

Actuellement, le taux d'avancement est obtenu via `getServerSideProps` :

1. **Page** `pages/chantier/[id]/[territoireCode].tsx` → `RecupererChantierUseCaseV2.run()`
2. **Use case** charge le chantier complet via `PrismaChantierRepository.recupererLesEntreesDUnChantier()`
3. **Presenter** `presenterEnChantierContrat()` transforme en `Chantier.mailles: Record<Maille, TerritoiresDonnées>`
4. **Composant** `CartographieAvecSelecteur` reçoit `chantierMailles` et utilise `useCartographieAvancement()` pour transformer en données cartographiques

Le hook `useCartographieAvancement` (`Cartographie/CartographieAvecSelecteur/useCartographieAvancement.tsx`) :
- Prend `chantierMailles`, `elementsDeLegende`, `jalon`
- Fusionne `departementale` + `regionale`
- Pour chaque territoire : extrait `avancement.annuel`, `avancement.global`, `estApplicable`
- Applique `determinerRemplissage()` pour mapper la valeur en couleur (tranches de 10%)
- Retourne `{ legende, donneesCartographie }`

### Source de données pour la méteo (pattern à reproduire)

Le widget méteo utilise un **endpoint tRPC dédié** :
- **Router** : `chantierRouter.recupererMeteosTerritoires` (`routes/chantier.ts:25-36`)
- **Query** : `GetChantierMeteosTerritoiresQuery` → Prisma direct → `MeteoTerritoireViewModel[]`
- **Module** : enregistré dans `chantiersModule` (`chantiers/module.ts:123-125`)
- **Client** : `api.chantier.recupererMeteosTerritoires.useSuspenseQuery()`

### Légende avancement existante

`ÉLÉMENTS_LÉGENDE_AVANCEMENT_CHANTIERS` (`constants/légendes/élémentsDeLégendesCartographieAvancement.ts`) :
- 10 tranches : "0-10" (#e6e6f4) → "90-100" (#000091) — gradient violet clair → bleu foncé
- `DÉFAUT` : #bababa (gris, pas de donnée)
- `NON_APPLICABLE` : `url(#hachures-gris-blanc)` (hachures)

---

## Constat : code à mutualiser

En comparant `WidgetCartographieMeteo` avec ce dont `WidgetCartographieTA` a besoin, on identifie du code **réutilisable tel quel** et du code **spécifique à la méteo** à adapter.

### Réutilisable tel quel (partagé entre les deux widgets)

- `useSelectionTerritoires.ts` — **presque** réutilisable, mais actuellement typé sur `MeteoTerritoireViewModel`. Il faut le généraliser avec un type paramétrique `{ territoireCode: string }`.
- Le layout du widget (carte à gauche, tableau à droite, responsive via `useTuileWidget`)
- Le pattern CartographieV2 + LegendeCartographie
- Le Picker de territoires

### Spécifique à adapter

| Méteo | Avancement (TA) |
|-------|-----------------|
| `MeteoTerritoireViewModel` (méteo, dateMajQualitative) | Nouveau `AvancementTerritoireViewModel` (tauxAvancement, dateMAJ) |
| `useDonneesCartographie` → `determinerRemplissageMeteo` | Nouveau hook → `determinerRemplissage` par tranches de 10% |
| `useLegendeMeteo` → filtre SOLEIL/NUAGE/etc | Nouveau hook → filtre les tranches 0-100% |
| `RepartitionNiveauxDeConfiance` → affiche MeteoPicto + libellé météo | Nouveau composant → affiche barre/pourcentage TA |
| `GetChantierMeteosTerritoiresQuery` → lit `meteo` | Nouvelle query → lit `taux_avancement` |

---

## Plan d'action

### Phase 1 : Endpoint tRPC pour les taux d'avancement par territoire

Stratégie : réutiliser `RecupererChantierUseCaseV2` (use case existant qui charge le chantier complet avec ses mailles) plutôt que d'écrire une query Prisma brute. Cela garantit d'être iso-fonctionnel avec la page existante (mêmes filtres habilitations, même presenter, même logique métier).

- [ ] **1.1** Créer `GetChantierAvancementsTerritoiresQuery.ts` dans `server/chantiers/infrastructure/queries/`
  - Input : `{ chantierId: string, jalon: number, habilitations, profil }`
  - Délègue à `RecupererChantierUseCaseV2.run()` pour obtenir le `Chantier` complet
  - Extrait et transforme `chantier.mailles` (departementale + regionale) en `AvancementTerritoireViewModel[]`
  - Output : `{ territoireCode, territoireNom, codeInsee, maille, tauxAvancementAnnuel, tauxAvancementGlobal, estApplicable, dateDeMajQuantitative }`
- [ ] **1.2** Enregistrer la query dans `chantiersModule` (`chantiers/module.ts`)
- [ ] **1.3** Ajouter l'endpoint `recupererAvancementsTerritoires` dans `chantierRouter` (`routes/chantier.ts`) — passer les habilitations et profil depuis le context
- [ ] **1.4** Écrire les tests de la query

### Phase 2 : Généraliser `useSelectionTerritoires`

- [ ] **2.1** Rendre `useSelectionTerritoires` générique : le type `MeteoTerritoireViewModel` est utilisé uniquement pour filtrer sur `territoireCode`. Remplacer par un type générique `T extends { territoireCode: string }` pour que le hook soit réutilisable par les deux widgets.

### Phase 3 : Créer les hooks spécifiques au widget TA

- [ ] **3.1** Créer `useDonneesCartographieTA.tsx` — transforme `AvancementTerritoireViewModel[]` en données CartographieV2 (remplissage par tranches 0-100%, infobulles)
  - Réutiliser la logique `determinerRemplissage` de `useCartographieAvancement.tsx` (l'extraire en utility partagée)
- [ ] **3.2** Créer `useLegendeTA.ts` — calcule la légende à partir des données (filtre les items non présents)
  - Utilise `ÉLÉMENTS_LÉGENDE_AVANCEMENT_CHANTIERS`

### ~~Phase 4 : Créer le composant de comparaison pour le TA~~ (reportée)

> Pas nécessaire pour l'instant. On se concentre d'abord sur la cartographie seule. Le tableau de comparaison pourra être ajouté dans un second temps.

### Phase 4 : Assembler le widget

- [ ] **4.1** Créer `WidgetCartographieTA.tsx` dans `Widget/WidgetCartographieTA/`
  - Props : `{ chantierId, maille, territoireCode, jalon }`
  - Data : `api.chantier.recupererAvancementsTerritoires.useSuspenseQuery()`
  - Compose : CartographieV2 + LegendeCartographie (pas de tableau de comparaison pour l'instant)
  - Layout responsive via `useTuileWidget`

### Phase 5 : Intégrer dans la page

- [ ] **5.1** Dans `Cartes.tsx`, remplacer le premier `WidgetCartographieMeteo` (qui est actuellement un doublon/placeholder) par `WidgetCartographieTA`
  - Le `TuileWidget` contiendra donc : `WidgetCartographieTA` + `WidgetCartographieMeteo`
  - Toujours conditionné au feature flag `NEXT_PUBLIC_FF_COMPARAISON_TERRITOIRES`

### Phase 6 (bonus) : Mutualiser le layout widget cartographie

- [ ] **6.1** Optionnel — si les deux widgets ont un layout quasi identique (carte + tableau côte à côte avec responsive), extraire un composant `WidgetCartographieLayout` partagé qui prend en props la carte et le tableau. Cela évitera de dupliquer le layout flex-col/flex-row + les titres.

---

## Fichiers à créer

```
src/server/chantiers/infrastructure/queries/GetChantierAvancementsTerritoiresQuery.ts
src/client/components/_commons/Widget/WidgetCartographieTA/WidgetCartographieTA.tsx
src/client/components/_commons/Widget/WidgetCartographieTA/useDonneesCartographieTA.tsx
src/client/components/_commons/Widget/WidgetCartographieTA/useLegendeTA.ts
```

## Fichiers à modifier

```
src/server/chantiers/module.ts                              # Enregistrer la nouvelle query
src/server/infrastructure/api/trpc/routes/chantier.ts       # Ajouter l'endpoint
src/client/components/_commons/Widget/WidgetCartographieMeteo/useSelectionTerritoires.ts  # Généraliser le type
src/client/components/PageChantier/Cartes/Cartes.tsx        # Remplacer le 1er widget placeholder
```
