# Corrections Centre d'Aide - Plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Corriger les 10 retours client sur le centre d'aide custom PILOTE (editeur, front, feature flags, arborescence).

**Architecture:** Corrections réparties en tâches indépendantes — CSS/rendu, modale liens, feature flags, query params URL, nouveau champ BDD titre_affiche, expand/collapse arborescence, réordonnancement articles, recherche arborescence.

**Tech Stack:** Next.js, TipTap, Prisma, tRPC, nuqs, Tailwind, sanitize-html

**Jira:** PIL-1449

---

## Task 1: CSS bullet points et blockquote dans le rendu

**Files:**
- Modify: `src/client/components/PageCentreAidePilote/PageCentreAidePilote.tsx:76`
- Modify: `src/client/components/PagePanelAdministrateur/PagePanelAdministrateurCentreAide/PagePanelAdministrateurCentreAide.tsx:212`

- [ ] **Step 1: Ajouter les styles Tailwind pour ul/ol et blockquote**

Dans `src/client/components/PageCentreAidePilote/PageCentreAidePilote.tsx`, remplacer la ligne 76 :

```tsx
// Avant
<div className="[&_p]:mb-0 [&_a]:text-primary [&_h4]:my-2 [&_hr]:!my-2">

// Après
<div className="[&_p]:mb-0 [&_a]:text-primary [&_h4]:my-2 [&_hr]:!my-2 [&_ul]:ml-6 [&_ol]:ml-6 [&_ul]:list-disc [&_ol]:list-decimal [&_blockquote]:border-l-4 [&_blockquote]:border-blue-400 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-gray-600 [&_blockquote]:my-2">
```

Faire exactement la même chose dans `src/client/components/PagePanelAdministrateur/PagePanelAdministrateurCentreAide/PagePanelAdministrateurCentreAide.tsx` ligne 212 pour la preview admin.

- [ ] **Step 2: Extraire les classes dans une constante partagée**

Créer un fichier utilitaire pour éviter la duplication :

Modifier `src/client/components/_commons/EditeurRiche/RenduContenuHtml.tsx`, ajouter l'export en fin de fichier :

```tsx
export const classesRenduContenuHtml =
  "[&_p]:mb-0 [&_a]:text-primary [&_h4]:my-2 [&_hr]:!my-2 [&_ul]:ml-6 [&_ol]:ml-6 [&_ul]:list-disc [&_ol]:list-decimal [&_blockquote]:border-l-4 [&_blockquote]:border-blue-400 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-gray-600 [&_blockquote]:my-2";
```

Puis utiliser cette constante dans les deux fichiers au lieu de dupliquer le string.

- [ ] **Step 3: Vérifier visuellement**

Lancer `npm run dev`, aller dans le panel admin, créer un article avec des bullet points et une citation. Vérifier que :
- Les bullet points ont un retrait à gauche et des puces/numéros
- La citation a une bordure bleue à gauche et est en italique
- Ça s'affiche bien dans l'éditeur, la preview admin ET la page publique

- [ ] **Step 4: Commit**

```bash
git add src/client/components/_commons/EditeurRiche/RenduContenuHtml.tsx src/client/components/PageCentreAidePilote/PageCentreAidePilote.tsx src/client/components/PagePanelAdministrateur/PagePanelAdministrateurCentreAide/PagePanelAdministrateurCentreAide.tsx
git commit -m "fix(centre-aide): ajouter styles CSS pour bullet points et blockquote (PIL-1449)"
```

---

## Task 2: Liens mailto dans la modale d'insertion

**Files:**
- Modify: `src/client/components/_commons/EditeurRiche/ModaleInsertionUrl.tsx`

- [ ] **Step 1: Ajouter le mode "email" dans la modale**

Dans `src/client/components/_commons/EditeurRiche/ModaleInsertionUrl.tsx` :

1. Modifier le type du state `mode` pour inclure `"email"` :

```tsx
const [mode, setMode] = useState<"direct" | "constructeur" | "email">("direct");
```

2. Ajouter un state pour l'adresse email :

```tsx
const [email, setEmail] = useState("");
```

3. Dans `reinitialiser()`, ajouter `setEmail("")`

4. Dans la fonction `valider()`, ajouter un cas pour le mode email AVANT les modes existants :

```tsx
if (mode === "email") {
  if (!email.trim()) {
    setErreur("L'adresse email est requise.");
    return;
  }
  onValider(`mailto:${email.trim()}`);
  reinitialiser();
  onOpenChange(false);
  return;
}
```

5. Ajouter le bouton "Email" dans la barre de modes. Actuellement les boutons mode ne s'affichent que si `aDesExtensions` (pour image/video). Pour le type `lien`, on veut toujours afficher les boutons mode. Remplacer la condition `{aDesExtensions && (` (ligne 121) par :

```tsx
{(aDesExtensions || type === "lien") && (
```

Et ajouter le bouton Email après le bouton "Fichiers numériques" (ou après "URL directe" si `type === "lien"`) :

```tsx
{type === "lien" && (
  <button
    className={`px-3 py-1 rounded text-sm border ${mode === "email" ? "!bg-primary !text-white !border-primary" : "!bg-white !text-dsfr-grey-200 !border-dsfr-grey-900"}`}
    onClick={() => {
      setMode("email");
      setErreur("");
    }}
    type="button"
  >
    Email
  </button>
)}
```

6. Ajouter le formulaire email dans le form. Après le ternaire `mode === "direct" ? ... : ...`, restructurer en ajoutant le cas email :

