# PIL-1488 — LLM Préparation ouverture aux DP

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ouvrir l'accès à Ask AI au profil `EQUIPE_DIR_PROJET`, masquer les tuiles prototypes aux non-DITP_ADMIN, et faire évoluer les tuiles de scénarios dans `BoutonSyntheseTerritoire`.

**Architecture:** Changement purement front, localisé dans 3 fichiers (`BasePageAccueilLayout.tsx`, `PageAccueilLegacy.tsx`, `BoutonSyntheseTerritoire.tsx`). On extrait un petit hook `useAskAIAccess()` pour factoriser la règle d'accès, et on passe le profil à `BoutonSyntheseTerritoire` pour conditionner l'affichage des tuiles prototypes.

**Tech Stack:** React 18 + Next.js + NextAuth (`useSession`) + feature flag via `useEnv("NEXT_PUBLIC_FF_ASK_AI")` + `ProfilEnum` (`src/server/app/enum/profil.enum.ts`).

**Règle d'accès retenue (pivot du 2026-04-24) :** pilotage par 3 feature flips imbriqués pour permettre une ouverture progressive contrôlable en DB sans redeploy.

```
if (!ffAskAI) return false;                                           // master kill switch
if (ffAskAIDitpAdmin && profil === DITP_ADMIN) return true;
if (ffAskAIEquipeDirProjet && profil === EQUIPE_DIR_PROJET) return true;
return false;
```

Nouveaux FFs :
- `NEXT_PUBLIC_FF_ASK_AI` — master (existant, inchangé)
- `NEXT_PUBLIC_FF_ASK_AI_DITP_ADMIN` — ouverture au profil DITP_ADMIN
- `NEXT_PUBLIC_FF_ASK_AI_EQUIPE_DIR_PROJET` — ouverture au profil EQUIPE_DIR_PROJET

La logique de check par profil est isolée dans une fonction `profilAutoriseParFeatureFlip()` à l'intérieur de `useAskAIAccess.ts` : quand Ask AI sera ouvert à tout le monde, on supprime cette fonction et on garde juste `peutUtiliserAskAI = Boolean(ffAskAI)`.

---

## File Structure

- **Modify** `src/config.ts` — déclarer 2 nouveaux FFs (`askAIDitpAdmin`, `askAIEquipeDirProjet`).
- **Modify** `src/server/gestion-contenu/domain/VariableContenuDisponible.ts` — ajouter les 2 env keys dans l'interface et dans `FEATURE_FLIP_DEFINITIONS`.
- **Create** `src/client/components/PageAccueil/useAskAIAccess.ts` — hook qui retourne `{peutUtiliserAskAI, estDITPAdmin, profil}`.
- **Modify** `src/client/components/PageAccueil/BoutonSyntheseTerritoire.tsx` — accepte une prop `estDITPAdmin: boolean`, change la 1re tuile, ajoute la tuile chantier, conditionne les tuiles prototypes.
- **Modify** `src/client/components/PageAccueil/BasePageAccueilLayout.tsx:87-191` — utilise `useAskAIAccess()`.
- **Modify** `src/client/components/PageAccueil/PageAccueilLegacy.tsx:83-185` — utilise `useAskAIAccess()`.

---

## Task 1: Feature flips + hook `useAskAIAccess`

**Files:**
- Modify: `apps/pilote-ppg/src/config.ts`
- Modify: `apps/pilote-ppg/src/server/gestion-contenu/domain/VariableContenuDisponible.ts`
- Create: `apps/pilote-ppg/src/client/components/PageAccueil/useAskAIAccess.ts`

- [ ] **Step 1: Déclarer les 2 nouveaux FFs dans `config.ts`**

Juste après le bloc `askAI:` :

```typescript
askAIDitpAdmin: {
  format: Boolean,
  default: false,
  env: "NEXT_PUBLIC_FF_ASK_AI_DITP_ADMIN",
},
askAIEquipeDirProjet: {
  format: Boolean,
  default: false,
  env: "NEXT_PUBLIC_FF_ASK_AI_EQUIPE_DIR_PROJET",
},
```

- [ ] **Step 2: Exposer les FFs côté contenu dans `VariableContenuDisponible.ts`**

Ajouter dans l'interface `VARIABLE_CONTENU_DISPONIBLE` après la ligne `NEXT_PUBLIC_FF_ASK_AI` :

