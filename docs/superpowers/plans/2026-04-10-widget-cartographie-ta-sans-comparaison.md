# Widget cartographie TA sans comparaison - Plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Afficher sur la page d'accueil une version simplifiée du widget cartographie taux d'avancement, sans comparaison de territoires et avec navigation au clic vers le territoire sélectionné.

**Architecture:** Renommer l'ancien `WidgetCartographieTA` en `WidgetCartographieTAAvecComparaison` pour libérer le nom, créer un nouveau `WidgetCartographieTA` beaucoup plus simple (pas de Context Provider, pas de `useSelectionTerritoires`, pas de panel droit, pas de footer d'ajout de territoires), et l'utiliser dans une nouvelle `SectionCartographieTA` qui remplace `SectionComparaisonTerritoires` sur la page d'accueil. Les hooks de données (`useDonneesCartographieTA`, `useLegendeTA`) sont partagés entre les deux widgets.

**Tech Stack:** Next.js 14, React 18, TypeScript, tRPC, DSFR, Tailwind, `next/router`, Zustand (`useFiltresStoreNew`).

**Spec:** `docs/superpowers/specs/2026-04-10-widget-cartographie-ta-sans-comparaison-design.md`

**Ticket:** PIL-1370

---

## Fichiers impactés (vue d'ensemble)

- **Renommés** :
  - `src/client/components/_commons/Widget/WidgetCartographieTA/` → `.../WidgetCartographieTAAvecComparaison/`
  - `.../WidgetCartographieTA.tsx` → `.../WidgetCartographieTAAvecComparaison.tsx`