```tsx
{mode === "email" ? (
  <div className="flex flex-col gap-1">
    <label className="text-sm font-medium" htmlFor="email">
      Adresse email
    </label>
    <input
      className="border rounded px-3 py-2 text-sm"
      id="email"
      onChange={(event) => setEmail(event.target.value)}
      placeholder="contact@exemple.fr"
      type="email"
      value={email}
    />
  </div>
) : mode === "direct" ? (
  // ... existing direct mode JSX
) : (
  // ... existing constructeur mode JSX
)}
```

- [ ] **Step 2: Vérifier visuellement**

Lancer `npm run dev`, ouvrir l'éditeur de centre d'aide, cliquer sur le bouton Lien dans la toolbar. Vérifier que :
- Un bouton "Email" apparaît à côté de "URL directe"
- En mode Email, on peut saisir une adresse mail
- Le lien inséré dans l'éditeur pointe vers `mailto:adresse@exemple.fr`

- [ ] **Step 3: Commit**

```bash
git add src/client/components/_commons/EditeurRiche/ModaleInsertionUrl.tsx
git commit -m "feat(centre-aide): ajouter mode email (mailto) dans la modale de lien (PIL-1449)"
```

---

## Task 3: Dissocier les feature flags admin / public

**Files:**
- Modify: `src/config.ts:307-311`
- Modify: `src/pages/panel-administrateur/centre-aide.tsx:17`
- Modify: `src/pages/centre-aide-pilote.tsx:11`
- Modify: `src/client/components/_commons/MiseEnPage/Navigation/NavigationPilote.tsx:51-52,128`
- Modify: `src/client/components/PagePanelAdministrateur/MenuLateralPanelAdministrateur/MenuLateralPanelAdministrateur.tsx:15,58`
- Modify: `src/server/gestion-contenu/domain/VariableContenuDisponible.ts:141-143`
- Modify: `src/server/gestion-contenu/__tests__/usecases/RecupererFeatureFlipsUseCase.unit.test.ts:48,99`

- [ ] **Step 1: Remplacer le FF unique par deux FF dans config.ts**

Dans `src/config.ts`, remplacer le bloc `centreAideCustomPilote` (lignes 307-311) par :

```typescript
centreAideAdmin: {
  format: Boolean,
  default: false,
  env: "NEXT_PUBLIC_FF_CENTRE_AIDE_ADMIN",
},
centreAidePilote: {
  format: Boolean,
  default: false,
  env: "NEXT_PUBLIC_FF_CENTRE_AIDE_PILOTE",
},
```

- [ ] **Step 2: Mettre à jour les pages SSR**

Dans `src/pages/panel-administrateur/centre-aide.tsx` (ligne 17), remplacer :

```typescript
// Avant
if (!session || !configurationFeatureFlip().centreAideCustomPilote) {

// Après
if (!session || !configurationFeatureFlip().centreAideAdmin) {
```

Dans `src/pages/centre-aide-pilote.tsx` (ligne 11), remplacer :

```typescript
// Avant
if (!session || !configurationFeatureFlip().centreAideCustomPilote) {

// Après
if (!session || !configurationFeatureFlip().centreAidePilote) {
```

- [ ] **Step 3: Mettre à jour la navigation publique**

Dans `src/client/components/_commons/MiseEnPage/Navigation/NavigationPilote.tsx` :

Remplacer les lignes 51-53 :

```typescript
// Avant
const ffCentreAideCustomPilote = useEnv(
  "NEXT_PUBLIC_FF_CENTRE_AIDE_CUSTOM_PILOTE",
);

// Après
const ffCentreAidePilote = useEnv("NEXT_PUBLIC_FF_CENTRE_AIDE_PILOTE");
```

Et remplacer la ligne 128 :

```typescript
// Avant
accessible: ffCentreAideCustomPilote,

// Après
accessible: ffCentreAidePilote,
```

Mettre à jour la dépendance dans le `useMemo` si `ffCentreAideCustomPilote` y figure (remplacer par `ffCentreAidePilote`).

- [ ] **Step 4: Mettre à jour le menu latéral admin**

Dans `src/client/components/PagePanelAdministrateur/MenuLateralPanelAdministrateur/MenuLateralPanelAdministrateur.tsx` :

Remplacer la ligne 15 :

```typescript
// Avant
const ffCentreAide = useEnv("NEXT_PUBLIC_FF_CENTRE_AIDE_CUSTOM_PILOTE");

// Après
const ffCentreAide = useEnv("NEXT_PUBLIC_FF_CENTRE_AIDE_ADMIN");
```

(Le reste du code utilise `ffCentreAide` en local, pas besoin de renommer)

- [ ] **Step 5: Mettre à jour VariableContenuDisponible**

Dans `src/server/gestion-contenu/domain/VariableContenuDisponible.ts`, remplacer les lignes 141-143 :

```typescript
// Avant
{
  envKey: "NEXT_PUBLIC_FF_CENTRE_AIDE_CUSTOM_PILOTE",
  configKey: "centreAideCustomPilote",
  label: "Centre d'aide custom Pilote",
},

// Après
{
  envKey: "NEXT_PUBLIC_FF_CENTRE_AIDE_ADMIN",
  configKey: "centreAideAdmin",
  label: "Centre d'aide Admin",
},
{
  envKey: "NEXT_PUBLIC_FF_CENTRE_AIDE_PILOTE",
  configKey: "centreAidePilote",
  label: "Centre d'aide Pilote",
},
```

- [ ] **Step 6: Mettre à jour le test**

Dans `src/server/gestion-contenu/__tests__/usecases/RecupererFeatureFlipsUseCase.unit.test.ts`, remplacer les occurrences de `centreAideCustomPilote: false` (lignes 48 et 99) par :