```typescript
NEXT_PUBLIC_FF_ASK_AI_DITP_ADMIN: boolean;
NEXT_PUBLIC_FF_ASK_AI_EQUIPE_DIR_PROJET: boolean;
```

Puis dans `FEATURE_FLIP_DEFINITIONS`, juste après l'entrée Ask AI :

```typescript
{
  envKey: "NEXT_PUBLIC_FF_ASK_AI_DITP_ADMIN",
  configKey: "askAIDitpAdmin",
  label: "Ask AI — ouverture DITP Admin",
},
{
  envKey: "NEXT_PUBLIC_FF_ASK_AI_EQUIPE_DIR_PROJET",
  configKey: "askAIEquipeDirProjet",
  label: "Ask AI — ouverture Équipe Direction de Projet",
},
```

- [ ] **Step 3: Créer le hook**

Le chemin réel de `useEnv` est `@/client/hooks/useEnv` (vérifié dans le repo).

```typescript
import { useSession } from "next-auth/react";
import { useEnv } from "@/client/hooks/useEnv";
import { ProfilEnum } from "@/server/app/enum/profil.enum";

function profilAutoriseParFeatureFlip(params: {
  profil: string | null;
  ffAskAIDitpAdmin: boolean;
  ffAskAIEquipeDirProjet: boolean;
}): boolean {
  if (params.ffAskAIDitpAdmin && params.profil === ProfilEnum.DITP_ADMIN) {
    return true;
  }
  if (
    params.ffAskAIEquipeDirProjet &&
    params.profil === ProfilEnum.EQUIPE_DIR_PROJET
  ) {
    return true;
  }
  return false;
}

export function useAskAIAccess() {
  const { data: session } = useSession();
  const ffAskAI = useEnv("NEXT_PUBLIC_FF_ASK_AI");
  const ffAskAIDitpAdmin = useEnv("NEXT_PUBLIC_FF_ASK_AI_DITP_ADMIN");
  const ffAskAIEquipeDirProjet = useEnv(
    "NEXT_PUBLIC_FF_ASK_AI_EQUIPE_DIR_PROJET",
  );

  const profil = session?.profil ?? null;

  const peutUtiliserAskAI =
    Boolean(ffAskAI) &&
    profilAutoriseParFeatureFlip({
      profil,
      ffAskAIDitpAdmin: Boolean(ffAskAIDitpAdmin),
      ffAskAIEquipeDirProjet: Boolean(ffAskAIEquipeDirProjet),
    });

  return {
    peutUtiliserAskAI,
    estDITPAdmin: profil === ProfilEnum.DITP_ADMIN,
    profil,
  };
}
```

- [ ] **Step 4: Lint**

Run: `cd apps/pilote-ppg && pnpm lint`
Expected: pas d'erreur.

- [ ] **Step 5: Commit**

```bash
git add apps/pilote-ppg/src/config.ts \
        apps/pilote-ppg/src/server/gestion-contenu/domain/VariableContenuDisponible.ts \
        apps/pilote-ppg/src/client/components/PageAccueil/useAskAIAccess.ts
git commit -m "feat(llm): FF Ask AI par profil + hook useAskAIAccess (PIL-1488)"
```

---

## Task 2: Brancher `BasePageAccueilLayout` sur le hook

**Files:**
- Modify: `apps/pilote-ppg/src/client/components/PageAccueil/BasePageAccueilLayout.tsx`

- [ ] **Step 1: Importer le hook**

Remplacer l'import et la déclaration actuels :

```typescript
// Avant (l.87)
const ffAskAI = useEnv("NEXT_PUBLIC_FF_ASK_AI");

// Après
import { useAskAIAccess } from "@/components/PageAccueil/useAskAIAccess";
// ...
const { peutUtiliserAskAI, estDITPAdmin } = useAskAIAccess();
```

Supprimer la ligne `const ffAskAI = useEnv("NEXT_PUBLIC_FF_ASK_AI");` à la l.87.

- [ ] **Step 2: Mettre à jour le rendu du bouton**

```tsx
// Avant (l.191-193)
{ffAskAI || session?.profil === ProfilEnum.DITP_ADMIN ? (
  <BoutonSyntheseTerritoire
    territoireCode={territoireCode}
    jalon={jalon}
  />
) : null}

// Après
{peutUtiliserAskAI ? (
  <BoutonSyntheseTerritoire
    territoireCode={territoireCode}
    jalon={jalon}
    estDITPAdmin={estDITPAdmin}
  />
) : null}
```

- [ ] **Step 3: Nettoyer l'import `ProfilEnum` s'il n'est plus utilisé**

