# Refonte Page Chantier

## Objectif

Refondre la page chantier (`/chantier/[id]/[territoireCode]`) de manière incrémentale, derrière un feature flag `REFONTE_PAGE_CHANTIER`. Le legacy (`PageChantierLegacy`) reste intact et actif par défaut. La nouvelle page (`PageChantier`) réutilise le maximum de composants extraits du legacy.

---

## Feature flag

| Clé config | Env var | Default |
|---|---|---|
| `featureFlip.refontePageChantier` | `NEXT_PUBLIC_FF_REFONTE_PAGE_CHANTIER` | `false` |

### Consommation du feature flag

Le flag est lu côté client via le hook `useEnv` (pattern existant, passe par tRPC `gestionContenu.recupererToutesLesVariablesContenu`). Il n'est **pas** passé via `configurationFeatureFlipping` dans les SSR props.

```tsx
// Dans le composant qui branche legacy vs nouveau
const ffRefontePageChantier = useEnv("NEXT_PUBLIC_FF_REFONTE_PAGE_CHANTIER");
```

### Branchement dans la page Next.js

```tsx
// src/pages/chantier/[id]/[territoireCode].tsx
const NextPageChantier = (props) => {
  const { chantierInformations, territoireCode, profil } = props;
  const ffRefontePageChantier = useEnv("NEXT_PUBLIC_FF_REFONTE_PAGE_CHANTIER");

  const estUnProfilDROM = profil === ProfilEnum.DROM;
  const estTerritoireNational = territoireCode === "NAT-FR";

  return (
    <pageChantier.ServerSidePropsProvider value={props}>
      <Head>...</Head>
      {estTerritoireNational && estUnProfilDROM && !chantierInformations.estUnChantierDROM ? (
        <ChoixTerritoire />
      ) : ffRefontePageChantier ? (
        <PageChantier />
      ) : (
        <PageChantierLegacy />
      )}
    </pageChantier.ServerSidePropsProvider>
  );
};
```

Le `getServerSideProps` ne change pas. Les deux pages consomment le même contexte `pageChantier`.

### Chemin de migration

1. Le feature flag est `false` par défaut : tout le monde voit `PageChantierLegacy`
2. On active en staging/recette pour valider la refonte
3. Quand validé : on supprime `PageChantierLegacy`, on retire le feature flag, `PageChantier` devient le seul rendu
4. Nettoyage : supprimer le flag de `config.ts`, `.env.*`, et le branchement conditionnel

---

## Nouveaux composants / primitives

### 1. `BasePageChantierLayout`

**Fichier** : `src/client/components/PageChantier/BasePageChantierLayout.tsx`

Extraction du squelette de page partagé entre legacy et nouvelle page (lignes 149-218 du legacy).

```tsx
// Props
interface BasePageChantierLayoutProps {
  children: ReactNode;
}
```

Contient :
- `<div className="flex bg-dsfr-contrast-grey ...">` (wrapper principal)
- `<BarreLatérale>` avec `<BarreLatéraleEncart>` + `<PageChantierEnTête>` + `<Sommaire>`
- `<main>` avec :
  - La barre sticky de navigation (`PanelMenuNavigation` + `BandeauEntetePageChantier`)
  - Le titre print
  - Le bandeau info maille source données régionale
  - Le container `fr-container--fluid` qui wrape `{children}`

La logique interne (calcul permissions, rubriques, alerte MAJ, etc.) reste dans le layout car elle est commune aux deux versions.

### 2. `BasePageChantierSection`

**Fichier** : `src/client/components/PageChantier/BasePageChantierSection.tsx`

Primitive pour les sections de la page chantier. Encapsule le pattern répétitif :

```tsx
interface BasePageChantierSectionProps {
  id: string;
  titre: string;
  className?: string;
  infobulle?: ReactNode;
  children: ReactNode;
}
```

Produit :
```tsx
<section className={clsx("grid grid-rows-[auto_1fr] print:block", className)} id={id}>
  <TitreInfobulleConteneur className="...">
    <Titre baliseHtml="h2" className={clsx("fr-h4 ...", { "text-primary": !estArchive, "!text-dsfr-grey-50": estArchive })} estInline>
      {titre}
    </Titre>
    {infobulle ? <Infobulle>{infobulle}</Infobulle> : null}
  </TitreInfobulleConteneur>
  {children}
</section>
```

Note : certaines sections ont des className légèrement différents (ex. `[grid-area:synthèse]`, `print:break-inside-avoid`). On passe un `className` optionnel pour gérer ça.