```typescript
centreAideAdmin: false,
centreAidePilote: false,
```

- [ ] **Step 7: Mettre à jour les fichiers .env**

Chercher les fichiers `.env*` qui contiennent `NEXT_PUBLIC_FF_CENTRE_AIDE_CUSTOM_PILOTE` et les remplacer par les deux nouvelles variables :

```
NEXT_PUBLIC_FF_CENTRE_AIDE_ADMIN=true
NEXT_PUBLIC_FF_CENTRE_AIDE_PILOTE=false
```

- [ ] **Step 8: Vérifier le build**

Lancer `npm run lint` pour vérifier qu'il n'y a pas de références cassées.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat(centre-aide): dissocier feature flags admin et public (PIL-1449)"
```

---

## Task 4: Largeur du centre d'aide public

**Files:**
- Modify: `src/client/components/PageCentreAidePilote/PageCentreAidePilote.tsx:58`

- [ ] **Step 1: Remplacer le padding par un max-width centré**

Dans `src/client/components/PageCentreAidePilote/PageCentreAidePilote.tsx`, remplacer la ligne 58 :

```tsx
// Avant
<main className="px-48 md:px-96 py-4">

// Après
<main className="max-w-screen-xl mx-auto px-6 py-4">
```

`max-w-screen-xl` = 1280px, proche de l'ancien `--nextra-content-width`. Le `px-6` donne un petit padding latéral sur petits écrans.

- [ ] **Step 2: Vérifier visuellement**

Comparer la largeur avec l'ancien centre d'aide. Le contenu doit être centré et ne pas s'étaler sur toute la largeur.

- [ ] **Step 3: Commit**

```bash
git add src/client/components/PageCentreAidePilote/PageCentreAidePilote.tsx
git commit -m "fix(centre-aide): aligner largeur page publique sur ancien centre aide (PIL-1449)"
```

---

## Task 5: Persistance de l'article sélectionné dans l'URL

**Files:**
- Modify: `src/client/components/_commons/CentreAide/useLectureCentreAide.ts`
- Modify: `src/client/components/PageCentreAidePilote/PageCentreAidePilote.tsx:40-47`

- [ ] **Step 1: Remplacer useState par nuqs dans useLectureCentreAide**

Dans `src/client/components/_commons/CentreAide/useLectureCentreAide.ts`, remplacer le `useState` par `useQueryState` de nuqs :

```tsx
import { useCallback } from "react";
import { keepPreviousData } from "@tanstack/react-query";
import { parseAsString, useQueryState } from "nuqs";
import api from "@/server/infrastructure/api/trpc/api";
import { construireArbre } from "./types";

export const useLectureCentreAide = () => {
  const {
    data: listeArticles,
    isLoading: estChargement,
    refetch: refetchListe,
  } = api.parametrageCentreAide.lister.useQuery(undefined, {
    placeholderData: keepPreviousData,
  });

  const [itemSelectionneId, setItemSelectionneId] = useQueryState(
    "article",
    parseAsString.withOptions({
      history: "replace",
      clearOnDefault: true,
    }),
  );

  const articles = listeArticles ?? [];
  const arbre = construireArbre(articles);

  const itemSelectionne = articles.find(
    (article) => article.id === itemSelectionneId,
  );

  const selectionnerItem = useCallback(
    (id: string) => {
      const article = articles.find((item) => item.id === id);
      if (!article) return;
      setItemSelectionneId(id);
    },
    [articles, setItemSelectionneId],
  );

  return {
    arbre,
    articles,
    itemSelectionneId,
    itemSelectionne,
    selectionnerItem,
    estChargement,
    refetchListe,
    setItemSelectionneId,
  };
};
```

- [ ] **Step 2: Adapter l'auto-sélection dans PageCentreAidePilote**

Dans `src/client/components/PageCentreAidePilote/PageCentreAidePilote.tsx`, modifier le `useEffect` d'auto-sélection pour ne sélectionner automatiquement que s'il n'y a pas déjà un article dans l'URL :

```tsx
useEffect(() => {
  if (
    !estChargement &&
    arbrePublie.length > 0 &&
    !aAutoSelectionne.current &&
    !itemSelectionneId
  ) {
    aAutoSelectionne.current = true;
    const premiere = trouverPremierePage(arbrePublie);
    if (premiere) {
      selectionnerItem(premiere.id);
    }
  }
}, [estChargement, arbrePublie, selectionnerItem, itemSelectionneId]);
```

La condition `!itemSelectionneId` empêche l'auto-sélection si l'URL contient déjà un `?article=xxx`.

- [ ] **Step 3: Vérifier**

1. Ouvrir le centre d'aide public
2. Sélectionner un article -> l'URL doit changer en `?article=<uuid>`
3. Rafraîchir la page -> le même article doit être re-sélectionné
4. Partager l'URL avec l'article -> il doit s'ouvrir directement

- [ ] **Step 4: Commit**

```bash
git add src/client/components/_commons/CentreAide/useLectureCentreAide.ts src/client/components/PageCentreAidePilote/PageCentreAidePilote.tsx
git commit -m "feat(centre-aide): persister article sélectionné dans URL avec nuqs (PIL-1449)"
```

---

## Task 6: Séparer nom d'arborescence / titre affiché

### Task 6a: Migration et modèle domaine

**Files:**
- Modify: `src/database/prisma/schema.prisma:743-767`
- Create: `src/database/prisma/migrations/<timestamp>_ajout_titre_affiche_centre_aide/migration.sql`
- Modify: `src/server/parametrage-centre-aide/domain/ArticleCentreAide.ts`
- Modify: `src/server/parametrage-centre-aide/domain/ports/ArticleCentreAideRepository.ts` (pas de changement nécessaire, le repo manipule des ArticleCentreAide)
- Modify: `src/server/parametrage-centre-aide/infrastructure/adapters/PrismaArticleCentreAideRepository.ts`
- Modify: `src/server/parametrage-centre-aide/app/contrats/ArticleCentreAideContrat.ts`

- [ ] **Step 1: Ajouter les colonnes dans le schéma Prisma**

Dans `src/database/prisma/schema.prisma`, ajouter dans le modèle `article_centre_aide` après `contenu_brouillon` :

```prisma
titre_affiche           String?
titre_affiche_brouillon String?
```

- [ ] **Step 2: Créer la migration**

```bash
npx prisma migrate dev --name ajout_titre_affiche_centre_aide --create-only
```

Vérifier que le SQL généré contient :

```sql
ALTER TABLE "article_centre_aide" ADD COLUMN "titre_affiche" TEXT;
ALTER TABLE "article_centre_aide" ADD COLUMN "titre_affiche_brouillon" TEXT;
```

- [ ] **Step 3: Ajouter les champs au domaine**

Dans `src/server/parametrage-centre-aide/domain/ArticleCentreAide.ts`, ajouter :

1. Deux propriétés privées après `_contenuBrouillon` :

```typescript
private _titreAffiche: string | null;
private _titreAfficheBrouillon: string | null;
```

2. Les ajouter au constructeur (entre `contenuBrouillon` et `type`) :

```typescript
titreAffiche: string | null,
titreAfficheBrouillon: string | null,
```

Et dans le corps : `this._titreAffiche = titreAffiche;` et `this._titreAfficheBrouillon = titreAfficheBrouillon;`

3. Ajouter les getters :

```typescript
get titreAffiche(): string | null {
  return this._titreAffiche;
}