Run: `grep -n "ProfilEnum" apps/pilote-ppg/src/client/components/PageAccueil/BasePageAccueilLayout.tsx`
Expected: si plus aucune occurrence, retirer `ProfilEnum` de la ligne d'import correspondante. Sinon laisser.

- [ ] **Step 4: Lint + typecheck**

Run: `cd apps/pilote-ppg && pnpm lint`
Expected: pas d'erreur.

- [ ] **Step 5: Commit**

```bash
git add apps/pilote-ppg/src/client/components/PageAccueil/BasePageAccueilLayout.tsx
git commit -m "feat(llm): BasePageAccueilLayout utilise useAskAIAccess (PIL-1488)"
```

---

## Task 3: Brancher `PageAccueilLegacy` sur le hook

**Files:**
- Modify: `apps/pilote-ppg/src/client/components/PageAccueil/PageAccueilLegacy.tsx`

- [ ] **Step 1: Même substitution qu'à Task 2**

```typescript
// Remplace (l.83)
const ffAskAI = useEnv("NEXT_PUBLIC_FF_ASK_AI");
// par
import { useAskAIAccess } from "@/components/PageAccueil/useAskAIAccess";
// ...
const { peutUtiliserAskAI, estDITPAdmin } = useAskAIAccess();
```

```tsx
// Remplace (l.183-185)
{ffAskAI || session?.profil === ProfilEnum.DITP_ADMIN ? (
  <BoutonSyntheseTerritoire ... />
) : null}
// par
{peutUtiliserAskAI ? (
  <BoutonSyntheseTerritoire
    territoireCode={territoireCode}
    jalon={jalon}
    estDITPAdmin={estDITPAdmin}
  />
) : null}
```

- [ ] **Step 2: Lint**

Run: `cd apps/pilote-ppg && pnpm lint`
Expected: pas d'erreur.

- [ ] **Step 3: Commit**

```bash
git add apps/pilote-ppg/src/client/components/PageAccueil/PageAccueilLegacy.tsx
git commit -m "feat(llm): PageAccueilLegacy utilise useAskAIAccess (PIL-1488)"
```

---

## Task 4: Mise à jour des tuiles dans `BoutonSyntheseTerritoire`

**Files:**
- Modify: `apps/pilote-ppg/src/client/components/PageAccueil/BoutonSyntheseTerritoire.tsx`

- [ ] **Step 1: Ajouter la prop `estDITPAdmin`**

```typescript
export const BoutonSyntheseTerritoire = ({
  territoireCode,
  jalon,
  estDITPAdmin,
}: {
  territoireCode: string;
  jalon: number;
  estDITPAdmin: boolean;
}) => {
```

- [ ] **Step 2: Réécrire la 1re tuile "Synthèse d'un territoire"**

Dans le groupe `Synthèse`, remplacer l'entrée actuelle :

```typescript
// Avant
{
  label: `Synthèse de ${territoire.nomAffiché}`,
  message: `Fais moi la synthèse de ${territoire.nomAffiché}`,
  mode: "send",
},

// Après
{
  label: "Synthèse d'un territoire",
  message: "Fais moi la synthèse du territoire ",
  mode: "fill",
},
```

La tuile conditionnelle « Synthèse de X et ses départements » (si `estRegion`) reste inchangée.

- [ ] **Step 3: Ajouter la tuile "Synthèse d'un chantier sur un territoire"**

Insérer dans le groupe `Synthèse`, juste après la 1re tuile :

```typescript
{
  label: "Synthèse d'un chantier sur un territoire",
  message: `Fais moi la synthèse du chantier CH-XXX sur ${territoire.nomAffiché}`,
  mode: "fill",
},
```

- [ ] **Step 4: Conditionner les tuiles prototypes sur `estDITPAdmin`**

Remplacer les deux entrées "Rapport complet (Markdown)" et "Tableau de bord du territoire" par un spread conditionnel :

