# Module de feedback utilisateur Albert — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enrichir le module de feedback de l'assistant Albert : commentaire optionnel sur le feedback positif (nouvelle modale), catégories de problème multi-sélectionnables sur le feedback négatif, et exploitation de ces données côté admin (affichage + filtres).

**Architecture:** Ajout d'un enum Prisma `llm_call_categorie_probleme` + colonne array `categories_probleme` sur `llm_calls`. La mutation tRPC `albert.evaluer` (discriminatedUnion existante) évolue pour porter commentaire optionnel (positif) et catégories + commentaire optionnel (négatif). Le front ChatUI gagne une modale positive et une refonte de la modale négative. Le panel admin affiche les catégories et permet de filtrer dessus.

**Tech Stack:** Next.js 14, React 18, TypeScript, tRPC, Prisma 6 (PostgreSQL multi-schema), Zod, react-hook-form, radix-ui, Tailwind + DSFR, Jest (tests d'intégration backend).

**Convention de tests :** TDD sur le backend (use cases + queries, tests d'intégration). **Pas de tests automatisés sur le front** (préférence projet). **Ne jamais lancer les tests soi-même : c'est l'utilisateur qui les lance.** Les étapes « run test » du plan décrivent la commande et le résultat attendu pour que l'utilisateur les exécute.

---

## File Structure

**Backend :**
- `src/database/prisma/schema.prisma` — ajout enum + colonne (modifier)
- `src/database/prisma/migrations/<timestamp>_add_categories_probleme_llm_calls/migration.sql` — migration (créer)
- `src/server/albert/usecases/EvaluerChatUseCase.ts` — ajout `categories` (modifier)
- `src/server/albert/__tests__/usecases/EvaluerChatUseCase.integration.test.ts` — tests use case (créer)
- `src/server/infrastructure/api/trpc/routes/albert.ts` — schéma mutation `evaluer` (modifier)
- `src/server/albert/queries/RecupererConversationAdminQuery.ts` — exposer `categoriesProbleme` (modifier)
- `src/server/albert/queries/ListerConversationsAdminQuery.ts` — filtre `categories` (modifier)
- `src/server/albert/__tests__/queries/RecupererConversationAdminQuery.integration.test.ts` — test (modifier)
- `src/server/albert/__tests__/queries/ListerConversationsAdminQuery.integration.test.ts` — test (modifier)

**Front utilisateur (`src/client/components/_commons/ChatUI/`) :**
- `feedbackCategories.ts` — constantes catégories (libellés, sous-titres, icônes) (créer)
- `FeedbackCategorieCard.tsx` — carte sélectionnable (créer)
- `FeedbackPositiveModale.tsx` — modale positive (créer)
- `FeedbackNegatifModale.tsx` — refonte (modifier)
- `FeedbackBar.tsx` — câblage des deux modales (modifier)

**Front admin (`src/client/components/PagePanelAdministrateur/Albert/`) :**
- `ConversationTranscript.tsx` — badges catégories (modifier)
- `AlbertDashboardFilters.tsx` — filtre catégories (modifier)
- `AlbertDashboard.tsx` — passage du filtre `categories` à la query (modifier)

---

## Task 1 : Modèle de données (enum + colonne)

**Files:**
- Modify: `src/database/prisma/schema.prisma` (enum après `llm_call_evaluation` ~ligne 805, et model `llm_calls` ~ligne 807-823)
- Create: `src/database/prisma/migrations/<timestamp>_add_categories_probleme_llm_calls/migration.sql`

- [ ] **Step 1 : Ajouter l'enum dans `schema.prisma`**

Juste après le bloc `enum llm_call_evaluation { ... }` (vers la ligne 805), ajouter :

```prisma
enum llm_call_categorie_probleme {
  PROBLEME_TECHNIQUE
  INCOMPREHENSION
  SUGGESTION
  AUTRE

  @@schema("public")
}
```

- [ ] **Step 2 : Ajouter la colonne sur le model `llm_calls`**

Dans `model llm_calls`, après la ligne `commentaire    String?` (~ligne 816), ajouter :

```prisma
  categories_probleme llm_call_categorie_probleme[] @default([])
```

- [ ] **Step 3 : Générer la migration**

Run : `pnpm database:migration` (alias de `prisma migrate dev`). Quand le nom est demandé, saisir : `add_categories_probleme_llm_calls`.

Résultat attendu : un dossier `src/database/prisma/migrations/<timestamp>_add_categories_probleme_llm_calls/migration.sql` est créé, et le client Prisma est régénéré (`$Enums.llm_call_categorie_probleme` devient disponible).

Le contenu de la migration doit ressembler à :

```sql
-- CreateEnum
CREATE TYPE "public"."llm_call_categorie_probleme" AS ENUM ('PROBLEME_TECHNIQUE', 'INCOMPREHENSION', 'SUGGESTION', 'AUTRE');

-- AlterTable
ALTER TABLE "public"."llm_calls" ADD COLUMN "categories_probleme" "public"."llm_call_categorie_probleme"[] DEFAULT ARRAY[]::"public"."llm_call_categorie_probleme"[];
```

- [ ] **Step 4 : Vérifier la compilation des types**

Run : `pnpm lint` (ou au minimum `pnpm tsc --noEmit` si dispo).
Expected : pas de nouvelle erreur de type liée au schéma.

- [ ] **Step 5 : Commit**

```bash
git add src/database/prisma/schema.prisma src/database/prisma/migrations
git commit -m "[DITP-pilotage/pilote-2] feature(PIL-1549): ajout enum et colonne categories_probleme sur llm_calls"
```

---

## Task 2 : Use case `EvaluerChatUseCase` + mutation tRPC

**Files:**
- Create: `src/server/albert/__tests__/usecases/EvaluerChatUseCase.integration.test.ts`
- Modify: `src/server/albert/usecases/EvaluerChatUseCase.ts`
- Modify: `src/server/infrastructure/api/trpc/routes/albert.ts:90-115`

- [ ] **Step 1 : Écrire le test d'intégration du use case**

Créer `src/server/albert/__tests__/usecases/EvaluerChatUseCase.integration.test.ts` :

```ts
import { randomUUID } from "node:crypto";
import { createIntegrationTest } from "@/server/infrastructure/test/createIntegrationTest";
import { fixtures } from "@/server/infrastructure/test/fixtures";
import { PrismaPilote } from "@/server/db/PrismaPilote";
import { EvaluerChatUseCase } from "@/server/albert/usecases/EvaluerChatUseCase";

describe("EvaluerChatUseCase", () => {
  const prismaPilote = new PrismaPilote();
  const buildUseCase = () => new EvaluerChatUseCase({ prisma: prismaPilote });

  it(
    "enregistre une évaluation négative avec catégories et commentaire sur le dernier tour",
    createIntegrationTest(async (tx) => {
      // Given
      const utilisateur = await fixtures.utilisateur({});
      const chatId = randomUUID();
      await tx.llm_calls.create({
        data: {
          chat_id: chatId,
          utilisateur_id: utilisateur.id,
          transcript: {},
          model: "openweight-large",
        },
      });

      // When
      await buildUseCase().execute({
        chatId,
        evaluation: "NEGATIVE",
        categories: ["PROBLEME_TECHNIQUE", "AUTRE"],
        commentaire: "ça plante",
      });

      // Then
      const ligne = await tx.llm_calls.findFirst({ where: { chat_id: chatId } });
      expect(ligne).toEqual(
        expect.objectContaining({
          evaluation: "NEGATIVE",
          commentaire: "ça plante",
          categories_probleme: ["PROBLEME_TECHNIQUE", "AUTRE"],
        }),
      );
    }),
  );

  it(
    "enregistre une évaluation positive avec commentaire et sans catégorie",
    createIntegrationTest(async (tx) => {
      // Given
      const utilisateur = await fixtures.utilisateur({});
      const chatId = randomUUID();
      await tx.llm_calls.create({
        data: {
          chat_id: chatId,
          utilisateur_id: utilisateur.id,
          transcript: {},
          model: "openweight-large",
        },
      });

      // When
      await buildUseCase().execute({
        chatId,
        evaluation: "POSITIVE",
        commentaire: "très clair",
      });

      // Then
      const ligne = await tx.llm_calls.findFirst({ where: { chat_id: chatId } });
      expect(ligne).toEqual(
        expect.objectContaining({
          evaluation: "POSITIVE",
          commentaire: "très clair",
          categories_probleme: [],
        }),
      );
    }),
  );
});
```

- [ ] **Step 2 : Lancer le test (par l'utilisateur) pour vérifier qu'il échoue**

Run : `pnpm test:server -- EvaluerChatUseCase`
Expected : ÉCHEC (le use case n'accepte pas encore `categories`).

- [ ] **Step 3 : Modifier le use case**

Remplacer le contenu de `src/server/albert/usecases/EvaluerChatUseCase.ts` par :

```ts
import { $Enums } from "@prisma/client";
import { PrismaPilote } from "@/server/db/PrismaPilote";
import type { Inject } from "@/server/albert/module";

export class EvaluerChatUseCase {
  private readonly prisma: PrismaPilote;

  constructor({ prisma }: Inject<"prisma">) {
    this.prisma = prisma;
  }

  async execute({
    chatId,
    evaluation,
    commentaire,
    categories,
  }: {
    chatId: string;
    evaluation: $Enums.llm_call_evaluation;
    commentaire?: string;
    categories?: $Enums.llm_call_categorie_probleme[];
  }) {
    const dernierTour = await this.prisma.getInstance().llm_calls.findFirst({
      where: { chat_id: chatId },
      orderBy: { created_at: "desc" },
      select: { id: true },
    });

    if (!dernierTour) return;

    await this.prisma.getInstance().llm_calls.update({
      where: { id: dernierTour.id },
      data: {
        evaluation,
        commentaire,
        categories_probleme: categories ?? [],
      },
    });
  }
}
```

- [ ] **Step 4 : Lancer le test (par l'utilisateur) pour vérifier qu'il passe**

Run : `pnpm test:server -- EvaluerChatUseCase`
Expected : SUCCÈS (2 tests).

- [ ] **Step 5 : Mettre à jour le schéma de la mutation tRPC**

Dans `src/server/infrastructure/api/trpc/routes/albert.ts`, remplacer le bloc `evaluer` (lignes ~90-115) par :

```ts
  evaluer: procédureProtégée
    .input(
      z.discriminatedUnion("evaluation", [
        z.object({
          chatId: z.string().min(1),
          evaluation: z.literal($Enums.llm_call_evaluation.POSITIVE),
          commentaire: z.string().trim().min(1).optional(),
        }),
        z
          .object({
            chatId: z.string().min(1),
            evaluation: z.literal($Enums.llm_call_evaluation.NEGATIVE),
            categories: z
              .array(z.nativeEnum($Enums.llm_call_categorie_probleme))
              .min(1),
            commentaire: z.string().trim().min(1).optional(),
          })
          .refine(
            (data) =>
              !data.categories.includes(
                $Enums.llm_call_categorie_probleme.AUTRE,
              ) || !!data.commentaire,
            {
              message:
                "Un commentaire est obligatoire lorsque la catégorie « Autre » est sélectionnée",
              path: ["commentaire"],
            },
          ),
      ]),
    )
    .mutation(async ({ input }) => {
      const container = getContainer("albert");
      const evaluerChatUseCase = container.resolve("evaluerChatUseCase");
      await evaluerChatUseCase.execute({
        chatId: input.chatId,
        evaluation: input.evaluation,
        commentaire: input.commentaire,
        categories:
          input.evaluation === $Enums.llm_call_evaluation.NEGATIVE
            ? input.categories
            : undefined,
      });
    }),
```

- [ ] **Step 6 : Vérifier le lint/types**

Run : `pnpm lint`
Expected : pas d'erreur.

- [ ] **Step 7 : Commit**

```bash
git add src/server/albert/usecases/EvaluerChatUseCase.ts src/server/albert/__tests__/usecases/EvaluerChatUseCase.integration.test.ts src/server/infrastructure/api/trpc/routes/albert.ts
git commit -m "[DITP-pilotage/pilote-2] feature(PIL-1549): evaluer porte les categories et le commentaire positif"
```

---

## Task 3 : Queries admin (détail + filtre)

**Files:**
- Modify: `src/server/albert/queries/RecupererConversationAdminQuery.ts`
- Modify: `src/server/albert/queries/ListerConversationsAdminQuery.ts`
- Modify: `src/server/albert/__tests__/queries/RecupererConversationAdminQuery.integration.test.ts`
- Modify: `src/server/albert/__tests__/queries/ListerConversationsAdminQuery.integration.test.ts`
- Modify: `src/server/infrastructure/api/trpc/routes/albert.ts` (input `listerToutes`)

### 3a. RecupererConversationAdminQuery : exposer les catégories

- [ ] **Step 1 : Écrire le test (détail expose categoriesProbleme)**

Dans `src/server/albert/__tests__/queries/RecupererConversationAdminQuery.integration.test.ts`, ajouter un test (adapter le `describe`/`buildQuery` existant) :

```ts
  it(
    "expose les categories_probleme du dernier tour",
    createIntegrationTest(async (tx) => {
      // Given
      const utilisateur = await fixtures.utilisateur({});
      const idConv = randomUUID();
      await tx.chat_conversation.create({
        data: {
          id: idConv,
          utilisateur_id: utilisateur.id,
          titre: "Conv",
          messages: [],
        },
      });
      await tx.llm_calls.create({
        data: {
          chat_id: idConv,
          utilisateur_id: utilisateur.id,
          transcript: {},
          model: "openweight-large",
          evaluation: "NEGATIVE",
          commentaire: "bof",
          categories_probleme: ["INCOMPREHENSION", "SUGGESTION"],
        },
      });

      // When
      const detail = await buildQuery().run({ id: idConv });

      // Then
      expect(detail?.llmCalls).toEqual([
        expect.objectContaining({
          evaluation: "NEGATIVE",
          commentaire: "bof",
          categoriesProbleme: ["INCOMPREHENSION", "SUGGESTION"],
        }),
      ]);
    }),
  );
```

- [ ] **Step 2 : Lancer le test (par l'utilisateur)**

Run : `pnpm test:server -- RecupererConversationAdminQuery`
Expected : ÉCHEC (champ `categoriesProbleme` absent).

- [ ] **Step 3 : Modifier la query**

Dans `src/server/albert/queries/RecupererConversationAdminQuery.ts` :

1. Type `ConversationAdminDetail.llmCalls[]` : ajouter le champ
```ts
    categoriesProbleme: $Enums.llm_call_categorie_probleme[];
```
2. Type `LigneLlmCall` : ajouter
```ts
  categories_probleme: $Enums.llm_call_categorie_probleme[];
```
3. Requête SQL des llm_calls : remplacer `SELECT id, evaluation, commentaire, created_at` par
```ts
      SELECT id, evaluation, commentaire, categories_probleme, created_at
```
4. Mapping `llmCalls`: ajouter
```ts
        categoriesProbleme: row.categories_probleme,
```

- [ ] **Step 4 : Lancer le test (par l'utilisateur)**

Run : `pnpm test:server -- RecupererConversationAdminQuery`
Expected : SUCCÈS.

### 3b. ListerConversationsAdminQuery : filtre par catégorie

- [ ] **Step 5 : Écrire le test du filtre**

Dans `src/server/albert/__tests__/queries/ListerConversationsAdminQuery.integration.test.ts`, ajouter :

```ts
  it(
    "filtre par categories : ne garde que les conversations dont un tour a une des categories demandées",
    createIntegrationTest(async (tx) => {
      // Given
      const utilisateur = await fixtures.utilisateur({});
      const idAvec = randomUUID();
      const idSans = randomUUID();
      await tx.chat_conversation.createMany({
        data: [
          { id: idAvec, utilisateur_id: utilisateur.id, titre: "avec", messages: [] },
          { id: idSans, utilisateur_id: utilisateur.id, titre: "sans", messages: [] },
        ],
      });
      await tx.llm_calls.createMany({
        data: [
          {
            chat_id: idAvec,
            utilisateur_id: utilisateur.id,
            transcript: {},
            model: "openweight-large",
            evaluation: "NEGATIVE",
            categories_probleme: ["PROBLEME_TECHNIQUE"],
          },
          {
            chat_id: idSans,
            utilisateur_id: utilisateur.id,
            transcript: {},
            model: "openweight-large",
            evaluation: "NEGATIVE",
            categories_probleme: ["SUGGESTION"],
          },
        ],
      });

      // When
      const result = await buildQuery().run({
        categories: ["PROBLEME_TECHNIQUE"],
        tri: { champ: "updatedAt", direction: "desc" },
        page: 1,
        taillePage: 25,
      });

      // Then
      expect(result.total).toEqual(1);
      expect(result.items).toEqual([expect.objectContaining({ id: idAvec })]);
    }),
  );
```

- [ ] **Step 6 : Lancer le test (par l'utilisateur)**

Run : `pnpm test:server -- ListerConversationsAdminQuery`
Expected : ÉCHEC (paramètre `categories` inconnu).

- [ ] **Step 7 : Modifier la query**

Dans `src/server/albert/queries/ListerConversationsAdminQuery.ts` :

1. Importer l'enum en tête : `import { $Enums, Prisma } from "@prisma/client";`
2. Type `ListerConversationsAdminParams` : ajouter
```ts
  categories?: $Enums.llm_call_categorie_probleme[];
```
3. Avant le `$queryRaw`, calculer le tableau (null si vide) :
```ts
    const categoriesArray =
      params.categories && params.categories.length > 0
        ? params.categories
        : null;
```
4. Dans le `WHERE` final (après la condition `avecCommentaire`), ajouter une condition d'existence avec overlap. On ne touche **pas** au CTE `compteurs` : on filtre via un `EXISTS` sur `llm_calls`, en castant la colonne enum en `text[]` pour la comparer au tableau de strings sérialisé par `Prisma.sql` :
```ts
        AND (
          ${categoriesArray}::text[] IS NULL
          OR EXISTS (
            SELECT 1 FROM llm_calls lc2
            WHERE lc2.chat_id = b.id::text
              AND lc2.categories_probleme::text[] && ${categoriesArray}::text[]
          )
        )
```

> Note : `categories_probleme::text[]` caste l'array d'enum en `text[]` ; l'opérateur d'overlap `&&` compare alors deux `text[]`, ce qui matche car les valeurs d'enum partagent leur représentation textuelle. Cette approche évite toute modification du CTE `compteurs` et tout risque de mismatch de type enum/text.

- [ ] **Step 8 : Lancer le test (par l'utilisateur)**

Run : `pnpm test:server -- ListerConversationsAdminQuery`
Expected : SUCCÈS (anciens tests + nouveau).

- [ ] **Step 9 : Brancher le filtre dans la route tRPC**

Dans `src/server/infrastructure/api/trpc/routes/albert.ts`, dans l'input de `listerToutes`, ajouter après `avecCommentaire` :
```ts
        categories: z
          .array(z.nativeEnum($Enums.llm_call_categorie_probleme))
          .optional(),
```
et dans l'appel `query.run({ ... })`, ajouter :
```ts
        categories: input.categories,
```

- [ ] **Step 10 : Vérifier lint/types**

Run : `pnpm lint`
Expected : pas d'erreur.

- [ ] **Step 11 : Commit**

```bash
git add src/server/albert/queries src/server/albert/__tests__/queries src/server/infrastructure/api/trpc/routes/albert.ts
git commit -m "[DITP-pilotage/pilote-2] feature(PIL-1549): expose et filtre les categories de probleme cote admin"
```

---

## Task 4 : Front utilisateur (ChatUI)

**Files:**
- Create: `src/client/components/_commons/ChatUI/feedbackCategories.ts`
- Create: `src/client/components/_commons/ChatUI/FeedbackCategorieCard.tsx`
- Create: `src/client/components/_commons/ChatUI/FeedbackPositiveModale.tsx`
- Modify: `src/client/components/_commons/ChatUI/FeedbackNegatifModale.tsx`
- Modify: `src/client/components/_commons/ChatUI/FeedbackBar.tsx`

> Rappel : pas de test automatisé sur le front. Validation visuelle/manuelle.

- [ ] **Step 1 : Créer les constantes de catégories**

Créer `src/client/components/_commons/ChatUI/feedbackCategories.ts` :

```ts
import { ComponentType } from "react";
import { $Enums } from "@prisma/client";
import { ErrorWarningIcon } from "@/components/_commons/Icones/ErrorWarningIcon";
import { QuestionIcon } from "@/components/_commons/Icones/QuestionIcon";
import { LightbulbIcon } from "@/components/_commons/Icones/LightbulbIcon";
import { Chat2Icon } from "@/components/_commons/Icones/Chat2Icon";

export type FeedbackCategorie = {
  valeur: $Enums.llm_call_categorie_probleme;
  titre: string;
  sousTitre: string;
  icone: ComponentType<{ className?: string; fill?: string }>;
  couleurIcone: string;
};

export const FEEDBACK_CATEGORIES: FeedbackCategorie[] = [
  {
    valeur: $Enums.llm_call_categorie_probleme.PROBLEME_TECHNIQUE,
    titre: "Problème technique",
    sousTitre: "Erreur ou bug",
    icone: ErrorWarningIcon,
    couleurIcone: "text-dsfr-error-425",
  },
  {
    valeur: $Enums.llm_call_categorie_probleme.INCOMPREHENSION,
    titre: "Incompréhension",
    sousTitre: "Réponse pas claire",
    icone: QuestionIcon,
    couleurIcone: "text-dsfr-blue-france-sun-113",
  },
  {
    valeur: $Enums.llm_call_categorie_probleme.SUGGESTION,
    titre: "Suggestion",
    sousTitre: "Idée d'amélioration",
    icone: LightbulbIcon,
    couleurIcone: "text-dsfr-success-425",
  },
  {
    valeur: $Enums.llm_call_categorie_probleme.AUTRE,
    titre: "Autre",
    sousTitre: "Autre problème",
    icone: Chat2Icon,
    couleurIcone: "text-dsfr-grey-200",
  },
];

export const LIBELLES_CATEGORIES: Record<
  $Enums.llm_call_categorie_probleme,
  string
> = {
  PROBLEME_TECHNIQUE: "Problème technique",
  INCOMPREHENSION: "Incompréhension",
  SUGGESTION: "Suggestion",
  AUTRE: "Autre",
};
```

> Avant d'écrire ce fichier, vérifier que `QuestionIcon`, `LightbulbIcon`, `Chat2Icon` exposent bien des props `{ className?, fill? }` (ouvrir un des fichiers `Icones/QuestionIcon.tsx`). Si la signature diffère, aligner le type `icone` en conséquence.

- [ ] **Step 2 : Créer la carte de catégorie**

Créer `src/client/components/_commons/ChatUI/FeedbackCategorieCard.tsx` :

```tsx
import { FeedbackCategorie } from "@/components/_commons/ChatUI/feedbackCategories";
import { clsxm } from "@/utils/clsxm";

export const FeedbackCategorieCard = ({
  categorie,
  selectionnee,
  onToggle,
}: {
  categorie: FeedbackCategorie;
  selectionnee: boolean;
  onToggle: () => void;
}) => {
  const Icone = categorie.icone;
  return (
    <button
      aria-pressed={selectionnee}
      className={clsxm(
        "flex items-start gap-3 rounded-md border p-4 text-left transition-colors",
        selectionnee
          ? "border-dsfr-blue-france-sun-113 bg-dsfr-blue-france-975"
          : "border-gray-300 hover:bg-gray-50",
      )}
      onClick={onToggle}
      type="button"
    >
      <Icone className={clsxm("w-5 h-5 shrink-0", categorie.couleurIcone)} />
      <span className="flex flex-col">
        <span className="font-medium text-gray-900">{categorie.titre}</span>
        <span className="text-sm text-gray-500">{categorie.sousTitre}</span>
      </span>
    </button>
  );
};
```

- [ ] **Step 3 : Refonte de `FeedbackNegatifModale.tsx`**

Remplacer le contenu de `src/client/components/_commons/ChatUI/FeedbackNegatifModale.tsx` par :

```tsx
import { useState } from "react";
import { Dialog } from "radix-ui";
import { $Enums } from "@prisma/client";
import { Modale } from "@/components/shared/Modale";
import { Bouton } from "@/components/_commons/Bouton/Bouton";
import { FeedbackCategorieCard } from "@/components/_commons/ChatUI/FeedbackCategorieCard";
import { FEEDBACK_CATEGORIES } from "@/components/_commons/ChatUI/feedbackCategories";
import api from "@/server/infrastructure/api/trpc/api";

export const FeedbackNegatifModale = ({
  chatId,
  disabled,
  onSuccess,
}: {
  chatId: string;
  disabled: boolean;
  onSuccess: () => void;
}) => {
  const [open, setOpen] = useState(false);
  const [categories, setCategories] = useState<
    $Enums.llm_call_categorie_probleme[]
  >([]);
  const [commentaire, setCommentaire] = useState("");

  const evaluerMutation = api.albert.evaluer.useMutation({
    onSuccess: () => {
      setOpen(false);
      onSuccess();
    },
  });

  const toggleCategorie = (valeur: $Enums.llm_call_categorie_probleme) => {
    setCategories((actuelles) =>
      actuelles.includes(valeur)
        ? actuelles.filter((categorie) => categorie !== valeur)
        : [...actuelles, valeur],
    );
  };

  const autreSelectionneeSansCommentaire =
    categories.includes($Enums.llm_call_categorie_probleme.AUTRE) &&
    commentaire.trim().length === 0;

  const envoiImpossible =
    categories.length === 0 ||
    autreSelectionneeSansCommentaire ||
    evaluerMutation.isPending;

  const handleEnvoyer = () => {
    evaluerMutation.mutate({
      chatId,
      evaluation: $Enums.llm_call_evaluation.NEGATIVE,
      categories,
      commentaire: commentaire.trim() || undefined,
    });
  };

  return (
    <Modale
      onOpenChange={(ouvert) => {
        setOpen(ouvert);
        if (!ouvert) {
          setCategories([]);
          setCommentaire("");
        }
      }}
      open={open}
      size="md"
      sousTitre="Dites-nous ce qui n'a pas fonctionné"
      title="Aidez-nous à nous améliorer"
      trigger={
        <button
          className="rounded-full border border-gray-300 px-3 py-1 hover:bg-gray-100 transition-colors disabled:opacity-50"
          disabled={disabled}
          type="button"
        >
          Non
        </button>
      }
    >
      <fieldset className="border-0 p-0 m-0">
        <legend className="font-medium text-gray-900 mb-3">
          Quel(s) type(s) de problème avez-vous rencontré ?{" "}
          <span className="font-normal text-gray-500">
            (vous pouvez en sélectionner plusieurs)
          </span>
        </legend>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {FEEDBACK_CATEGORIES.map((categorie) => (
            <FeedbackCategorieCard
              categorie={categorie}
              key={categorie.valeur}
              onToggle={() => toggleCategorie(categorie.valeur)}
              selectionnee={categories.includes(categorie.valeur)}
            />
          ))}
        </div>
      </fieldset>

      <div className="mt-6">
        <label className="font-medium text-gray-900" htmlFor="feedback-negatif-commentaire">
          Décrivez le problème{" "}
          <span className="font-normal text-gray-500">(optionnel)</span>
        </label>
        <textarea
          className="mt-2 w-full rounded-md border border-gray-300 p-3 text-sm h-40 resize-none"
          id="feedback-negatif-commentaire"
          onChange={(event) => setCommentaire(event.target.value)}
          placeholder="Décrivez ce qui n'a pas fonctionné..."
          value={commentaire}
        />
      </div>

      <div className="flex justify-end gap-2 mt-4">
        <Dialog.Close asChild>
          <Bouton label="Annuler" variant="secondary" />
        </Dialog.Close>
        <Bouton
          disabled={envoiImpossible}
          label="Envoyer"
          onClick={handleEnvoyer}
          variant="primary"
        />
      </div>
    </Modale>
  );
};
```

- [ ] **Step 4 : Créer `FeedbackPositiveModale.tsx`**

Créer `src/client/components/_commons/ChatUI/FeedbackPositiveModale.tsx` :

```tsx
import { useState } from "react";
import { Dialog } from "radix-ui";
import { $Enums } from "@prisma/client";
import { Modale } from "@/components/shared/Modale";
import { Bouton } from "@/components/_commons/Bouton/Bouton";
import api from "@/server/infrastructure/api/trpc/api";

export const FeedbackPositiveModale = ({
  chatId,
  open,
  onOpenChange,
  onSuccess,
}: {
  chatId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}) => {
  const [commentaire, setCommentaire] = useState("");

  const evaluerMutation = api.albert.evaluer.useMutation({
    onSuccess: () => {
      onOpenChange(false);
      onSuccess();
    },
  });

  const handleEnvoyer = () => {
    evaluerMutation.mutate({
      chatId,
      evaluation: $Enums.llm_call_evaluation.POSITIVE,
      commentaire: commentaire.trim() || undefined,
    });
  };

  return (
    <Modale
      onOpenChange={(ouvert) => {
        onOpenChange(ouvert);
        if (!ouvert) setCommentaire("");
      }}
      open={open}
      size="md"
      sousTitre="Dites-nous ce qui vous a plu (optionnel)"
      title="Merci pour votre retour !"
    >
      <div>
        <label className="font-medium text-gray-900" htmlFor="feedback-positif-commentaire">
          Qu'avez-vous particulièrement apprécié ?{" "}
          <span className="font-normal text-gray-500">(optionnel)</span>
        </label>
        <textarea
          className="mt-2 w-full rounded-md border border-gray-300 p-3 text-sm h-40 resize-none"
          id="feedback-positif-commentaire"
          onChange={(event) => setCommentaire(event.target.value)}
          placeholder="Partagez ce qui vous a aidé..."
          value={commentaire}
        />
      </div>

      <div className="flex justify-end gap-2 mt-4">
        <Dialog.Close asChild>
          <Bouton label="Annuler" variant="secondary" />
        </Dialog.Close>
        <Bouton
          disabled={evaluerMutation.isPending}
          label="Envoyer"
          onClick={handleEnvoyer}
          variant="primary"
        />
      </div>
    </Modale>
  );
};
```

> Note : `FeedbackPositiveModale` est pilotée par le parent (`open`/`onOpenChange`) car elle est déclenchée par le bouton « Oui » de `FeedbackBar`, alors que `FeedbackNegatifModale` garde son propre `trigger` interne (le bouton « Non »).

- [ ] **Step 5 : Câbler `FeedbackBar.tsx`**

Remplacer le contenu de `src/client/components/_commons/ChatUI/FeedbackBar.tsx` par :

```tsx
import { useState } from "react";
import { FeedbackNegatifModale } from "@/components/_commons/ChatUI/FeedbackNegatifModale";
import { FeedbackPositiveModale } from "@/components/_commons/ChatUI/FeedbackPositiveModale";

export const FeedbackBar = ({ chatId }: { chatId: string }) => {
  const [evaluationSoumise, setEvaluationSoumise] = useState(false);
  const [positiveOuverte, setPositiveOuverte] = useState(false);

  return (
    <div className="shrink-0 border-t border-gray-100 px-4 py-2 bg-white">
      <div className="max-w-3xl mx-auto flex items-center gap-3 text-sm text-gray-500">
        {!evaluationSoumise ? (
          <>
            <span>Trouvez-vous l'assistant utile ?</span>
            <button
              className="rounded-full border border-gray-300 px-3 py-1 hover:bg-gray-100 transition-colors disabled:opacity-50"
              onClick={() => setPositiveOuverte(true)}
              type="button"
            >
              Oui
            </button>
            <FeedbackNegatifModale
              chatId={chatId}
              disabled={false}
              onSuccess={() => setEvaluationSoumise(true)}
            />
            <FeedbackPositiveModale
              chatId={chatId}
              onOpenChange={setPositiveOuverte}
              onSuccess={() => setEvaluationSoumise(true)}
              open={positiveOuverte}
            />
          </>
        ) : (
          <span>Merci pour votre retour !</span>
        )}
      </div>
    </div>
  );
};
```

- [ ] **Step 6 : Vérifier lint/types**

Run : `pnpm lint`
Expected : pas d'erreur (notamment vérifier les imports d'icônes).

- [ ] **Step 7 : Commit**

```bash
git add src/client/components/_commons/ChatUI
git commit -m "[DITP-pilotage/pilote-2] feature(PIL-1549): modale feedback positif et refonte modale negative avec categories"
```

---

## Task 5 : Front admin (affichage + filtre)

**Files:**
- Modify: `src/client/components/PagePanelAdministrateur/Albert/ConversationTranscript.tsx`
- Modify: `src/client/components/PagePanelAdministrateur/Albert/AlbertDashboardFilters.tsx`
- Modify: `src/client/components/PagePanelAdministrateur/Albert/AlbertDashboard.tsx`

> Rappel : pas de test automatisé sur le front.

- [ ] **Step 1 : Afficher les badges de catégories dans `ConversationTranscript.tsx`**

Dans `src/client/components/PagePanelAdministrateur/Albert/ConversationTranscript.tsx`, importer le libellé :

```tsx
import { LIBELLES_CATEGORIES } from "@/components/_commons/ChatUI/feedbackCategories";
```

Puis, dans le rendu d'un `tour`, juste après le bloc commentaire `{tour.llmCall?.commentaire && (...)}` (vers la ligne 142), ajouter :

```tsx
          {tour.llmCall?.categoriesProbleme &&
            tour.llmCall.categoriesProbleme.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {tour.llmCall.categoriesProbleme.map((categorie) => (
                  <span
                    className="inline-flex items-center px-2.5 py-1 rounded-sm text-xs font-medium bg-dsfr-warning-950 text-dsfr-warning-425"
                    key={categorie}
                  >
                    {LIBELLES_CATEGORIES[categorie]}
                  </span>
                ))}
              </div>
            )}
```

> Le type `LlmCall` est dérivé de la sortie tRPC `recupererPourAdmin` ; après la Task 3, `categoriesProbleme` est présent automatiquement dans ce type — aucune déclaration de type supplémentaire ici.

- [ ] **Step 2 : Ajouter le filtre catégories dans `AlbertDashboardFilters.tsx`**

Dans `src/client/components/PagePanelAdministrateur/Albert/AlbertDashboardFilters.tsx` :

1. Imports :
```tsx
import { $Enums } from "@prisma/client";
import {
  FEEDBACK_CATEGORIES,
} from "@/components/_commons/ChatUI/feedbackCategories";
```
2. Type `FiltresDashboard` : ajouter
```ts
  categories: $Enums.llm_call_categorie_probleme[];
```
3. `FILTRES_VIDES` : ajouter
```ts
  categories: [],
```
4. Ajouter une fonction de toggle :
```tsx
  const toggleCategorie = (valeur: $Enums.llm_call_categorie_probleme) => {
    const actuelles = filtres.categories;
    const suivantes = actuelles.includes(valeur)
      ? actuelles.filter((categorie) => categorie !== valeur)
      : [...actuelles, valeur];
    onChange({ ...filtres, categories: suivantes });
  };
```
5. Dans le JSX, après le bloc `<details>` des profils, ajouter un second `<details>` :
```tsx
      <details className="!relative">
        <summary className="!cursor-pointer !px-3 !py-2 !text-sm !rounded-md !border !border-dsfr-grey-900 !list-none">
          Catégories{" "}
          {filtres.categories.length > 0 && `(${filtres.categories.length})`}
        </summary>
        <div className="!absolute !z-10 !mt-1 !p-3 !bg-white !border !border-dsfr-grey-925 !rounded-md !shadow-md !w-64">
          {FEEDBACK_CATEGORIES.map((categorie) => (
            <label
              className="!flex !items-center !gap-2 !text-sm !py-1"
              key={categorie.valeur}
            >
              <input
                checked={filtres.categories.includes(categorie.valeur)}
                onChange={() => toggleCategorie(categorie.valeur)}
                type="checkbox"
              />
              {categorie.titre}
            </label>
          ))}
        </div>
      </details>
```

- [ ] **Step 3 : Passer le filtre `categories` à la query dans `AlbertDashboard.tsx`**

Dans `src/client/components/PagePanelAdministrateur/Albert/AlbertDashboard.tsx`, repérer l'appel `api.albert.conversations.listerToutes.useQuery({...})` qui consomme `filtres`, et ajouter le champ `categories: filtres.categories` à l'objet d'input (à côté de `avecPouce`, `avecCommentaire`, `profilCodes`, etc.).

> Vérifier le nom exact de la variable de filtres dans ce fichier (probablement `filtres`) et reproduire le même style que les autres champs déjà passés. Si `FILTRES_VIDES` est importé et étalé quelque part, le nouveau champ `categories` est déjà couvert par la Task 5 Step 2.

- [ ] **Step 4 : Vérifier lint/types**

Run : `pnpm lint`
Expected : pas d'erreur.

- [ ] **Step 5 : Commit**

```bash
git add src/client/components/PagePanelAdministrateur/Albert
git commit -m "[DITP-pilotage/pilote-2] feature(PIL-1549): affichage et filtre des categories de probleme dans le panel admin"
```

---

## Vérification finale

- [ ] **Lint complet**

Run : `pnpm lint`
Expected : aucune erreur.

- [ ] **Tests serveur** (lancés par l'utilisateur)

Run : `pnpm test:server -- albert`
Expected : tous les tests Albert passent (use case + queries).

- [ ] **Validation manuelle (par l'utilisateur)**
  - Côté assistant : « Oui » ouvre la modale positive (commentaire optionnel, envoi OK même vide) ; « Non » ouvre la modale négative (Envoyer désactivé sans catégorie, et désactivé si « Autre » sans commentaire).
  - Côté admin : le détail de conversation affiche les badges de catégories ; le filtre « Catégories » restreint la liste.