get titreAfficheBrouillon(): string | null {
  return this._titreAfficheBrouillon;
}
```

4. Mettre à jour `creerArticle()` — ajouter les params et les passer au constructeur :

```typescript
titreAffiche?: string | null;
titreAfficheBrouillon?: string | null;
```

Passer `titreAffiche ?? null` et `titreAfficheBrouillon ?? null` au constructeur.

- [ ] **Step 4: Mettre à jour le repository Prisma**

Dans `src/server/parametrage-centre-aide/infrastructure/adapters/PrismaArticleCentreAideRepository.ts` :

`convertirEnModel` — ajouter :

```typescript
titre_affiche: article.titreAffiche,
titre_affiche_brouillon: article.titreAfficheBrouillon,
```

`convertirEnDomaine` — ajouter :

```typescript
titreAffiche: model.titre_affiche,
titreAfficheBrouillon: model.titre_affiche_brouillon,
```

- [ ] **Step 5: Mettre à jour le contrat**

Dans `src/server/parametrage-centre-aide/app/contrats/ArticleCentreAideContrat.ts` :

Ajouter au type `ArticleCentreAideContrat` :

```typescript
titreAffiche: string | null;
titreAfficheBrouillon: string | null;
```

Ajouter dans `presenterEnArticleCentreAideContrat` :

```typescript
titreAffiche: article.titreAffiche,
titreAfficheBrouillon: article.titreAfficheBrouillon,
```

- [ ] **Step 6: Commit**

```bash
git add src/database/prisma/ src/server/parametrage-centre-aide/
git commit -m "feat(centre-aide): ajout champs titre_affiche en base et domaine (PIL-1449)"
```

### Task 6b: TRPC et UI admin

**Files:**
- Modify: `src/server/infrastructure/api/trpc/routes/parametrageCentreAide.ts`
- Modify: `src/server/parametrage-centre-aide/usecases/ModifierArticleCentreAideUseCase.ts`
- Modify: `src/server/parametrage-centre-aide/usecases/PublierArticleCentreAideUseCase.ts`
- Modify: `src/client/components/PagePanelAdministrateur/PagePanelAdministrateurCentreAide/useEditionCentreAide.ts`
- Modify: `src/client/components/PagePanelAdministrateur/PagePanelAdministrateurCentreAide/PagePanelAdministrateurCentreAide.tsx`

- [ ] **Step 1: Mettre à jour les routes tRPC**

Dans `src/server/infrastructure/api/trpc/routes/parametrageCentreAide.ts` :

Route `modifier` — ajouter les champs au schema zod (après `estMasque`) :

```typescript
titreAffichePublie: z.string().nullish(),
titreAffiche: z.string().nullish(),
```

Et les passer au use case :

```typescript
titreAffichePublie: input.titreAffichePublie,
titreAffiche: input.titreAffiche,
```

- [ ] **Step 2: Mettre à jour le use case Modifier**

Dans `src/server/parametrage-centre-aide/usecases/ModifierArticleCentreAideUseCase.ts`, ajouter les params dans `execute()` :

```typescript
titreAffiche?: string | null;
titreAffichePublie?: string | null;
```

Et dans l'appel à `ArticleCentreAide.creerArticle()` :

```typescript
titreAffiche: titreAffichePublie ?? null,
titreAfficheBrouillon: titreAffiche ?? null,
```

- [ ] **Step 3: Mettre à jour le use case Publier**

Lire `src/server/parametrage-centre-aide/usecases/PublierArticleCentreAideUseCase.ts` et s'assurer que lors de la publication, `titreAffiche` est copié depuis `titreAfficheBrouillon`. Le use case récupère l'article et doit propager le champ.

- [ ] **Step 4: Mettre à jour le hook d'édition admin**

Dans `src/client/components/PagePanelAdministrateur/PagePanelAdministrateurCentreAide/useEditionCentreAide.ts` :

1. Ajouter un state `titreAffiche` :

```typescript
const [titreAffiche, setTitreAffiche] = useState("");
```

2. Dans `selectionnerItem`, charger le titreAffiche :

```typescript
setTitreAffiche(article.titreAfficheBrouillon ?? article.titreAffiche ?? "");
```

3. Dans l'auto-sélection `useEffect`, ajouter :

```typescript
setTitreAffiche(premier.titreAfficheBrouillon ?? premier.titreAffiche ?? "");
```

4. Dans `sauvegarder()`, passer les nouveaux champs à la mutation :

```typescript
titreAffiche,
titreAffichePublie: itemSelectionne.titreAffiche,
```

5. Dans le return, ajouter `titreAffiche, setTitreAffiche`

- [ ] **Step 5: Ajouter le champ dans l'UI admin**

Dans `src/client/components/PagePanelAdministrateur/PagePanelAdministrateurCentreAide/PagePanelAdministrateurCentreAide.tsx` :

Extraire `titreAffiche, setTitreAffiche` depuis le hook.

Après le champ "Titre" existant (lignes 120-131), ajouter un second champ :

```tsx
<div className="flex-1">
  <label className="block text-sm font-medium text-gray-700 mb-1">
    Titre affiché (contenu)
  </label>
  <input
    className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
    onChange={(event) => setTitreAffiche(event.target.value)}
    placeholder="Titre affiché dans le contenu de l'article"
    type="text"
    value={titreAffiche}
  />