```typescript
// Dans le groupe Synthèse, après les tuiles "Synthèse d'un territoire",
// "Synthèse d'un chantier sur un territoire", la région+départements (conditionnelle),
// "Chantiers en retard et leurs indicateurs" :

...(estDITPAdmin
  ? [
      {
        label: "Rapport complet (Markdown)",
        message: `Crée un rapport de synthèse du territoire ${territoire.nomAffiché} incluant le taux d'avancement, les chantiers en retard, les chantiers en difficulté et leurs indicateurs. Format Markdown`,
        mode: "send" as const,
      },
      {
        label: "Tableau de bord du territoire",
        message: `Compose un tableau de bord pour ${territoire.nomAffiché}. Commence par une première section contenant le taux d'avancement du territoire, le nombre de chantiers en retard, le nombre de chantiers en difficulté et la cartographie du taux d'avancement. Ensuite, récupère la liste des chantiers en difficulté et en retard sur ce territoire, et pour chacun, ajoute une section dédiée avec un titre reprenant le nom du chantier, la météo et le commentaire de synthèse, la cartographie météo en pleine largeur et le tableau de ses indicateurs.`,
        mode: "send" as const,
      },
    ]
  : []),
```

- [ ] **Step 5: Vérifier l'ordre final des tuiles du groupe Synthèse**

Ordre attendu après modifs :
1. `Synthèse d'un territoire` (fill)
2. `Synthèse d'un chantier sur un territoire` (fill, **nouveau**)
3. `Synthèse de {region} et ses départements` (send, uniquement si `estRegion`)
4. `Chantiers en retard et leurs indicateurs` (send)
5. `Rapport complet (Markdown)` (send, **uniquement DITP_ADMIN**)
6. `Tableau de bord du territoire` (send, **uniquement DITP_ADMIN**)

Le groupe `Comparaison` reste inchangé.

- [ ] **Step 6: Lint**

Run: `cd apps/pilote-ppg && pnpm lint`
Expected: pas d'erreur.

- [ ] **Step 7: Test manuel front (dev server)**

Run: `cd apps/pilote-ppg && pnpm dev`
Scénarios à vérifier en naviguant sur une page accueil territoire :

1. Connecté DITP_ADMIN : bouton visible, 6 tuiles du groupe Synthèse (cf. Step 5) + Comparaison.
2. Connecté EQUIPE_DIR_PROJET : bouton visible, 4 tuiles du groupe Synthèse (sans Rapport complet ni Tableau de bord) + Comparaison.
3. Connecté autre profil, `NEXT_PUBLIC_FF_ASK_AI=false` : bouton **non visible**.
4. Connecté autre profil, `NEXT_PUBLIC_FF_ASK_AI=true` : bouton visible, mêmes tuiles que EQUIPE_DIR_PROJET (pas de Rapport / Tableau).
5. Sur un département : la tuile "Synthèse de X et ses départements" n'apparaît pas.
6. Clic sur "Synthèse d'un territoire" : input pré-rempli avec `Fais moi la synthèse du territoire ` (espace final, curseur au bout). Clic sur "Synthèse d'un chantier sur un territoire" : input pré-rempli avec `Fais moi la synthèse du chantier CH-XXX sur <territoire>`.

- [ ] **Step 8: Commit**

```bash
git add apps/pilote-ppg/src/client/components/PageAccueil/BoutonSyntheseTerritoire.tsx
git commit -m "feat(llm): ajuste les tuiles scénarios pour l'ouverture aux DP (PIL-1488)"
```

---

## Task 5: Vérification finale

- [ ] **Step 1: Lint complet**

Run: `cd apps/pilote-ppg && pnpm lint`
Expected: 0 erreur.

- [ ] **Step 2: Typecheck**

Run: `cd apps/pilote-ppg && pnpm tsc --noEmit`
Expected: 0 erreur.

- [ ] **Step 3: Grep final**

Run: `grep -rn "ProfilEnum.DITP_ADMIN\b" apps/pilote-ppg/src/client/components/PageAccueil/`
Expected: plus aucune occurrence liée au gate Ask AI (les checks sont désormais dans `useAskAIAccess.ts`).

Run: `grep -rn "NEXT_PUBLIC_FF_ASK_AI" apps/pilote-ppg/src/client/components/PageAccueil/`
Expected: uniquement dans `useAskAIAccess.ts`.

- [ ] **Step 4: Push**

```bash
git push -u origin PIL-1488-llm-preparation-ouverture-aux-dp
```

---

## Notes

- Pas de test unitaire front ajouté : le changement est de la plomberie de rendu conditionnel. Les chemins sensibles (règle d'accès) sont centralisés dans `useAskAIAccess`, et pourront être testés unitairement si un besoin émerge (mock de `useSession` + `useEnv`).
- La règle métier est intentionnellement centralisée dans `PROFILS_ASK_AI_PRIVILEGIES`. Ajouter un profil supplémentaire à l'avenir = éditer cette constante uniquement.