### 3. Composants sections extraits

Chaque section est extraite dans son propre fichier. Ces composants encapsulent la logique de rendu de chaque bloc.

| Section | Fichier | Utilisé par |
|---|---|---|
| Météo et synthèse des résultats | `SectionSyntheseDesResultats.tsx` | Legacy + Nouveau |
| Responsables | `SectionResponsables.tsx` | Legacy + Nouveau |
| Répartition géographique | `SectionRepartitionGeographique.tsx` | Legacy + Nouveau |
| Objectifs | `SectionObjectifs.tsx` | Legacy + Nouveau |
| Indicateurs | `SectionIndicateurs.tsx` | Legacy + Nouveau |
| Décisions stratégiques | `SectionDecisionsStrategiques.tsx` | Legacy + Nouveau |
| Commentaires du chantier | `SectionCommentaires.tsx` | Legacy + Nouveau |

Chaque composant est placé dans `src/client/components/PageChantier/sections/`.

Chaque composant section utilise `BasePageChantierSection` et contient le contenu interne actuel (ex. `<SyntheseDesResultats>`, `<ResponsablesPageChantier>`, etc.) + la logique conditionnelle d'affichage (ex. affichage carte si données territorialisées, indicateurs si > 0, décisions strat si maille nationale).

### 4. `PageChantier` (nouvelle page)

**Fichier** : `src/client/components/PageChantier/PageChantier.tsx`

Compose `BasePageChantierLayout` + les sections. La section avancement sera différente de la version legacy (nouveau composant à venir dans un ticket futur). Toutes les autres sections sont réutilisées telles quelles.

```tsx
const PageChantier = () => {
  return (
    <BasePageChantierLayout>
      {/* Grid avancement + synthèse + responsables */}
      <div className={clsx("grid ... gap-[0.7rem]", ...)}>
        <SectionAvancementChantierV2 />  {/* nouveau, propre à PageChantier */}
        <SectionSyntheseDesResultats />
        <SectionResponsables />
      </div>
      <SectionRepartitionGeographique />
      <SectionObjectifs />
      <SectionIndicateurs />
      <SectionDecisionsStrategiques />
      <SectionCommentaires />
    </BasePageChantierLayout>
  );
};
```

### 5. `PageChantierLegacy` refactoré

Après extraction, le legacy devient un assemblage simple identique au nouveau, mais avec l'ancienne section avancement :

```tsx
const PageChantierLegacy = () => {
  return (
    <BasePageChantierLayout>
      <div className={clsx("grid ... gap-[0.7rem]", ...)}>
        <SectionAvancementChantier />  {/* legacy avancement */}
        <SectionSyntheseDesResultats />
        <SectionResponsables />
      </div>
      <SectionRepartitionGeographique />
      <SectionObjectifs />
      <SectionIndicateurs />
      <SectionDecisionsStrategiques />
      <SectionCommentaires />
    </BasePageChantierLayout>
  );
};
```

---

## Plan de tâches

Chaque tâche = 1 commit. On ne casse rien à chaque étape ; le legacy fonctionne à l'identique.

### Tâche 1 : Ajouter le feature flag `REFONTE_PAGE_CHANTIER` — DONE

- Ajouter `refontePageChantier` dans `src/config.ts` (`featureFlip`)
- Ajouter `NEXT_PUBLIC_FF_REFONTE_PAGE_CHANTIER=false` dans `.env.test`
- Ajouter `NEXT_PUBLIC_FF_REFONTE_PAGE_CHANTIER` dans `VariableContenuDisponible.ts` :
  - Interface `VARIABLE_CONTENU_DISPONIBLE`
  - Tableau `FEATURE_FLIP_DEFINITIONS` (envKey, configKey, label)
- Le flag sera consommé via `useEnv("NEXT_PUBLIC_FF_REFONTE_PAGE_CHANTIER")` (pas via `configurationFeatureFlipping`)

### Tâche 2 : Extraire `BasePageChantierSection` — DONE

- Créer `src/client/components/PageChantier/sections/BasePageChantierSection.tsx`
- Props : `id`, `titre`, `className?`, `infobulle?`, `children`
- Gère le pattern titre + infobulle + section wrapper

### Tâche 3 : Extraire `SectionSyntheseDesResultats` — DONE

- Créer `src/client/components/PageChantier/sections/SectionSyntheseDesResultats.tsx`
- Utilise `BasePageChantierSection`
- Migrer le contenu de la section synthèse du legacy
- Remplacer dans `PageChantierLegacy` par `<SectionSyntheseDesResultats />`