</div>
```

Renommer le label du premier champ en "Nom (arborescence)" :

```tsx
<label className="block text-sm font-medium text-gray-700 mb-1">
  Nom (arborescence)
</label>
```

- [ ] **Step 6: Commit**

```bash
git add src/server/infrastructure/api/trpc/routes/parametrageCentreAide.ts src/server/parametrage-centre-aide/usecases/ src/client/components/PagePanelAdministrateur/PagePanelAdministrateurCentreAide/
git commit -m "feat(centre-aide): UI admin pour titre affiché séparé du nom arborescence (PIL-1449)"
```

### Task 6c: Affichage titre dans la page publique

**Files:**
- Modify: `src/client/components/PageCentreAidePilote/PageCentreAidePilote.tsx:74`

- [ ] **Step 1: Utiliser titreAffiche dans le rendu public**

Dans `src/client/components/PageCentreAidePilote/PageCentreAidePilote.tsx`, remplacer la ligne 74 :

```tsx
// Avant
<h2 className="text-xl font-bold mb-4">{itemSelectionne.titre}</h2>

// Après
<h2 className="text-xl font-bold mb-4">
  {itemSelectionne.titreAffiche || itemSelectionne.titre}
</h2>
```

L'arborescence continue d'utiliser `titre` (le nom), mais le contenu affiché utilise `titreAffiche` avec fallback sur `titre`.

- [ ] **Step 2: Commit**

```bash
git add src/client/components/PageCentreAidePilote/PageCentreAidePilote.tsx
git commit -m "feat(centre-aide): afficher titre_affiche dans le contenu public (PIL-1449)"
```

---

## Task 7: Ouvrir/fermer les groupes dans l'arborescence

**Files:**
- Modify: `src/client/components/_commons/CentreAide/ArborescenceCentreAide.tsx`

- [ ] **Step 1: Ajouter l'état expand/collapse et le chevron**

Réécrire `src/client/components/_commons/CentreAide/ArborescenceCentreAide.tsx` :

1. Ajouter un state `groupesOuverts` dans le composant `ArborescenceCentreAide` (pas dans `NoeudArbreItem` car l'état doit être partagé) :

```tsx
const [groupesOuverts, setGroupesOuverts] = useState<Set<string>>(() => {
  const tousLesGroupes = new Set<string>();
  const collecterGroupes = (noeuds: NoeudArbre[]) => {
    for (const noeud of noeuds) {
      if (noeud.type === "GROUPE") {
        tousLesGroupes.add(noeud.id);
        collecterGroupes(noeud.enfants);
      }
    }
  };
  collecterGroupes(arbre);
  return tousLesGroupes;
});