- **Modifiés (imports consommateurs de l'ancien symbole)** :
  - `src/client/components/PageChantier/ComparaisonTerritoires/ComparaisonTerritoires.tsx`
  - `src/client/components/PageAccueil/PageChantiers/PageChantiers.tsx`
  - `src/client/components/_commons/IndicateursChantier/Bloc/Détails/ComparaisonTerritoires/ComparaisonTerritoiresIndicateur.tsx`
  - `src/client/components/PageAccueil/PageAccueil.tsx` (remplace `SectionComparaisonTerritoires` → `SectionCartographieTA`)
- **Modifié (slots optionnels)** :
  - `src/client/components/_commons/Widget/BaseCartographieWidgetLayout.tsx`
- **Créés** :
  - `src/client/components/_commons/Widget/WidgetCartographieTA/WidgetCartographieTA.tsx`
  - `src/client/components/PageAccueil/sections/SectionCartographieTA.tsx`
- **Supprimé** :
  - `src/client/components/PageAccueil/sections/SectionComparaisonTerritoires.tsx`

---

## Task 1 : Renommer le widget existant en `WidgetCartographieTAAvecComparaison`

**Files:**
- Rename dir: `src/client/components/_commons/Widget/WidgetCartographieTA/` → `src/client/components/_commons/Widget/WidgetCartographieTAAvecComparaison/`
- Rename file: `.../WidgetCartographieTAAvecComparaison/WidgetCartographieTA.tsx` → `.../WidgetCartographieTAAvecComparaison/WidgetCartographieTAAvecComparaison.tsx`
- Modify: `src/client/components/PageChantier/ComparaisonTerritoires/ComparaisonTerritoires.tsx` (imports et usage JSX)
- Modify: `src/client/components/PageAccueil/PageChantiers/PageChantiers.tsx` (imports et usage JSX)
- Modify: `src/client/components/_commons/IndicateursChantier/Bloc/Détails/ComparaisonTerritoires/ComparaisonTerritoiresIndicateur.tsx` (imports et usage JSX)
- Modify (temporaire, sera supprimé en Task 5) : `src/client/components/PageAccueil/sections/SectionComparaisonTerritoires.tsx`

Note : les fichiers internes au dossier (`useDonneesCartographieTA.tsx`, `useLegendeTA.ts`, `SuiviTauxAvancement.tsx`, `TableauEvolutionTA.tsx`, `EvolutionCourbesTauxAvancement.tsx`, `useTauxAvancementParJalon.ts`) **gardent leurs noms actuels** — on ne renomme que le composant principal et le dossier.

- [ ] **Step 1 : Renommer le dossier en utilisant `git mv`**

```bash
git mv src/client/components/_commons/Widget/WidgetCartographieTA src/client/components/_commons/Widget/WidgetCartographieTAAvecComparaison
```

- [ ] **Step 2 : Renommer le fichier principal**

```bash
git mv src/client/components/_commons/Widget/WidgetCartographieTAAvecComparaison/WidgetCartographieTA.tsx src/client/components/_commons/Widget/WidgetCartographieTAAvecComparaison/WidgetCartographieTAAvecComparaison.tsx
```

- [ ] **Step 3 : Renommer le symbole exporté dans le fichier**

Modifier `src/client/components/_commons/Widget/WidgetCartographieTAAvecComparaison/WidgetCartographieTAAvecComparaison.tsx` :

Remplacer la ligne :

```ts
type WidgetCartographieTAProps = {
```

par :

```ts
type WidgetCartographieTAAvecComparaisonProps = {
```

Et la ligne :

```ts
export const WidgetCartographieTA = (props: WidgetCartographieTAProps) => {
```

par :

```ts
export const WidgetCartographieTAAvecComparaison = (props: WidgetCartographieTAAvecComparaisonProps) => {
```

Laisser les autres symboles internes (`WidgetCartographieTAContext`, `useWidgetCartographieTAContext`, `ChantiersProvider`, `IndicateurProvider`, `WidgetCartographieTAContent`, `WidgetCartographieTAContentProps`) **tels quels** — ils ne sont pas exportés et leur nom est déjà cohérent avec le dossier.

- [ ] **Step 4 : Mettre à jour l'import et l'usage dans `PageChantier/ComparaisonTerritoires/ComparaisonTerritoires.tsx`**

Remplacer :

```ts
import { WidgetCartographieTA } from "@/components/_commons/Widget/WidgetCartographieTA/WidgetCartographieTA";
```

par :

```ts
import { WidgetCartographieTAAvecComparaison } from "@/components/_commons/Widget/WidgetCartographieTAAvecComparaison/WidgetCartographieTAAvecComparaison";
```

Remplacer l'usage JSX `<WidgetCartographieTA` par `<WidgetCartographieTAAvecComparaison` (et la balise fermante si elle est nommée). Vérifier toutes les occurrences dans le fichier.

- [ ] **Step 5 : Mettre à jour l'import et l'usage dans `PageAccueil/PageChantiers/PageChantiers.tsx`**

Remplacer :

```ts
import { WidgetCartographieTA } from "@/components/_commons/Widget/WidgetCartographieTA/WidgetCartographieTA";
```

par :

```ts
import { WidgetCartographieTAAvecComparaison } from "@/components/_commons/Widget/WidgetCartographieTAAvecComparaison/WidgetCartographieTAAvecComparaison";
```

Remplacer toutes les occurrences de `<WidgetCartographieTA` par `<WidgetCartographieTAAvecComparaison` dans ce fichier.

- [ ] **Step 6 : Mettre à jour l'import et l'usage dans `ComparaisonTerritoiresIndicateur.tsx`**

Remplacer :

```ts
import { WidgetCartographieTA } from "@/components/_commons/Widget/WidgetCartographieTA/WidgetCartographieTA";
```

par :

```ts
import { WidgetCartographieTAAvecComparaison } from "@/components/_commons/Widget/WidgetCartographieTAAvecComparaison/WidgetCartographieTAAvecComparaison";
```

Remplacer l'usage JSX `<WidgetCartographieTA` par `<WidgetCartographieTAAvecComparaison`.

- [ ] **Step 7 : Mettre à jour l'import et l'usage dans `SectionComparaisonTerritoires.tsx` (temporaire)**

Remplacer :

```ts
import { WidgetCartographieTA } from "@/components/_commons/Widget/WidgetCartographieTA/WidgetCartographieTA";
```

par :

```ts
import { WidgetCartographieTAAvecComparaison } from "@/components/_commons/Widget/WidgetCartographieTAAvecComparaison/WidgetCartographieTAAvecComparaison";
```

Et dans le JSX, remplacer `<WidgetCartographieTA` par `<WidgetCartographieTAAvecComparaison`. Ce fichier sera supprimé en Task 5, cette étape sert juste à garder le projet compilant entre les tâches.

- [ ] **Step 8 : Vérifier l'absence de références restantes à l'ancien symbole**

Lancer une recherche globale :

```bash
grep -rn "WidgetCartographieTA[^A]" src/client --include="*.ts" --include="*.tsx"
```

Expected : aucune occurrence restante (toutes les références doivent maintenant être `WidgetCartographieTAAvecComparaison`). Si des résultats apparaissent, les corriger avant de continuer.

Note : `WidgetCartographieTA[^A]` exclut volontairement `WidgetCartographieTAAvecComparaison` ; il est normal que ce grep ne retourne rien à ce stade.

- [ ] **Step 9 : Lancer le lint pour valider**

```bash
npm run lint
```

Expected : PASS (pas d'erreur TypeScript ni ESLint liée au renommage).

- [ ] **Step 10 : Commit**

```bash
git add -A
git commit -m "refactor(PIL-1370): renommer WidgetCartographieTA en WidgetCartographieTAAvecComparaison"
```

---

## Task 2 : Rendre `children` et `footer` optionnels dans `BaseCartographieWidgetLayout`

**Files:**
- Modify: `src/client/components/_commons/Widget/BaseCartographieWidgetLayout.tsx`

Actuellement, `children: ReactNode` est **obligatoire** et le layout rend systématiquement une `<div>` même vide pour le panel droit. On veut rendre ce slot optionnel et ne pas afficher son markup s'il est absent, pour que le nouveau widget puisse ne pas avoir de panel droit du tout.

- [ ] **Step 1 : Rendre `children` optionnel dans le type de props**

Dans `src/client/components/_commons/Widget/BaseCartographieWidgetLayout.tsx`, remplacer :

```tsx
export const BaseCartographieWidgetLayout = ({
  titre,
  cartographie,
  complementsCartographie,
  children,
  footer,
}: {
  titre?: ReactNode;
  cartographie: ReactNode;
  complementsCartographie?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}) => {
```

par :

```tsx
export const BaseCartographieWidgetLayout = ({
  titre,
  cartographie,
  complementsCartographie,
  children,
  footer,
}: {
  titre?: ReactNode;
  cartographie: ReactNode;
  complementsCartographie?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
}) => {
```

- [ ] **Step 2 : Ne pas rendre le panneau droit quand `children` est absent (mode G)**

Dans le même fichier, remplacer le bloc du `if (isModeG)` :

```tsx
  if (isModeG) {
    return (
      <div className="flex flex-col gap-8 h-full">
        <div className="grid grid-cols-2 gap-8">
          <div className="flex flex-col gap-4 max-w-[400px] mx-auto">
            {titre}
            {cartographie}
            {complementsCartographie}
          </div>
          <div className="flex flex-col gap-2">{children}</div>
        </div>
        {footer}
      </div>
    );
  }
```

par :

```tsx
  if (isModeG) {
    return (
      <div className="flex flex-col gap-8 h-full">
        <div
          className={clsxm("grid gap-8", {
            "grid-cols-2": children !== undefined,
            "grid-cols-1": children === undefined,
          })}
        >
          <div className="flex flex-col gap-4 max-w-[400px] mx-auto">
            {titre}
            {cartographie}
            {complementsCartographie}
          </div>
          {children !== undefined && (
            <div className="flex flex-col gap-2">{children}</div>
          )}
        </div>
        {footer}
      </div>
    );
  }
```

- [ ] **Step 3 : Ne pas rendre le bloc `children` quand il est absent (mode non-G)**

Dans le même fichier, remplacer :

```tsx
  return (
    <div className="flex flex-col gap-8 h-full">
      {titre}
      <div className="w-full max-w-[400px] mx-auto">{cartographie}</div>
      {complementsCartographie}
      <div className="flex flex-col gap-2 grow">{children}</div>
      {footer}
    </div>
  );
```

par :

```tsx
  return (
    <div className="flex flex-col gap-8 h-full">
      {titre}
      <div className="w-full max-w-[400px] mx-auto">{cartographie}</div>
      {complementsCartographie}
      {children !== undefined && (
        <div className="flex flex-col gap-2 grow">{children}</div>
      )}
      {footer}
    </div>
  );
```

- [ ] **Step 4 : Ajouter l'import `clsxm` si absent**

Vérifier en haut de `BaseCartographieWidgetLayout.tsx` que `clsxm` est importé. S'il ne l'est pas, ajouter :

```ts
import { clsxm } from "@/utils/clsxm";
```

(Il l'est déjà d'après la lecture du fichier à l'étape de design, mais le vérifier car la référence à `clsxm` dans `TitreWidget` implique qu'il est déjà présent.)

- [ ] **Step 5 : Lancer le lint**

```bash
npm run lint
```

Expected : PASS.

- [ ] **Step 6 : Commit**

```bash
git add src/client/components/_commons/Widget/BaseCartographieWidgetLayout.tsx
git commit -m "refactor(PIL-1370): rendre children et footer optionnels dans BaseCartographieWidgetLayout"
```

---

## Task 3 : Créer le nouveau `WidgetCartographieTA` simplifié

**Files:**
- Create: `src/client/components/_commons/Widget/WidgetCartographieTA/WidgetCartographieTA.tsx`

Le nouveau widget est beaucoup plus simple : pas de Context Provider (un seul consommateur), pas de gestion de territoires sélectionnés, pas de panel droit, pas de footer. Le clic sur un territoire déclenche une navigation Next.js vers `/accueil/chantier/{territoireCode}?{queryParamString}`, en reprenant le pattern de `NavigationPilote.tsx:71-82`.

- [ ] **Step 1 : Créer le dossier**

```bash
mkdir -p src/client/components/_commons/Widget/WidgetCartographieTA
```

- [ ] **Step 2 : Créer le fichier `WidgetCartographieTA.tsx` avec le composant complet**

Créer `src/client/components/_commons/Widget/WidgetCartographieTA/WidgetCartographieTA.tsx` avec le contenu suivant :

```tsx
import { useRouter } from "next/router";
import { useCallback } from "react";
import { getFiltresActifs } from "@/stores/useFiltresStoreNew/useFiltresStoreNew";
import { getQueryParamString } from "@/client/utils/getQueryParamString";
import { MailleInterne } from "@/server/domain/maille/Maille.interface";
import { CartographieV2 } from "@/components/_commons/CartographieV2/CartographieV2";
import { LegendeCartographie } from "@/components/_commons/CartographieV2/LegendeCartographie";
import { BaseCartographieWidgetLayout } from "@/components/_commons/Widget/BaseCartographieWidgetLayout";
import { ComplementsCartographie } from "@/components/_commons/Widget/ComplementsCartographie";
import { ValeursRemarquables } from "@/components/_commons/Widget/ValeursRemarquables";
import { WidgetCartographieTitle } from "@/components/_commons/Widget/WidgetCartographieTitle";
import { WIDGET_STALE_TIME } from "@/components/_commons/Widget/constants";
import { useDonneesCartographieTA } from "@/components/_commons/Widget/WidgetCartographieTAAvecComparaison/useDonneesCartographieTA";
import { useLegendeTA } from "@/components/_commons/Widget/WidgetCartographieTAAvecComparaison/useLegendeTA";
import api from "@/server/infrastructure/api/trpc/api";

type WidgetCartographieTAProps = {
  chantierIds: string[];
  maille: MailleInterne;
  jalon: number;
};

const formatValeurTA = (valeur: number | null | undefined): string | null => {
  if (valeur === null || valeur === undefined) return null;
  return `${Math.round(valeur)}%`;
};

export const WidgetCartographieTA = ({
  chantierIds,
  maille,
  jalon,
}: WidgetCartographieTAProps) => {
  const router = useRouter();

  const [[territoiresAvancement, statistiques]] = api.useSuspenseQueries(
    (t) => [
      t.chantier.recupererTauxAvancementTerritoires(
        { chantierIds, jalon },
        { staleTime: WIDGET_STALE_TIME },
      ),
      t.chantier.recupererStatistiquesAvancement(
        { chantierIds, maille, jalon },
        { staleTime: WIDGET_STALE_TIME },
      ),
    ],
  );

  const donneesCartographie = useDonneesCartographieTA(
    territoiresAvancement,
    jalon,
  );
  const legende = useLegendeTA(territoiresAvancement);

  const valeursRemarquables = {
    minimum: formatValeurTA(statistiques?.minimum),
    mediane: formatValeurTA(statistiques?.médiane),
    maximum: formatValeurTA(statistiques?.maximum),
  };

  const naviguerVersTerritoire = useCallback(
    (territoireCode: string) => {
      const filtresActifs = getFiltresActifs();
      const queryParamString = getQueryParamString(
        filtresActifs,
        new Set(["territoireCode"]),
      );
      const href = `/accueil/chantier/${territoireCode}${
        queryParamString.length > 0 ? `?${queryParamString}` : ""
      }`;
      void router.push(href);
    },
    [router],
  );

  return (
    <BaseCartographieWidgetLayout
      titre={
        <WidgetCartographieTitle
          title="Taux d'avancement"
          subtitle={String(jalon)}
        />
      }
      cartographie={
        <CartographieV2
          onTerritoireSelect={naviguerVersTerritoire}
          donnees={donneesCartographie}
          maille={maille}
          territoiresSelectionnes={[]}
        />
      }
      complementsCartographie={
        <ComplementsCartographie>
          <ValeursRemarquables
            valeurs={valeursRemarquables}
            palette={{
              minimum: "#cbcbe8",
              mediane: "#6666bd",
              maximum: "#000091",
            }}
            maille={maille}
          />
          <LegendeCartographie items={legende} />
        </ComplementsCartographie>
      }
    />
  );
};
```

Points d'attention :
- **Pas de `children`** passé à `BaseCartographieWidgetLayout` → c'est bien l'optionnel ajouté en Task 2 qui est exercé ici.
- **Pas de `footer`** (pas d'`AjouterTerritoirePicker`).
- **`territoiresSelectionnes={[]}`** dans `CartographieV2` : aucun territoire mis en avant, on consulte simplement la carte.
- **Navigation via `router.push`** : pattern identique à `NavigationPilote.tsx` lignes 71-82, y compris l'exclusion de `territoireCode` du query param string (puisqu'il est dans l'URL path).
- **Hooks réutilisés** depuis `WidgetCartographieTAAvecComparaison/` : `useDonneesCartographieTA` et `useLegendeTA`.

- [ ] **Step 3 : Vérifier la signature de `CartographieV2`**

Ouvrir `src/client/components/_commons/CartographieV2/CartographieV2.tsx` et confirmer que la prop `onTerritoireSelect` a la signature `(territoireCode: string) => void`. Si la signature réelle diffère (par exemple `(territoire: Territoire) => void`), adapter la fonction `naviguerVersTerritoire` en conséquence (extraire `territoireCode` depuis l'objet fourni) avant de lancer le lint. Ne pas inventer de forme — se baser sur la signature réelle du fichier.

- [ ] **Step 4 : Vérifier la signature et la localisation de `getQueryParamString`**

Confirmer que `@/client/utils/getQueryParamString` existe et que sa signature accepte `(filtresActifs, exclusions: Set<string>)` avec un troisième paramètre optionnel. Si la signature exige un troisième argument ou si le chemin diffère, adapter l'import et l'appel en conséquence en s'inspirant directement de `NavigationPilote.tsx:71`.

- [ ] **Step 5 : Vérifier le nom exporté `getFiltresActifs`**

Confirmer que `getFiltresActifs` est bien exporté depuis `@/stores/useFiltresStoreNew/useFiltresStoreNew`. Sinon, corriger l'import en s'inspirant de `NavigationPilote.tsx:7`.

- [ ] **Step 6 : Lancer le lint**

```bash
npm run lint
```

Expected : PASS. En cas d'erreur TypeScript sur les imports ou les signatures, corriger en se basant sur les fichiers réels (ne pas ajouter de `any`).

- [ ] **Step 7 : Commit**

```bash
git add src/client/components/_commons/Widget/WidgetCartographieTA/WidgetCartographieTA.tsx
git commit -m "feat(PIL-1370): ajouter WidgetCartographieTA sans comparaison avec navigation au clic"
```

---

## Task 4 : Créer la section `SectionCartographieTA`

**Files:**
- Create: `src/client/components/PageAccueil/sections/SectionCartographieTA.tsx`

- [ ] **Step 1 : Créer le fichier avec le composant section**

Créer `src/client/components/PageAccueil/sections/SectionCartographieTA.tsx` avec le contenu suivant :

```tsx
import { TuileWidget } from "@/components/_commons/Widget/TuileWidget/TuileWidget";
import { WidgetCartographieTA } from "@/components/_commons/Widget/WidgetCartographieTA/WidgetCartographieTA";
import { usePageAccueilContext } from "@/components/PageAccueil/PageAccueilContext";

export const SectionCartographieTA = () => {
  const { chantierIds, jalon, mailleQuery } = usePageAccueilContext();

  return (
    <section id="taux-avancement-territoires" className="pt-4">
      <TuileWidget titre="Taux d'avancement des chantiers par territoire">
        <WidgetCartographieTA
          chantierIds={chantierIds}
          jalon={jalon}
          maille={mailleQuery}
        />
      </TuileWidget>
    </section>
  );
};
```

Notes :
- Pas de feature flag (la bascule legacy vs nouvelle page est gérée en amont).
- Pas de `territoireCode` dans les props du widget (puisque plus de panel de comparaison à initialiser).
- L'`id` de la section passe de `comparaison-territoires` à `taux-avancement-territoires` pour être cohérent avec le nouveau titre.

- [ ] **Step 2 : Lancer le lint**

```bash
npm run lint
```

Expected : PASS.

- [ ] **Step 3 : Commit**

```bash
git add src/client/components/PageAccueil/sections/SectionCartographieTA.tsx
git commit -m "feat(PIL-1370): ajouter SectionCartographieTA pour la page d'accueil"
```

---

## Task 5 : Remplacer l'ancienne section sur la page d'accueil et supprimer `SectionComparaisonTerritoires`

**Files:**
- Modify: `src/client/components/PageAccueil/PageAccueil.tsx`
- Delete: `src/client/components/PageAccueil/sections/SectionComparaisonTerritoires.tsx`

- [ ] **Step 1 : Vérifier qu'aucun autre fichier n'importe `SectionComparaisonTerritoires`**

```bash
grep -rn "SectionComparaisonTerritoires" src/ --include="*.ts" --include="*.tsx"
```

Expected : uniquement le fichier lui-même et `src/client/components/PageAccueil/PageAccueil.tsx`. Si un autre consommateur apparaît (ex: `PageAccueilLegacy.tsx`), le noter et l'inclure dans le step 2. Dans la version legacy, on garde l'ancien nom : **ne pas y toucher si elle importe depuis un autre fichier que celui qu'on supprime**.

- [ ] **Step 2 : Remplacer l'import et l'usage dans `PageAccueil.tsx`**

Dans `src/client/components/PageAccueil/PageAccueil.tsx`, remplacer :

```ts
import { SectionComparaisonTerritoires } from "@/components/PageAccueil/sections/SectionComparaisonTerritoires";
```

par :

```ts
import { SectionCartographieTA } from "@/components/PageAccueil/sections/SectionCartographieTA";
```

Et remplacer l'usage JSX :

```tsx
<SectionComparaisonTerritoires />
```

par :

```tsx
<SectionCartographieTA />
```

- [ ] **Step 3 : Vérifier les ancres vers `#comparaison-territoires`**

```bash
grep -rn "comparaison-territoires" src/ --include="*.ts" --include="*.tsx"
```

Si des ancres ou liens internes vers `#comparaison-territoires` existent ailleurs (sommaire, menu flottant, etc.) **et qu'ils pointaient vers l'ancienne section de la nouvelle page d'accueil**, les remplacer par `#taux-avancement-territoires`. Laisser les références de la page legacy intactes.

Si aucun résultat (hors fichier à supprimer), passer à l'étape suivante.

- [ ] **Step 4 : Supprimer l'ancien fichier section**

```bash
git rm src/client/components/PageAccueil/sections/SectionComparaisonTerritoires.tsx
```

- [ ] **Step 5 : Vérifier qu'aucune référence ne reste**

```bash
grep -rn "SectionComparaisonTerritoires" src/ --include="*.ts" --include="*.tsx"
```

Expected : aucune occurrence.

- [ ] **Step 6 : Lancer le lint**

```bash
npm run lint
```

Expected : PASS.

- [ ] **Step 7 : Commit**

```bash
git add -A
git commit -m "feat(PIL-1370): remplacer SectionComparaisonTerritoires par SectionCartographieTA sur la page d'accueil"
```

---

## Vérification finale

- [ ] **Step 1 : Lint global**

```bash
npm run lint
```

Expected : PASS.

- [ ] **Step 2 : Vérification visuelle manuelle (par le user)**

Démarrer l'app (`npm run dev`) et vérifier sur la page d'accueil :
- Le titre de la tuile est « Taux d'avancement des chantiers par territoire ».
- La carte s'affiche avec les valeurs remarquables (min/médiane/max) et la légende.
- Il n'y a **pas** de panel droit « Suivi et évolution des taux d'avancement ».
- Il n'y a **pas** de bouton « + ajouter un territoire » en bas.
- Cliquer sur un département navigue vers `/accueil/chantier/{codeDept}?...` et recharge la page d'accueil sur ce territoire.
- La page `PageChantier` (consommateur de `WidgetCartographieTAAvecComparaison`) fonctionne toujours avec comparaison, panel et ajout de territoires.
- La page indicateur (consommateur de `WidgetCartographieTAAvecComparaison` en mode indicateur) fonctionne toujours.