### Tâche 4 : Extraire `SectionResponsables` — DONE

- Créer `src/client/components/PageChantier/sections/SectionResponsables.tsx`
- Remplacer dans `PageChantierLegacy`

### Tâche 5 : Extraire `SectionRepartitionGeographique` — DONE

- Créer `src/client/components/PageChantier/sections/SectionRepartitionGeographique.tsx`
- Inclut la logique conditionnelle d'affichage (données territorialisées)
- Remplacer dans `PageChantierLegacy`

### Tâche 6 : Extraire `SectionObjectifs` — TODO

- Créer `src/client/components/PageChantier/sections/SectionObjectifs.tsx`
- Remplacer dans `PageChantierLegacy`

### Tâche 7 : Extraire `SectionIndicateurs` — TODO

- Créer `src/client/components/PageChantier/sections/SectionIndicateurs.tsx`
- Inclut la logique conditionnelle (indicateurs.length > 0), l'alerte maille régionale
- Remplacer dans `PageChantierLegacy`

### Tâche 8 : Extraire `SectionDecisionsStrategiques` — TODO

- Créer `src/client/components/PageChantier/sections/SectionDecisionsStrategiques.tsx`
- Inclut la logique conditionnelle (maille nationale uniquement)
- Remplacer dans `PageChantierLegacy`

### Tâche 9 : Extraire `SectionCommentaires` — TODO

- Créer `src/client/components/PageChantier/sections/SectionCommentaires.tsx`
- Remplacer dans `PageChantierLegacy`

### Tâche 10 : Extraire `BasePageChantierLayout` — TODO

- Créer `src/client/components/PageChantier/BasePageChantierLayout.tsx`
- Extraire le squelette : barre latérale, main, navigation sticky, titre print, bandeau info
- Accepte `children` pour le contenu
- Refactorer `PageChantierLegacy` pour utiliser `BasePageChantierLayout` + sections

### Tâche 11 : Extraire la section avancement legacy — TODO

- Créer `src/client/components/PageChantier/sections/SectionAvancementChantier.tsx`
- Extraire la section avancement actuelle (lignes 219-268 du legacy) dans ce composant
- Remplacer dans `PageChantierLegacy`

### Tâche 12 : Créer `PageChantier` et brancher le feature flag — TODO

- Créer `src/client/components/PageChantier/PageChantier.tsx`
- Compose `BasePageChantierLayout` + toutes les sections (avec avancement legacy pour l'instant)
- Modifier `src/pages/chantier/[id]/[territoireCode].tsx` pour brancher le feature flag
- Si `refontePageChantier` → `<PageChantier />`, sinon → `<PageChantierLegacy />`

---

## Arborescence cible

```
src/client/components/PageChantier/
├── BasePageChantierLayout.tsx          # Squelette partagé (barre latérale, nav, main)
├── PageChantier.tsx                    # Nouvelle page (feature flag ON)
├── PageChantierLegacy.tsx              # Page legacy (feature flag OFF, refactoré)
├── PageChantierServerSideContext.tsx    # Contexte SSR (inchangé)
├── usePageChantier.ts                  # Hook permissions (inchangé)
├── sections/
│   ├── BasePageChantierSection.tsx     # Primitive section (titre + infobulle + wrapper)
│   ├── SectionAvancementChantier.tsx   # Avancement legacy
│   ├── SectionSyntheseDesResultats.tsx
│   ├── SectionResponsables.tsx
│   ├── SectionRepartitionGeographique.tsx
│   ├── SectionObjectifs.tsx
│   ├── SectionIndicateurs.tsx
│   ├── SectionDecisionsStrategiques.tsx
│   └── SectionCommentaires.tsx
├── AvancementChantier/                 # Existant (inchangé)
├── Cartes/                             # Existant (inchangé)
├── Commentaires/                       # Existant (inchangé)
├── DécisionsStratégiques/              # Existant (inchangé)
├── ...
```

## Remarques

- Le `getServerSideProps` n'est pas modifié. Les deux pages partagent exactement les mêmes données serveur.
- Le `PageChantierServerSideContext` n'est pas modifié. Le contexte est déjà branché au niveau de la page Next.js.
- Le `usePageChantier` hook n'est pas modifié. Il est consommé depuis les sections et le layout.
- La section avancement dans `PageChantier` sera remplacée par un nouveau composant dans un ticket ultérieur. En attendant, on réutilise le composant legacy.