const toggleGroupe = (id: string) => {
  setGroupesOuverts((previous) => {
    const suivant = new Set(previous);
    if (suivant.has(id)) {
      suivant.delete(id);
    } else {
      suivant.add(id);
    }
    return suivant;
  });
};
```

2. Passer `groupesOuverts` et `toggleGroupe` en props à `NoeudArbreItem` :

```tsx
interface NoeudArbreProps {
  noeud: NoeudArbre;
  niveau: number;
  itemSelectionneId: string | null;
  onSelectionItem: (id: string) => void;
  estItemDesactive?: (noeud: NoeudArbre) => boolean;
  afficherStatut?: boolean;
  groupesOuverts: Set<string>;
  onToggleGroupe: (id: string) => void;
}
```

3. Dans `NoeudArbreItem`, pour les groupes, remplacer l'indicateur statique `▸/▹` par un bouton chevron cliquable à droite du nom :

```tsx
{estGroupe ? (
  <span className="text-gray-400 shrink-0 text-xs">
    {noeud.enfants.length > 0 ? "▸" : "▹"}
  </span>
) : (
  <span className="text-gray-400 shrink-0 text-xs">›</span>
)}
```

Remplacer par :

```tsx
{!estGroupe && (
  <span className="text-gray-400 shrink-0 text-xs">›</span>
)}
```

Et ajouter le chevron à droite du bouton (après `{afficherStatut && <BadgesStatut noeud={noeud} />}`) :

```tsx
{estGroupe && noeud.enfants.length > 0 && (
  <button
    className="ml-auto shrink-0 p-1 text-gray-400 hover:text-gray-600"
    onClick={(event) => {
      event.stopPropagation();
      onToggleGroupe(noeud.id);
    }}
    title={groupesOuverts.has(noeud.id) ? "Replier" : "Déplier"}
    type="button"
  >
    <span className={`text-xs transition-transform inline-block ${groupesOuverts.has(noeud.id) ? "rotate-90" : ""}`}>
      ▸
    </span>
  </button>
)}
```

4. Conditionner l'affichage des enfants sur `groupesOuverts` :

```tsx
// Avant
{estGroupe && noeud.enfants.length > 0 && (

// Après
{estGroupe && noeud.enfants.length > 0 && groupesOuverts.has(noeud.id) && (
```

- [ ] **Step 2: Vérifier visuellement**

- Tous les groupes sont ouverts par défaut
- Clic sur le chevron replie/déplie les enfants
- Clic sur le nom du groupe sélectionne toujours le groupe (comportement inchangé)

- [ ] **Step 3: Commit**

```bash
git add src/client/components/_commons/CentreAide/ArborescenceCentreAide.tsx
git commit -m "feat(centre-aide): expand/collapse groupes dans l'arborescence (PIL-1449)"
```

---

## Task 8: Réordonner et déplacer les articles (admin)

### Task 8a: Backend — use case et route tRPC

**Files:**
- Create: `src/server/parametrage-centre-aide/usecases/DeplacerArticleCentreAideUseCase.ts`
- Modify: `src/server/parametrage-centre-aide/domain/ports/ArticleCentreAideRepository.ts`
- Modify: `src/server/parametrage-centre-aide/infrastructure/adapters/PrismaArticleCentreAideRepository.ts`
- Modify: `src/server/parametrage-centre-aide/module.ts`
- Modify: `src/server/infrastructure/api/trpc/routes/parametrageCentreAide.ts`

- [ ] **Step 1: Ajouter la méthode `listerParParent` au repository**

Dans `src/server/parametrage-centre-aide/domain/ports/ArticleCentreAideRepository.ts`, ajouter :

```typescript
listerParParent(parentId: string | null): Promise<ArticleCentreAide[]>;
modifierOrdreEtParent(id: string, ordre: number, parentId: string | null): Promise<void>;
```

Dans `src/server/parametrage-centre-aide/infrastructure/adapters/PrismaArticleCentreAideRepository.ts`, implémenter :

```typescript
async listerParParent(parentId: string | null): Promise<ArticleCentreAide[]> {
  const articles = await this.prisma.article_centre_aide.findMany({
    where: { parent_id: parentId },
    orderBy: { ordre: "asc" },
  });
  return articles.map(convertirEnDomaine);
}

async modifierOrdreEtParent(id: string, ordre: number, parentId: string | null): Promise<void> {
  await this.prisma.article_centre_aide.update({
    where: { id },
    data: { ordre, parent_id: parentId },
  });
}
```

- [ ] **Step 2: Créer le use case DeplacerArticleCentreAideUseCase**

Créer `src/server/parametrage-centre-aide/usecases/DeplacerArticleCentreAideUseCase.ts` :

```typescript
import { ArticleCentreAideRepository } from "@/server/parametrage-centre-aide/domain/ports/ArticleCentreAideRepository";
import type { Inject } from "@/server/parametrage-centre-aide/module";

type ActionDeplacement = "monter" | "descendre" | "sortir" | "entrer";

export class DeplacerArticleCentreAideUseCase {
  private articleCentreAideRepository: ArticleCentreAideRepository;

  constructor({
    articleCentreAideRepository,
  }: Inject<"articleCentreAideRepository">) {
    this.articleCentreAideRepository = articleCentreAideRepository;
  }

  async execute({ id, action }: { id: string; action: ActionDeplacement }) {
    const article = await this.articleCentreAideRepository.recupererParId(id);
    if (!article) throw new Error("Article introuvable");

    const freres = await this.articleCentreAideRepository.listerParParent(
      article.parentId,
    );
    const index = freres.findIndex((frere) => frere.id === id);

    if (action === "monter") {
      if (index <= 0) return;
      const precedent = freres[index - 1];
      await this.articleCentreAideRepository.modifierOrdreEtParent(
        id,
        precedent.ordre,
        article.parentId,
      );
      await this.articleCentreAideRepository.modifierOrdreEtParent(
        precedent.id,
        article.ordre,
        precedent.parentId,
      );
    }

    if (action === "descendre") {
      if (index >= freres.length - 1) return;
      const suivant = freres[index + 1];
      await this.articleCentreAideRepository.modifierOrdreEtParent(
        id,
        suivant.ordre,
        article.parentId,
      );
      await this.articleCentreAideRepository.modifierOrdreEtParent(
        suivant.id,
        article.ordre,
        suivant.parentId,
      );
    }

    if (action === "sortir") {
      if (!article.parentId) return;
      const parent = await this.articleCentreAideRepository.recupererParId(
        article.parentId,
      );
      if (!parent) return;

      const freresParent =
        await this.articleCentreAideRepository.listerParParent(parent.parentId);
      const indexParent = freresParent.findIndex(
        (frere) => frere.id === parent.id,
      );
      const nouvelOrdre = indexParent + 1;

      // Décaler les frères du parent qui sont après l'index d'insertion
      for (const frere of freresParent) {
        if (frere.ordre >= nouvelOrdre && frere.id !== id) {
          await this.articleCentreAideRepository.modifierOrdreEtParent(
            frere.id,
            frere.ordre + 1,
            frere.parentId,
          );
        }
      }

      await this.articleCentreAideRepository.modifierOrdreEtParent(
        id,
        nouvelOrdre,
        parent.parentId,
      );

      // Recalculer les ordres des anciens frères
      const anciensFreres =
        await this.articleCentreAideRepository.listerParParent(
          article.parentId,
        );
      for (let indexFrere = 0; indexFrere < anciensFreres.length; indexFrere++) {
        await this.articleCentreAideRepository.modifierOrdreEtParent(
          anciensFreres[indexFrere].id,
          indexFrere,
          anciensFreres[indexFrere].parentId,
        );
      }
    }

    if (action === "entrer") {
      // Trouver le groupe voisin au-dessus
      const groupeVoisin = [...freres]
        .slice(0, index)
        .reverse()
        .find((frere) => frere.type === "GROUPE");
      if (!groupeVoisin) return;

      const enfantsGroupe =
        await this.articleCentreAideRepository.listerParParent(groupeVoisin.id);
      const nouvelOrdre = enfantsGroupe.length;

      await this.articleCentreAideRepository.modifierOrdreEtParent(
        id,
        nouvelOrdre,
        groupeVoisin.id,
      );

      // Recalculer les ordres des anciens frères
      const anciensFreres =
        await this.articleCentreAideRepository.listerParParent(
          article.parentId,
        );
      for (let indexFrere = 0; indexFrere < anciensFreres.length; indexFrere++) {
        await this.articleCentreAideRepository.modifierOrdreEtParent(
          anciensFreres[indexFrere].id,
          indexFrere,
          anciensFreres[indexFrere].parentId,
        );
      }
    }
  }
}
```

- [ ] **Step 3: Enregistrer dans le module DI**

Dans `src/server/parametrage-centre-aide/module.ts`, ajouter l'import et l'enregistrement :

```typescript
import { DeplacerArticleCentreAideUseCase } from "./usecases/DeplacerArticleCentreAideUseCase";
```

Ajouter au type `ParametrageCentreAideCradle` :

```typescript
deplacerArticleCentreAideUseCase: DeplacerArticleCentreAideUseCase;
```

Ajouter dans `register` :

```typescript
deplacerArticleCentreAideUseCase: asModuleClass(DeplacerArticleCentreAideUseCase),
```

- [ ] **Step 4: Ajouter la route tRPC**

Dans `src/server/infrastructure/api/trpc/routes/parametrageCentreAide.ts`, ajouter après `basculerVisibilite` :

```typescript
deplacer: procédureProtégée
  .input(
    z.object({
      id: z.string().uuid(),
      action: z.enum(["monter", "descendre", "sortir", "entrer"]),
    }),
  )
  .mutation(async ({ input, ctx }) => {
    vérifierAdmin(ctx.session.profil);

    return getContainer("parametrageCentreAide")
      .resolve("deplacerArticleCentreAideUseCase")
      .execute({ id: input.id, action: input.action });
  }),
```

- [ ] **Step 5: Commit**

```bash
git add src/server/parametrage-centre-aide/ src/server/infrastructure/api/trpc/routes/parametrageCentreAide.ts
git commit -m "feat(centre-aide): backend réordonnancement et déplacement articles (PIL-1449)"
```

### Task 8b: Frontend — boutons de réordonnancement dans l'arborescence admin

**Files:**
- Modify: `src/client/components/_commons/CentreAide/ArborescenceCentreAide.tsx`
- Modify: `src/client/components/PagePanelAdministrateur/PagePanelAdministrateurCentreAide/ArborescenceCentreAide.tsx`
- Modify: `src/client/components/PagePanelAdministrateur/PagePanelAdministrateurCentreAide/useEditionCentreAide.ts`

- [ ] **Step 1: Ajouter la mutation dans useEditionCentreAide**

Dans `src/client/components/PagePanelAdministrateur/PagePanelAdministrateurCentreAide/useEditionCentreAide.ts`, ajouter la mutation :

```typescript
const mutationDeplacer = api.parametrageCentreAide.deplacer.useMutation({
  onSuccess: () => {
    refetchListe();
    toast.success("Article déplacé", {
      duration: 3000,
      position: "top-right",
      richColors: true,
    });
  },
});

const deplacerArticle = useCallback(
  (id: string, action: "monter" | "descendre" | "sortir" | "entrer") => {
    mutationDeplacer.mutate({ id, action });
  },
  [mutationDeplacer],
);
```

Ajouter `deplacerArticle` au return.

- [ ] **Step 2: Ajouter un callback optionnel onDeplacer dans l'arborescence partagée**

Dans `src/client/components/_commons/CentreAide/ArborescenceCentreAide.tsx`, ajouter une prop optionnelle à `ArborescenceCentreAideProps` et `NoeudArbreProps` :

```typescript
onDeplacer?: (id: string, action: "monter" | "descendre" | "sortir" | "entrer") => void;
```

Dans `NoeudArbreItem`, si `onDeplacer` est fourni, afficher les boutons de déplacement au hover sur chaque noeud. Ajouter après le bouton chevron (ou après les badges statut) :

```tsx
{onDeplacer && (
  <div className="ml-auto shrink-0 flex gap-0.5 opacity-0 group-hover/noeud:opacity-100 transition-opacity">
    <button
      className="p-0.5 text-gray-400 hover:text-gray-600"
      onClick={(event) => { event.stopPropagation(); onDeplacer(noeud.id, "monter"); }}
      title="Monter"
      type="button"
    >
      <span className="text-xs">▲</span>
    </button>
    <button
      className="p-0.5 text-gray-400 hover:text-gray-600"
      onClick={(event) => { event.stopPropagation(); onDeplacer(noeud.id, "descendre"); }}
      title="Descendre"
      type="button"
    >
      <span className="text-xs">▼</span>
    </button>
    {noeud.parentId && (
      <button
        className="p-0.5 text-gray-400 hover:text-gray-600"
        onClick={(event) => { event.stopPropagation(); onDeplacer(noeud.id, "sortir"); }}
        title="Sortir du groupe"
        type="button"
      >
        <span className="text-xs">◀</span>
      </button>
    )}
    <button
      className="p-0.5 text-gray-400 hover:text-gray-600"
      onClick={(event) => { event.stopPropagation(); onDeplacer(noeud.id, "entrer"); }}
      title="Entrer dans le groupe voisin"
      type="button"
    >
      <span className="text-xs">▶</span>
    </button>
  </div>
)}
```

Ajouter `group/noeud` à la className du `<div>` racine de chaque noeud pour activer le hover group :

```tsx
<div className="group/noeud">
```

- [ ] **Step 3: Passer onDeplacer depuis l'admin**

Dans `src/client/components/PagePanelAdministrateur/PagePanelAdministrateurCentreAide/ArborescenceCentreAide.tsx` :

Ajouter la prop `onDeplacer` au composant et la passer à `ArborescenceCentreAide` :

```tsx
interface ArborescenceCentreAideAdminProps {
  // ... existing props
  onDeplacer: (id: string, action: "monter" | "descendre" | "sortir" | "entrer") => void;
}
```

```tsx
<ArborescenceCentreAide
  afficherStatut
  arbre={arbre}
  itemSelectionneId={itemSelectionneId}
  onDeplacer={onDeplacer}
  onSelectionItem={onSelectionItem}
/>
```

Dans `src/client/components/PagePanelAdministrateur/PagePanelAdministrateurCentreAide/PagePanelAdministrateurCentreAide.tsx`, extraire `deplacerArticle` du hook et le passer :

```tsx
<ArborescenceCentreAideAdmin
  arbre={arbre}
  itemSelectionneId={itemSelectionneId}
  onCreerGroupe={creerGroupe}
  onCreerPage={creerPage}
  onDeplacer={deplacerArticle}
  onSelectionItem={selectionnerItem}
/>
```

- [ ] **Step 4: Vérifier visuellement**

- Au hover sur un noeud admin, les boutons ▲▼◀▶ apparaissent
- Monter/descendre swap l'ordre avec le voisin
- Sortir déplace vers le parent
- Entrer déplace dans le groupe voisin au-dessus
- Pas de boutons visibles côté public

- [ ] **Step 5: Commit**

```bash
git add src/client/components/_commons/CentreAide/ArborescenceCentreAide.tsx src/client/components/PagePanelAdministrateur/PagePanelAdministrateurCentreAide/
git commit -m "feat(centre-aide): boutons réordonnancement articles dans arborescence admin (PIL-1449)"
```

---

## Task 9: Recherche dans l'arborescence

**Files:**
- Modify: `src/client/components/_commons/CentreAide/ArborescenceCentreAide.tsx`
- Modify: `src/client/components/_commons/CentreAide/types.ts`

- [ ] **Step 1: Ajouter la fonction de filtrage par recherche dans types.ts**

Dans `src/client/components/_commons/CentreAide/types.ts`, ajouter après `construireArbre` :

```typescript
export const filtrerArbreParRecherche = (
  noeuds: NoeudArbre[],
  recherche: string,
): NoeudArbre[] => {
  if (!recherche.trim()) return noeuds;

  const rechercheLower = recherche.toLowerCase();

  const filtrer = (noeuds: NoeudArbre[]): NoeudArbre[] => {
    return noeuds
      .map((noeud) => {
        const enfantsFiltres = filtrer(noeud.enfants);
        const correspondAuNom = noeud.titre
          .toLowerCase()
          .includes(rechercheLower);

        if (correspondAuNom || enfantsFiltres.length > 0) {
          return { ...noeud, enfants: enfantsFiltres };
        }
        return null;
      })
      .filter((noeud): noeud is NoeudArbre => noeud !== null);
  };

  return filtrer(noeuds);
};
```

- [ ] **Step 2: Ajouter le champ de recherche dans l'arborescence**

Dans `src/client/components/_commons/CentreAide/ArborescenceCentreAide.tsx`, ajouter un state de recherche et un input au-dessus de l'arbre :

```tsx
const [recherche, setRecherche] = useState("");

const arbreFiltreParRecherche = useMemo(
  () => filtrerArbreParRecherche(arbre, recherche),
  [arbre, recherche],
);
```

Ajouter l'import de `useState, useMemo` et `filtrerArbreParRecherche`.

Ajouter le champ de recherche dans le JSX, avant le `<div className="overflow-y-auto flex-1 py-2">` :

```tsx
<div className="px-3 pt-2 pb-1">
  <input
    className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
    onChange={(event) => setRecherche(event.target.value)}
    placeholder="Rechercher..."
    type="text"
    value={recherche}
  />
</div>
```

Utiliser `arbreFiltreParRecherche` au lieu de `arbre` dans le rendu des noeuds.

- [ ] **Step 3: Vérifier**

- Taper dans le champ filtre les noeuds par nom
- Les parents des résultats restent visibles
- Vider le champ restaure l'arborescence complète
- Fonctionne côté admin et public

- [ ] **Step 4: Commit**

```bash
git add src/client/components/_commons/CentreAide/ArborescenceCentreAide.tsx src/client/components/_commons/CentreAide/types.ts
git commit -m "feat(centre-aide): recherche textuelle dans l'arborescence (PIL-1449)"
```
