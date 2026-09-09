# Liens chantiers et conversation Albert persistante — Plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rendre les chantiers cités par Albert cliquables vers leur fiche, et faire survivre la conversation à la navigation sous forme minimisée.

**Architecture:** L'instance `Chat` du AI SDK sort de `ChatUI` pour vivre dans un provider monté sous `MiseEnPage`, ce qui la rend indépendante du montage/démontage des pages. En parallèle, un plugin `remark` transforme les `CH-XXX` en liens internes, uniquement pour les identifiants figurant parmi les chantiers réellement retournés par les tools au cours de la conversation.

**Tech Stack:** Next.js 16 (pages router), React 18, TypeScript, `ai` v7 / `@ai-sdk/react` v4, `react-markdown` v10 + `remark-gfm`, tRPC, zod, Tailwind + DSFR, Vitest (projet `client`), Playwright.

**Spec:** `docs/superpowers/specs/2026-09-09-albert-liens-chantiers-conversation-persistante-design.md`

## Global Constraints

- Tous les chemins sont relatifs à `apps/pilote-ppg/`.
- **Exports nommés uniquement** — jamais de `export default` ni d'import par défaut.
- **Paramètres de fonction sous forme d'objet** nommé, pas de positionnels, dès qu'il y en a plus d'un.
- **Pas de variable à 1 ou 2 caractères** (`error` et non `e`, `event` et non `ev`).
- **Utiliser `$Enums` de `@prisma/client`** pour les valeurs et types d'énumérations.
- **Tests** : `describe` / `test`, commentaires `// Given` `// When` `// Then`, `expect(...).toStrictEqual(...)`. `globals: true` est actif : ne pas importer `describe`/`test`/`expect`. Pas de commentaire hors Given/When/Then.
- **Ne jamais lancer les tests soi-même n'est PAS la règle ici** : Antoine a levé cette consigne du CLAUDE.md. Lancer les tests à chaque étape qui le demande.
- **Aucune nouvelle dépendance npm.** `unist-util-visit` et `@types/mdast` ne sont pas résolvables sous pnpm strict ; le plugin remark déclare ses propres types mdast minimaux.
- **Next.js 16** : lire `node_modules/next/dist/docs/` avant d'écrire du code qui touche au routage. On reste sur le pages router et `useRouter` de `next/router`, déjà utilisé dans `MiseEnPage.tsx`.
- Commandes : `pnpm test:client`, `pnpm lint:tsc`, `pnpm lint:eslint`, `pnpm test:e2e`.
- Messages de commit : `type(ppg): description (PIL-1690)` ou `(PIL-1693)`.

---

### Task 1: Whitelist des chantiers cités

Extrait des tool-outputs d'une conversation la liste des chantiers réellement remontés par le backend. C'est la pièce qui garantit qu'aucun identifiant halluciné ni aucun chantier hors habilitation ne devienne un lien.

**Files:**
- Create: `src/client/components/_commons/ChatUI/extraireChantiersCites.ts`
- Create: `src/client/components/_commons/ChatUI/extraireChantiersCites.unit.test.ts`
- Modify: `src/server/chantiers/query/GetChantiersQuery.ts:10`

**Interfaces:**
- Consumes: `PiloteUIMessage` de `@/server/albert/PiloteUIMessage`.
- Produces:
  - `type ChantierCite = { id: string; nom: string; maillesApplicables?: $Enums.Maille[] }`
  - `extraireChantiersCites(messages: PiloteUIMessage[]): Map<string, ChantierCite>` — clé = identifiant canonique en majuscules.

- [ ] **Step 1: Resserrer le type de `mailles_applicables`**

`GetChantiersQuery.ts:10` type ce champ en `string[]` alors que la valeur vient d'une colonne Prisma `Maille[]`. On le resserre pour éviter un `as` au moment de construire `ChantierCite`.

```ts
// src/server/chantiers/query/GetChantiersQuery.ts
import { $Enums } from "@prisma/client";

type ChantierIdentite = {
  id: string;
  nom: string;
  axe: string;
  ppg: string;
  ministeres: string[];
  mailles_applicables: $Enums.Maille[];
};
```

- [ ] **Step 2: Vérifier que le typage passe**

Run: `pnpm lint:tsc`
Expected: PASS. En cas d'erreur d'assignation ailleurs, c'est que la valeur ne venait pas de Prisma — remonter l'information plutôt que d'élargir le type à nouveau.

- [ ] **Step 3: Écrire le test qui échoue**

```ts
// src/client/components/_commons/ChatUI/extraireChantiersCites.unit.test.ts
import { extraireChantiersCites } from "@/components/_commons/ChatUI/extraireChantiersCites";
import type { PiloteUIMessage } from "@/server/albert/PiloteUIMessage";

const messageAssistant = (parts: PiloteUIMessage["parts"]): PiloteUIMessage => ({
  id: "message-1",
  role: "assistant",
  parts,
});

describe("extraireChantiersCites", () => {
  test("retient les chantiers remontés par get_chantiers avec leurs mailles", () => {
    // Given
    const messages = [
      messageAssistant([
        {
          type: "tool-get_chantiers",
          toolCallId: "appel-1",
          state: "output-available",
          input: { territoire_code: "NAT-FR", jalon: 2025 },
          output: {
            resultats: [
              {
                territoire_code: "NAT-FR",
                territoire_nom: "France",
                jalon: 2025,
                chantiers: [
                  {
                    chantier: {
                      id: "CH-050",
                      nom: "Sécurité routière",
                      axe: "Axe",
                      ppg: "PPG",
                      ministeres: [],
                      mailles_applicables: ["NAT", "REG"],
                    },
                  },
                ],
              },
            ],
            _output_instructions: "",
          },
        },
      ] as PiloteUIMessage["parts"]),
    ];

    // When
    const chantiers = extraireChantiersCites(messages);

    // Then
    expect([...chantiers.values()]).toStrictEqual([
      {
        id: "CH-050",
        nom: "Sécurité routière",
        maillesApplicables: ["NAT", "REG"],
      },
    ]);
  });

  test("retient les chantiers remontés par search_chantiers, sans mailles", () => {
    // Given
    const messages = [
      messageAssistant([
        {
          type: "tool-search_chantiers",
          toolCallId: "appel-1",
          state: "output-available",
          input: { query: "sécurité" },
          output: {
            chantiers: [{ id: "CH-050", nom: "Sécurité routière" }],
            reasoning: "",
            _output_instructions: "",
          },
        },
      ] as PiloteUIMessage["parts"]),
    ];

    // When
    const chantiers = extraireChantiersCites(messages);

    // Then
    expect([...chantiers.values()]).toStrictEqual([
      { id: "CH-050", nom: "Sécurité routière" },
    ]);
  });

  test("retient le chantier de rattachement des indicateurs trouvés", () => {
    // Given
    const messages = [
      messageAssistant([
        {
          type: "tool-search_indicateurs",
          toolCallId: "appel-1",
          state: "output-available",
          input: { query: "accidents" },
          output: {
            indicateurs: [
              {
                id: "IND-001",
                nom: "Accidents",
                chantier: { id: "CH-050", nom: "Sécurité routière" },
              },
            ],
            reasoning: "",
            _output_instructions: "",
          },
        },
      ] as PiloteUIMessage["parts"]),
    ];

    // When
    const chantiers = extraireChantiersCites(messages);

    // Then
    expect([...chantiers.values()]).toStrictEqual([
      { id: "CH-050", nom: "Sécurité routière" },
    ]);
  });

  test("cumule les chantiers sur plusieurs tours et conserve les mailles connues", () => {
    // Given
    const messages = [
      messageAssistant([
        {
          type: "tool-get_chantiers",
          toolCallId: "appel-1",
          state: "output-available",
          input: { territoire_code: "NAT-FR", jalon: 2025 },
          output: {
            resultats: [
              {
                territoire_code: "NAT-FR",
                territoire_nom: "France",
                jalon: 2025,
                chantiers: [
                  {
                    chantier: {
                      id: "CH-050",
                      nom: "Sécurité routière",
                      axe: "Axe",
                      ppg: "PPG",
                      ministeres: [],
                      mailles_applicables: ["NAT"],
                    },
                  },
                ],
              },
            ],
            _output_instructions: "",
          },
        },
      ] as PiloteUIMessage["parts"]),
      messageAssistant([
        {
          type: "tool-search_chantiers",
          toolCallId: "appel-2",
          state: "output-available",
          input: { query: "handicap" },
          output: {
            chantiers: [
              { id: "CH-050", nom: "Sécurité routière" },
              { id: "CH-012", nom: "Handicap" },
            ],
            reasoning: "",
            _output_instructions: "",
          },
        },
      ] as PiloteUIMessage["parts"]),
    ];

    // When
    const chantiers = extraireChantiersCites(messages);

    // Then
    expect([...chantiers.values()]).toStrictEqual([
      { id: "CH-050", nom: "Sécurité routière", maillesApplicables: ["NAT"] },
      { id: "CH-012", nom: "Handicap" },
    ]);
  });

  test("ignore les parts dont la sortie n'est pas disponible", () => {
    // Given
    const messages = [
      messageAssistant([
        {
          type: "tool-search_chantiers",
          toolCallId: "appel-1",
          state: "input-available",
          input: { query: "sécurité" },
        },
      ] as PiloteUIMessage["parts"]),
    ];

    // When
    const chantiers = extraireChantiersCites(messages);

    // Then
    expect([...chantiers.values()]).toStrictEqual([]);
  });
});
```

- [ ] **Step 4: Lancer le test pour vérifier qu'il échoue**

Run: `pnpm test:client extraireChantiersCites`
Expected: FAIL — le module `extraireChantiersCites` n'existe pas.

- [ ] **Step 5: Écrire l'implémentation**

```ts
// src/client/components/_commons/ChatUI/extraireChantiersCites.ts
import { $Enums } from "@prisma/client";
import type { PiloteUIMessage } from "@/server/albert/PiloteUIMessage";

export type ChantierCite = {
  id: string;
  nom: string;
  maillesApplicables?: $Enums.Maille[];
};

export const extraireChantiersCites = (
  messages: PiloteUIMessage[],
): Map<string, ChantierCite> => {
  const chantiers = new Map<string, ChantierCite>();

  const ajouter = (chantier: ChantierCite) => {
    const existant = chantiers.get(chantier.id);
    if (existant?.maillesApplicables && !chantier.maillesApplicables) return;
    chantiers.set(chantier.id, chantier);
  };

  for (const message of messages) {
    for (const part of message.parts ?? []) {
      if (!("state" in part) || part.state !== "output-available") continue;

      if (part.type === "tool-get_chantiers") {
        for (const resultat of part.output.resultats) {
          for (const ligne of resultat.chantiers) {
            ajouter({
              id: ligne.chantier.id,
              nom: ligne.chantier.nom,
              maillesApplicables: ligne.chantier.mailles_applicables,
            });
          }
        }
      }

      if (part.type === "tool-search_chantiers") {
        for (const chantier of part.output.chantiers) {
          ajouter({ id: chantier.id, nom: chantier.nom });
        }
      }

      if (part.type === "tool-search_indicateurs") {
        for (const indicateur of part.output.indicateurs) {
          ajouter({ id: indicateur.chantier.id, nom: indicateur.chantier.nom });
        }
      }
    }
  }

  return chantiers;
};
```

- [ ] **Step 6: Lancer les tests pour vérifier qu'ils passent**

Run: `pnpm test:client extraireChantiersCites`
Expected: PASS — 5 tests.

- [ ] **Step 7: Commit**

```bash
git add src/client/components/_commons/ChatUI/extraireChantiersCites.ts \
        src/client/components/_commons/ChatUI/extraireChantiersCites.unit.test.ts \
        src/server/chantiers/query/GetChantiersQuery.ts
git commit -m "feat(ppg): extrait les chantiers cités des tool-outputs Albert (PIL-1693)"
```

---

### Task 2: Construction de l'URL de la fiche chantier

Construit la destination à partir de l'identifiant canonique et du contexte de la conversation, avec repli national quand la maille du territoire n'est pas applicable au chantier.

**Files:**
- Create: `src/client/components/_commons/ChatUI/construireUrlChantier.ts`
- Create: `src/client/components/_commons/ChatUI/construireUrlChantier.unit.test.ts`

**Interfaces:**
- Consumes: `ChantierCite` de `extraireChantiersCites.ts` (Task 1).
- Produces:
  - `type ContexteChantier = { territoireCode?: string; jalon?: number }`
  - `construireUrlChantier({ chantier, contexte }: { chantier: ChantierCite; contexte: ContexteChantier }): string`

- [ ] **Step 1: Écrire le test qui échoue**

```ts
// src/client/components/_commons/ChatUI/construireUrlChantier.unit.test.ts
import { $Enums } from "@prisma/client";
import { construireUrlChantier } from "@/components/_commons/ChatUI/construireUrlChantier";

describe("construireUrlChantier", () => {
  test("utilise le territoire et le jalon de la conversation", () => {
    // Given
    const maillesApplicables: $Enums.Maille[] = ["NAT", "REG"];
    const chantier = {
      id: "CH-050",
      nom: "Sécurité routière",
      maillesApplicables,
    };

    // When
    const url = construireUrlChantier({
      chantier,
      contexte: { territoireCode: "REG-11", jalon: 2025 },
    });

    // Then
    expect(url).toStrictEqual("/chantier/CH-050/REG-11?jalon=2025");
  });

  test("retombe sur le territoire national quand la maille n'est pas applicable", () => {
    // Given
    const maillesApplicables: $Enums.Maille[] = ["NAT"];
    const chantier = {
      id: "CH-050",
      nom: "Sécurité routière",
      maillesApplicables,
    };

    // When
    const url = construireUrlChantier({
      chantier,
      contexte: { territoireCode: "DEPT-75", jalon: 2025 },
    });

    // Then
    expect(url).toStrictEqual("/chantier/CH-050/NAT-FR?jalon=2025");
  });

  test("conserve le territoire de la conversation quand les mailles sont inconnues", () => {
    // Given
    const chantier = { id: "CH-050", nom: "Sécurité routière" };

    // When
    const url = construireUrlChantier({
      chantier,
      contexte: { territoireCode: "DEPT-75", jalon: 2025 },
    });

    // Then
    expect(url).toStrictEqual("/chantier/CH-050/DEPT-75?jalon=2025");
  });

  test("retombe sur le territoire national quand le contexte est vide", () => {
    // Given
    const chantier = { id: "CH-050", nom: "Sécurité routière" };

    // When
    const url = construireUrlChantier({ chantier, contexte: {} });

    // Then
    expect(url).toStrictEqual("/chantier/CH-050/NAT-FR");
  });
});
```

- [ ] **Step 2: Lancer le test pour vérifier qu'il échoue**

Run: `pnpm test:client construireUrlChantier`
Expected: FAIL — le module n'existe pas.

- [ ] **Step 3: Écrire l'implémentation**

```ts
// src/client/components/_commons/ChatUI/construireUrlChantier.ts
import { $Enums } from "@prisma/client";
import type { ChantierCite } from "@/components/_commons/ChatUI/extraireChantiersCites";

export type ContexteChantier = {
  territoireCode?: string;
  jalon?: number;
};

const TERRITOIRE_NATIONAL = "NAT-FR";

const resoudreTerritoire = ({
  chantier,
  contexte,
}: {
  chantier: ChantierCite;
  contexte: ContexteChantier;
}): string => {
  const { territoireCode } = contexte;
  if (!territoireCode) return TERRITOIRE_NATIONAL;
  if (!chantier.maillesApplicables) return territoireCode;

  const [maille] = territoireCode.split("-");
  return chantier.maillesApplicables.includes(maille as $Enums.Maille)
    ? territoireCode
    : TERRITOIRE_NATIONAL;
};

export const construireUrlChantier = ({
  chantier,
  contexte,
}: {
  chantier: ChantierCite;
  contexte: ContexteChantier;
}): string => {
  const territoireCode = resoudreTerritoire({ chantier, contexte });
  const chemin = `/chantier/${chantier.id}/${territoireCode}`;
  return contexte.jalon ? `${chemin}?jalon=${contexte.jalon}` : chemin;
};
```

- [ ] **Step 4: Lancer les tests pour vérifier qu'ils passent**

Run: `pnpm test:client construireUrlChantier`
Expected: PASS — 4 tests.

- [ ] **Step 5: Commit**

```bash
git add src/client/components/_commons/ChatUI/construireUrlChantier.ts \
        src/client/components/_commons/ChatUI/construireUrlChantier.unit.test.ts
git commit -m "feat(ppg): construit l'URL de fiche chantier depuis le contexte de conversation (PIL-1693)"
```

---

### Task 3: Plugin remark de linkification

Transforme les `CH-XXX` en nœuds `link` dans l'AST markdown, uniquement pour les identifiants présents dans la whitelist. Travailler à l'AST écarte gratuitement les blocs de code, les liens existants et l'échappement des noms contenant des caractères markdown.

**Files:**
- Create: `src/client/components/_commons/ChatUI/remarkLiensChantiers.ts`
- Create: `src/client/components/_commons/ChatUI/remarkLiensChantiers.unit.test.ts`

**Interfaces:**
- Consumes: `ChantierCite` (Task 1).
- Produces:
  - `type OptionsLiensChantiers = { chantiers: Map<string, ChantierCite>; construireUrl: (chantier: ChantierCite) => string }`
  - `remarkLiensChantiers(options: OptionsLiensChantiers): (tree: NoeudMarkdown) => void` — plugin unified, à passer à `react-markdown` sous la forme d'un tuple `[remarkLiensChantiers, options]`.

- [ ] **Step 1: Écrire le test qui échoue**

Le test manipule directement de petits arbres mdast, sans passer par un parseur : c'est le contrat du plugin qu'on vérifie.

```ts
// src/client/components/_commons/ChatUI/remarkLiensChantiers.unit.test.ts
import {
  remarkLiensChantiers,
  type NoeudMarkdown,
} from "@/components/_commons/ChatUI/remarkLiensChantiers";
import type { ChantierCite } from "@/components/_commons/ChatUI/extraireChantiersCites";

const chantiers = new Map<string, ChantierCite>([
  ["CH-050", { id: "CH-050", nom: "Sécurité routière" }],
  ["CH-012", { id: "CH-012", nom: "Handicap [phase 2]" }],
]);

const construireUrl = (chantier: ChantierCite) => `/chantier/${chantier.id}/NAT-FR`;

const appliquer = (tree: NoeudMarkdown): NoeudMarkdown => {
  remarkLiensChantiers({ chantiers, construireUrl })(tree);
  return tree;
};

const paragraphe = (valeur: string): NoeudMarkdown => ({
  type: "root",
  children: [{ type: "paragraph", children: [{ type: "text", value: valeur }] }],
});

const enfantsDuParagraphe = (tree: NoeudMarkdown) =>
  tree.children?.[0].children;

describe("remarkLiensChantiers", () => {
  test("transforme le libellé complet en un seul lien", () => {
    // Given
    const tree = paragraphe("Voir CH-050 — Sécurité routière pour le détail.");

    // When
    appliquer(tree);

    // Then
    expect(enfantsDuParagraphe(tree)).toStrictEqual([
      { type: "text", value: "Voir " },
      {
        type: "link",
        url: "/chantier/CH-050/NAT-FR",
        children: [{ type: "text", value: "CH-050 — Sécurité routière" }],
      },
      { type: "text", value: " pour le détail." },
    ]);
  });

  test("retombe sur l'identifiant seul quand le nom ne suit pas", () => {
    // Given
    const tree = paragraphe("Le chantier CH-050 progresse.");

    // When
    appliquer(tree);

    // Then
    expect(enfantsDuParagraphe(tree)).toStrictEqual([
      { type: "text", value: "Le chantier " },
      {
        type: "link",
        url: "/chantier/CH-050/NAT-FR",
        children: [{ type: "text", value: "CH-050" }],
      },
      { type: "text", value: " progresse." },
    ]);
  });

  test("retombe sur l'identifiant seul quand le nom qui suit ne correspond pas", () => {
    // Given
    const tree = paragraphe("CH-050 — Autre libellé");

    // When
    appliquer(tree);

    // Then
    expect(enfantsDuParagraphe(tree)).toStrictEqual([
      {
        type: "link",
        url: "/chantier/CH-050/NAT-FR",
        children: [{ type: "text", value: "CH-050" }],
      },
      { type: "text", value: " — Autre libellé" },
    ]);
  });

  test("tolère la casse et les séparateurs alternatifs", () => {
    // Given
    const tree = paragraphe("Ch-050 - Sécurité routière");

    // When
    appliquer(tree);

    // Then
    expect(enfantsDuParagraphe(tree)).toStrictEqual([
      {
        type: "link",
        url: "/chantier/CH-050/NAT-FR",
        children: [{ type: "text", value: "Ch-050 - Sécurité routière" }],
      },
    ]);
  });

  test("laisse en texte un identifiant absent de la whitelist", () => {
    // Given
    const tree = paragraphe("Le chantier CH-999 n'existe pas.");

    // When
    appliquer(tree);

    // Then
    expect(enfantsDuParagraphe(tree)).toStrictEqual([
      { type: "text", value: "Le chantier CH-999 n'existe pas." },
    ]);
  });

  test("crée un lien pour chaque chantier d'une même phrase", () => {
    // Given
    const tree = paragraphe("CH-050 et CH-012 sont concernés.");

    // When
    appliquer(tree);

    // Then
    expect(enfantsDuParagraphe(tree)).toStrictEqual([
      {
        type: "link",
        url: "/chantier/CH-050/NAT-FR",
        children: [{ type: "text", value: "CH-050" }],
      },
      { type: "text", value: " et " },
      {
        type: "link",
        url: "/chantier/CH-012/NAT-FR",
        children: [{ type: "text", value: "CH-012" }],
      },
      { type: "text", value: " sont concernés." },
    ]);
  });

  test("descend dans les nœuds imbriqués comme le gras", () => {
    // Given
    const tree: NoeudMarkdown = {
      type: "root",
      children: [
        {
          type: "paragraph",
          children: [
            { type: "strong", children: [{ type: "text", value: "CH-050" }] },
          ],
        },
      ],
    };

    // When
    appliquer(tree);

    // Then
    expect(tree.children?.[0].children?.[0].children).toStrictEqual([
      {
        type: "link",
        url: "/chantier/CH-050/NAT-FR",
        children: [{ type: "text", value: "CH-050" }],
      },
    ]);
  });

  test("ne touche ni au code inline ni aux liens existants", () => {
    // Given
    const tree: NoeudMarkdown = {
      type: "root",
      children: [
        {
          type: "paragraph",
          children: [
            { type: "inlineCode", value: "CH-050" },
            {
              type: "link",
              url: "https://exemple.fr",
              children: [{ type: "text", value: "CH-050" }],
            },
          ],
        },
      ],
    };

    // When
    appliquer(tree);

    // Then
    expect(enfantsDuParagraphe(tree)).toStrictEqual([
      { type: "inlineCode", value: "CH-050" },
      {
        type: "link",
        url: "https://exemple.fr",
        children: [{ type: "text", value: "CH-050" }],
      },
    ]);
  });

  test("gère un nom de chantier contenant des caractères markdown", () => {
    // Given
    const tree = paragraphe("CH-012 — Handicap [phase 2] est en cours.");

    // When
    appliquer(tree);

    // Then
    expect(enfantsDuParagraphe(tree)).toStrictEqual([
      {
        type: "link",
        url: "/chantier/CH-012/NAT-FR",
        children: [{ type: "text", value: "CH-012 — Handicap [phase 2]" }],
      },
      { type: "text", value: " est en cours." },
    ]);
  });
});
```

- [ ] **Step 2: Lancer le test pour vérifier qu'il échoue**

Run: `pnpm test:client remarkLiensChantiers`
Expected: FAIL — le module n'existe pas.

- [ ] **Step 3: Écrire l'implémentation**

```ts
// src/client/components/_commons/ChatUI/remarkLiensChantiers.ts
import type { ChantierCite } from "@/components/_commons/ChatUI/extraireChantiersCites";

// Types mdast minimaux : @types/mdast n'est pas résolvable sous pnpm strict et
// seuls ces nœuds sont manipulés ici.
export type NoeudMarkdown = {
  type: string;
  value?: string;
  url?: string;
  children?: NoeudMarkdown[];
};

export type OptionsLiensChantiers = {
  chantiers: Map<string, ChantierCite>;
  construireUrl: (chantier: ChantierCite) => string;
};

const MOTIF_IDENTIFIANT = /\bch-\d{3,}\b/gi;
const MOTIF_SEPARATEUR = /^\s*[—–-]\s*/u;

const decouperTexte = ({
  valeur,
  chantiers,
  construireUrl,
}: OptionsLiensChantiers & { valeur: string }): NoeudMarkdown[] | null => {
  const noeuds: NoeudMarkdown[] = [];
  let curseur = 0;

  for (const correspondance of valeur.matchAll(MOTIF_IDENTIFIANT)) {
    const debut = correspondance.index;
    if (debut < curseur) continue;

    const chantier = chantiers.get(correspondance[0].toUpperCase());
    if (!chantier) continue;

    let fin = debut + correspondance[0].length;
    const separateur = valeur.slice(fin).match(MOTIF_SEPARATEUR);
    if (separateur) {
      const apresSeparateur = fin + separateur[0].length;
      if (valeur.startsWith(chantier.nom, apresSeparateur)) {
        fin = apresSeparateur + chantier.nom.length;
      }
    }

    if (debut > curseur) {
      noeuds.push({ type: "text", value: valeur.slice(curseur, debut) });
    }
    noeuds.push({
      type: "link",
      url: construireUrl(chantier),
      children: [{ type: "text", value: valeur.slice(debut, fin) }],
    });
    curseur = fin;
  }

  if (noeuds.length === 0) return null;
  if (curseur < valeur.length) {
    noeuds.push({ type: "text", value: valeur.slice(curseur) });
  }
  return noeuds;
};

const remplacerDansEnfants = (
  noeud: NoeudMarkdown,
  options: OptionsLiensChantiers,
): void => {
  if (!noeud.children) return;

  const enfants: NoeudMarkdown[] = [];
  let modifie = false;

  for (const enfant of noeud.children) {
    if (enfant.type === "link" || enfant.type === "linkReference") {
      enfants.push(enfant);
      continue;
    }

    if (enfant.type === "text" && enfant.value !== undefined) {
      const remplacement = decouperTexte({ ...options, valeur: enfant.value });
      if (remplacement) {
        enfants.push(...remplacement);
        modifie = true;
        continue;
      }
      enfants.push(enfant);
      continue;
    }

    remplacerDansEnfants(enfant, options);
    enfants.push(enfant);
  }

  if (modifie) noeud.children = enfants;
};

export const remarkLiensChantiers =
  (options: OptionsLiensChantiers) =>
  (tree: NoeudMarkdown): void => {
    remplacerDansEnfants(tree, options);
  };
```

- [ ] **Step 4: Lancer les tests pour vérifier qu'ils passent**

Run: `pnpm test:client remarkLiensChantiers`
Expected: PASS — 9 tests.

- [ ] **Step 5: Commit**

```bash
git add src/client/components/_commons/ChatUI/remarkLiensChantiers.ts \
        src/client/components/_commons/ChatUI/remarkLiensChantiers.unit.test.ts
git commit -m "feat(ppg): plugin remark de linkification des chantiers cités (PIL-1693)"
```

---

### Task 4: Sortir l'instance `Chat` de `ChatUI`

Refactor sans changement fonctionnel : l'instance `Chat` et le corps de requête deviennent une prop de `ChatUI`, construite par une factory. C'est ce qui rendra la conversation indépendante du montage des pages en Task 5.

`ChatUI` a deux consommateurs — `BoutonSyntheseTerritoire` (accueil) et `AlbertChat` (panel admin). Les deux passent par la factory ; il n'y a pas de chemin de repli dans `ChatUI`.

**Files:**
- Create: `src/client/components/_commons/ChatUI/creerConversationAlbert.ts`
- Modify: `src/client/components/_commons/ChatUI/ChatUI.tsx`
- Modify: `src/client/components/PageAccueil/BoutonSyntheseTerritoire.tsx`
- Modify: `src/client/components/PagePanelAdministrateur/Albert/AlbertChat.tsx`

**Interfaces:**
- Consumes: `PiloteUIMessage`, `AlbertModel` de `ChatInputForm.tsx`.
- Produces:
  - `type CorpsRequeteAlbert = { agentContext?: AgentContextAlbert; model: AlbertModel }`
  - `type AgentContextAlbert = { territoireCode: string; jalon: number; instructions: string }`
  - `type ConversationAlbert = { chat: Chat<PiloteUIMessage>; corpsRequete: CorpsRequeteAlbert }`
  - `creerConversationAlbert({ id, endpoint, agentContext, messages, onFinish }): ConversationAlbert`
  - `ChatUI` prend désormais `conversation: ConversationAlbert` et n'expose plus `endpoint`, `chatId`, `initialMessages`, `onChatFinish`, `agentContext`.

- [ ] **Step 1: Écrire la factory**

```ts
// src/client/components/_commons/ChatUI/creerConversationAlbert.ts
import { Chat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import type { AlbertModel } from "@/components/_commons/ChatUI/ChatInputForm";
import type { PiloteUIMessage } from "@/server/albert/PiloteUIMessage";

export type AgentContextAlbert = {
  territoireCode: string;
  jalon: number;
  instructions: string;
};

export type CorpsRequeteAlbert = {
  agentContext?: AgentContextAlbert;
  model: AlbertModel;
};

export type ConversationAlbert = {
  chat: Chat<PiloteUIMessage>;
  corpsRequete: CorpsRequeteAlbert;
};

export const ENDPOINT_ALBERT = "/api/albert/chat";

export const creerConversationAlbert = ({
  id,
  endpoint = ENDPOINT_ALBERT,
  agentContext,
  messages,
  onFinish,
}: {
  id: string;
  endpoint?: string;
  agentContext?: AgentContextAlbert;
  messages?: PiloteUIMessage[];
  onFinish?: () => void;
}): ConversationAlbert => {
  // Objet muté en place et référencé par le transport : le sélecteur de modèle
  // de ChatInputForm doit pouvoir le changer en cours de conversation.
  const corpsRequete: CorpsRequeteAlbert = {
    ...(agentContext ? { agentContext } : {}),
    model: "openweight-large",
  };

  const chat = new Chat<PiloteUIMessage>({
    id,
    ...(messages ? { messages } : {}),
    transport: new DefaultChatTransport<PiloteUIMessage>({
      api: endpoint,
      body: corpsRequete,
    }),
    onFinish: () => onFinish?.(),
  });

  return { chat, corpsRequete };
};
```

- [ ] **Step 2: Adapter `ChatUI` pour recevoir la conversation**

Remplacer l'en-tête du composant (`ChatUI.tsx:25-77`) par ce qui suit, en laissant tout le corps (effets de scroll, `choicesPanelData`, JSX) inchangé sauf les deux points signalés :

```tsx
// src/client/components/_commons/ChatUI/ChatUI.tsx
export const ChatUI = ({
  conversation,
  placeholder = "Posez votre question...",
  className = "h-[calc(100vh-200px)]",
  scenarios,
  showExperimentationBanner = false,
}: {
  conversation: ConversationAlbert;
  placeholder?: string;
  className?: string;
  scenarios?: ChatScenarios;
  showExperimentationBanner?: boolean;
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const userHasScrolledRef = useRef(false);
  const prevMessageCountRef = useRef(0);
  const fillInputRef = useRef<((text: string) => void) | null>(null);

  const { messages, sendMessage, status, error, stop } =
    useChat<PiloteUIMessage>({
      chat: conversation.chat,
      experimental_throttle: 250,
    });
```

Puis :

- `handleModelChange` devient
  ```tsx
  const handleModelChange = useCallback(
    (model: AlbertModel) => {
      conversation.corpsRequete.model = model;
    },
    [conversation],
  );
  ```
- `FeedbackBar` reçoit `chatId={conversation.chat.id}` au lieu de `chatRef.current.id`.
- Supprimer `bodyRef`, `onChatFinishRef` et `chatRef`, ainsi que les imports devenus inutiles (`Chat`, `DefaultChatTransport`, `useMemo` reste utilisé). Importer `ConversationAlbert` depuis `creerConversationAlbert`.

- [ ] **Step 3: Adapter `AlbertChat` (panel admin)**

```tsx
// src/client/components/PagePanelAdministrateur/Albert/AlbertChat.tsx
import { useRef } from "react";
import { ChatScenarios, ChatUI } from "@/components/_commons/ChatUI/ChatUI";
import {
  creerConversationAlbert,
  type ConversationAlbert,
} from "@/components/_commons/ChatUI/creerConversationAlbert";

// ... la constante `scenarios` reste inchangée

export const AlbertChat = () => {
  const conversationRef = useRef<ConversationAlbert | null>(null);
  conversationRef.current ??= creerConversationAlbert({
    id: crypto.randomUUID(),
  });

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-4">Albert</h2>
      <p className="text-sm text-gray-500 mb-4">
        Interrogez Albert sur les chantiers et leurs synthèses de résultats.
      </p>
      <ChatUI
        conversation={conversationRef.current}
        placeholder="Posez votre question sur un chantier..."
        scenarios={scenarios}
      />
    </div>
  );
};
```

- [ ] **Step 4: Adapter `BoutonSyntheseTerritoire`**

Remplacer la construction inline des props de `ChatUI` par la factory. L'état local `conversation` de type `ConversationActive` cède la place à une instance mémorisée, recréée quand l'identifiant change :

```tsx
const conversationRef = useRef<{ id: string; valeur: ConversationAlbert } | null>(
  null,
);
if (conversationRef.current?.id !== conversation.id) {
  conversationRef.current = {
    id: conversation.id,
    valeur: creerConversationAlbert({
      id: conversation.id,
      agentContext: {
        jalon,
        territoireCode,
        instructions: `Le territoire courant de l'utilisateur est ${territoire.nomAffiché} (code : ${territoireCode}). Utilise ce territoire par défaut lorsque l'utilisateur ne précise pas de territoire dans sa question.`,
      },
      messages: conversationChargee?.messages,
      onFinish: ffHistorique ? rafraichirHistorique : undefined,
    }),
  };
}
```

et le rendu devient `<ChatUI conversation={conversationRef.current.valeur} key={conversation.id} ... />`, sans `endpoint`, `chatId`, `initialMessages`, `onChatFinish` ni `agentContext`.

Ce câblage est transitoire : la Task 5 déplace tout ce bloc dans le provider et réduit `BoutonSyntheseTerritoire` à un déclencheur.

- [ ] **Step 5: Vérifier que rien n'est cassé**

Run: `pnpm lint:tsc && pnpm lint:eslint && pnpm test:client`
Expected: PASS. Aucun test ne portait sur `ChatUI` : le filet ici est le typage, qui doit signaler tout consommateur oublié.

- [ ] **Step 6: Commit**

```bash
git add src/client/components/_commons/ChatUI/creerConversationAlbert.ts \
        src/client/components/_commons/ChatUI/ChatUI.tsx \
        src/client/components/PageAccueil/BoutonSyntheseTerritoire.tsx \
        src/client/components/PagePanelAdministrateur/Albert/AlbertChat.tsx
git commit -m "refactor(ppg): l'instance Chat d'Albert devient une prop de ChatUI (PIL-1690)"
```

---

### Task 5: Provider applicatif, overlay et dock

Le cœur de PIL-1690. La conversation remonte au niveau de `MiseEnPage`, donc elle survit à toute navigation client. `BoutonSyntheseTerritoire` se réduit à un déclencheur.

**Files:**
- Create: `src/client/components/_commons/ChatUI/AlbertConversationProvider.tsx`
- Create: `src/client/components/_commons/ChatUI/AlbertOverlay.tsx`
- Create: `src/client/components/_commons/ChatUI/AlbertDock.tsx`
- Modify: `src/client/components/_commons/MiseEnPage/MiseEnPage.tsx`
- Modify: `src/client/components/PageAccueil/BoutonSyntheseTerritoire.tsx`

**Interfaces:**
- Consumes: `creerConversationAlbert`, `ConversationAlbert`, `AgentContextAlbert` (Task 4) ; `ChatScenarios` de `ChatEmptyState.tsx` ; `deriverTitre` de `@/server/albert/domain/ChatConversation`.
- Produces:
  - `useAlbertConversation(): AlbertConversationContextValue` avec `{ conversation, affichage, ouvrir, minimiser, restaurer, fermer, demarrerNouvelleConversation, selectionnerConversation }`
  - `type AffichageAlbert = "plein-ecran" | "minimise"`
  - `<AlbertConversationProvider>` et `<AlbertOverlay />`

- [ ] **Step 1: Écrire le provider**

```tsx
// src/client/components/_commons/ChatUI/AlbertConversationProvider.tsx
import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import type { ChatScenarios } from "@/components/_commons/ChatUI/ChatEmptyState";
import {
  creerConversationAlbert,
  type AgentContextAlbert,
  type ConversationAlbert,
} from "@/components/_commons/ChatUI/creerConversationAlbert";
import type { PiloteUIMessage } from "@/server/albert/PiloteUIMessage";
import api from "@/server/infrastructure/api/trpc/api";

export type AffichageAlbert = "plein-ecran" | "minimise";

type ConversationCourante = ConversationAlbert & {
  agentContext: AgentContextAlbert;
  scenarios?: ChatScenarios;
};

type AlbertConversationContextValue = {
  conversation: ConversationCourante | null;
  affichage: AffichageAlbert;
  ouvrir: (params: {
    agentContext: AgentContextAlbert;
    scenarios: ChatScenarios;
  }) => void;
  minimiser: () => void;
  restaurer: () => void;
  fermer: () => void;
  demarrerNouvelleConversation: () => void;
  selectionnerConversation: (id: string) => void;
};

const context = createContext<AlbertConversationContextValue | null>(null);

export const useAlbertConversation = (): AlbertConversationContextValue => {
  const valeur = useContext(context);
  if (!valeur) {
    throw new Error(
      "useAlbertConversation doit être utilisé dans un AlbertConversationProvider !",
    );
  }
  return valeur;
};

export const AlbertConversationProvider = ({ children }: PropsWithChildren) => {
  const [conversation, setConversation] = useState<ConversationCourante | null>(
    null,
  );
  const [affichage, setAffichage] = useState<AffichageAlbert>("plein-ecran");
  const utilsTrpc = api.useUtils();

  const construire = useCallback(
    ({
      id,
      agentContext,
      scenarios,
      messages,
    }: {
      id: string;
      agentContext: AgentContextAlbert;
      scenarios?: ChatScenarios;
      messages?: PiloteUIMessage[];
    }): ConversationCourante => ({
      ...creerConversationAlbert({
        id,
        agentContext,
        messages,
        onFinish: () => utilsTrpc.albert.conversations.lister.invalidate(),
      }),
      agentContext,
      scenarios,
    }),
    [utilsTrpc],
  );

  const ouvrir = useCallback<AlbertConversationContextValue["ouvrir"]>(
    ({ agentContext, scenarios }) => {
      setConversation(
        (courante) =>
          courante ??
          construire({ id: crypto.randomUUID(), agentContext, scenarios }),
      );
      setAffichage("plein-ecran");
    },
    [construire],
  );

  const minimiser = useCallback(() => setAffichage("minimise"), []);
  const restaurer = useCallback(() => setAffichage("plein-ecran"), []);

  const fermer = useCallback(() => {
    setConversation((courante) => {
      courante?.chat.stop();
      return null;
    });
    setAffichage("plein-ecran");
  }, []);

  const remplacer = useCallback(
    (id: string) => {
      setConversation((courante) => {
        if (!courante) return null;
        courante.chat.stop();
        return construire({
          id,
          agentContext: courante.agentContext,
          scenarios: courante.scenarios,
        });
      });
    },
    [construire],
  );

  const demarrerNouvelleConversation = useCallback(
    () => remplacer(crypto.randomUUID()),
    [remplacer],
  );

  const valeur = useMemo(
    () => ({
      conversation,
      affichage,
      ouvrir,
      minimiser,
      restaurer,
      fermer,
      demarrerNouvelleConversation,
      selectionnerConversation: remplacer,
    }),
    [
      conversation,
      affichage,
      ouvrir,
      minimiser,
      restaurer,
      fermer,
      demarrerNouvelleConversation,
      remplacer,
    ],
  );

  return <context.Provider value={valeur}>{children}</context.Provider>;
};
```

⚠️ À ce stade, `selectionnerConversation` construit une conversation vide portant l'identifiant choisi : elle ne recharge pas encore les messages depuis la base, ce que fait la Task 7 en branchant `conversations.recuperer`. La sélection dans le drawer d'historique est donc temporairement dégradée entre les Tasks 5 et 7 — ces trois tâches doivent partir dans la même PR, et aucune ne doit être déployée seule.

- [ ] **Step 2: Écrire le dock**

Le dock se place au-dessus du pied de page mais sous le loader de navigation de `MiseEnPage.tsx:36` (`z-[1751]`), et décalé pour ne pas le recouvrir.

```tsx
// src/client/components/_commons/ChatUI/AlbertDock.tsx
import { useChat } from "@ai-sdk/react";
import { Icone } from "@/components/_commons/Icone";
import { SparklingIcon } from "@/components/_commons/Icones/SparklingIcon";
import { CloseLineIcon } from "@/components/_commons/Icones/CloseLineIcon";
import { useAlbertConversation } from "@/components/_commons/ChatUI/AlbertConversationProvider";
import type { ConversationAlbert } from "@/components/_commons/ChatUI/creerConversationAlbert";
import type { PiloteUIMessage } from "@/server/albert/PiloteUIMessage";
import { deriverTitre } from "@/server/albert/domain/ChatConversation";

export const AlbertDock = ({
  conversation,
}: {
  conversation: ConversationAlbert;
}) => {
  const { restaurer, fermer } = useAlbertConversation();
  const { messages } = useChat<PiloteUIMessage>({ chat: conversation.chat });

  return (
    <div className="fixed bottom-4 right-4 z-[1750] flex max-w-xs items-center gap-2 rounded-lg border border-gray-200 bg-white p-3 shadow-lg">
      <button
        aria-label="Reprendre la conversation"
        className="flex min-w-0 flex-1 items-center gap-2 text-left hover:bg-transparent"
        onClick={restaurer}
        type="button"
      >
        <Icone className="h-4 w-4 shrink-0 !text-primary" icone={SparklingIcon} />
        <span className="min-w-0">
          <span className="block text-sm font-medium text-primary">
            Reprendre la conversation
          </span>
          <span className="block truncate text-xs text-gray-500">
            {deriverTitre(messages)}
          </span>
        </span>
      </button>
      <button
        aria-label="Fermer la conversation"
        className="shrink-0 text-gray-400 hover:text-red-500"
        onClick={fermer}
        type="button"
      >
        <Icone className="h-4 w-4 !text-current" icone={CloseLineIcon} />
      </button>
    </div>
  );
};
```

- [ ] **Step 3: Écrire l'overlay**

```tsx
// src/client/components/_commons/ChatUI/AlbertOverlay.tsx
import { useEnv } from "@/client/hooks/useEnv";
import { ChatUI } from "@/components/_commons/ChatUI/ChatUI";
import { ConversationHistoryDrawer } from "@/components/_commons/ChatUI/ConversationHistoryDrawer";
import { ModalePleinEcran } from "@/components/shared/ModalePleinEcran";
import { AlbertDock } from "@/components/_commons/ChatUI/AlbertDock";
import { useAlbertConversation } from "@/components/_commons/ChatUI/AlbertConversationProvider";

// Isolé dans son propre composant : useEnv s'appuie sur useSuspenseQuery et ne
// doit suspendre que le contenu de la modale ouverte, jamais l'application.
const HistoriqueConversations = ({ chatIdCourant }: { chatIdCourant: string }) => {
  const ffHistorique = useEnv("NEXT_PUBLIC_FF_HISTORIQUE_ALBERT");
  const { selectionnerConversation, demarrerNouvelleConversation } =
    useAlbertConversation();

  if (!ffHistorique) return null;

  return (
    <ConversationHistoryDrawer
      chatIdCourant={chatIdCourant}
      onNouvelleConversation={demarrerNouvelleConversation}
      onSelectionner={selectionnerConversation}
    />
  );
};

export const AlbertOverlay = () => {
  const { conversation, affichage, fermer } = useAlbertConversation();

  if (!conversation) return null;

  if (affichage === "minimise") {
    return <AlbertDock conversation={conversation} />;
  }

  return (
    <ModalePleinEcran
      onOpenChange={(ouvert) => {
        if (!ouvert) fermer();
      }}
      open
      title="Synthèse de territoire"
    >
      <div className="flex h-full">
        <HistoriqueConversations chatIdCourant={conversation.chat.id} />
        <div className="relative flex-1">
          <ChatUI
            className="h-full"
            conversation={conversation}
            key={conversation.chat.id}
            placeholder="Posez une question sur ce territoire..."
            scenarios={conversation.scenarios}
            showExperimentationBanner
          />
        </div>
      </div>
    </ModalePleinEcran>
  );
};
```

- [ ] **Step 4: Monter le provider dans `MiseEnPage`**

Dans `MiseEnPage.tsx`, remplacer le bloc `ClientOnly` qui entoure `children` :

```tsx
<ClientOnly>
  <AlbertConversationProvider>
    <div className="flex grow flex-col" id="main">
      {children}
    </div>
    <AlbertOverlay />
  </AlbertConversationProvider>
</ClientOnly>
```

- [ ] **Step 5: Réduire `BoutonSyntheseTerritoire` à un déclencheur**

Tout l'état local (conversation, `isOpen`, query `recuperer`, modale, drawer) disparaît :

```tsx
// src/client/components/PageAccueil/BoutonSyntheseTerritoire.tsx
import { récupérerDétailsSurUnTerritoire } from "@/client/constants/territoires";
import { Icone } from "@/components/_commons/Icone";
import { SparklingIcon } from "@/components/_commons/Icones/SparklingIcon";
import type { ChatScenarios } from "@/components/_commons/ChatUI/ChatEmptyState";
import { useAlbertConversation } from "@/components/_commons/ChatUI/AlbertConversationProvider";

export const BoutonSyntheseTerritoire = ({
  territoireCode,
  jalon,
  scenarios,
}: {
  territoireCode: string;
  jalon: number;
  scenarios: ChatScenarios;
}) => {
  const { ouvrir } = useAlbertConversation();
  const territoire = récupérerDétailsSurUnTerritoire(territoireCode);

  return (
    <button
      aria-label="Ouvrir Albert"
      className="flex gap-2 rounded-lg px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/5"
      onClick={() =>
        ouvrir({
          scenarios,
          agentContext: {
            jalon,
            territoireCode,
            instructions: `Le territoire courant de l'utilisateur est ${territoire.nomAffiché} (code : ${territoireCode}). Utilise ce territoire par défaut lorsque l'utilisateur ne précise pas de territoire dans sa question.`,
          },
        })
      }
      type="button"
    >
      <Icone className="h-4 w-4" icone={SparklingIcon} />
    </button>
  );
};
```

`ChatScenarios` est désormais importé depuis `ChatEmptyState` : vérifier que les deux layouts (`BasePageAccueilLayout.tsx`, `PageAccueilLegacy.tsx`) compilent toujours, `ChatUI.tsx` continuant de ré-exporter le type.

- [ ] **Step 6: Vérifier la compilation et les tests**

Run: `pnpm lint:tsc && pnpm lint:eslint && pnpm test:client`
Expected: PASS.

- [ ] **Step 7: Vérifier le comportement dans l'application**

Run: `pnpm dev`, se connecter avec un profil autorisé, ouvrir Albert depuis l'accueil, poser une question, puis fermer la modale.
Expected: la modale s'ouvre et se ferme comme avant ; aucun dock n'apparaît (seul un lien interne minimise, Task 8).

- [ ] **Step 8: Commit**

```bash
git add src/client/components/_commons/ChatUI/AlbertConversationProvider.tsx \
        src/client/components/_commons/ChatUI/AlbertOverlay.tsx \
        src/client/components/_commons/ChatUI/AlbertDock.tsx \
        src/client/components/_commons/MiseEnPage/MiseEnPage.tsx \
        src/client/components/PageAccueil/BoutonSyntheseTerritoire.tsx
git commit -m "feat(ppg): la conversation Albert vit au niveau applicatif (PIL-1690)"
```

---

### Task 6: Persistance inconditionnelle

Le feature flag ne pilote plus que l'affichage de l'historique. La persistance devient la règle, condition nécessaire à la restauration après rechargement (Task 7).

**Files:**
- Modify: `src/app/api/albert/chat/route.ts:168-190`

**Interfaces:**
- Consumes: rien de nouveau.
- Produces: la route répond toujours avec `originalMessages` et le `onFinish` d'enregistrement.

- [ ] **Step 1: Supprimer le court-circuit**

Remplacer le bloc qui commence à `const persistanceActive =` par :

```ts
const enregistrerConversation = container.resolve(
  "enregistrerConversationUseCase",
);

return result.toUIMessageStreamResponse<PiloteUIMessage>({
  originalMessages: messagesPilote,
  onError: onErreurFlux,
  onFinish: async ({ messages: messagesFinaux }) => {
    await enregistrerConversation.execute({
      id: body.id,
      utilisateurId: session.user.id,
      messages: messagesFinaux,
      contexte: agentContext ?? null,
    });
  },
});
```

La variable `variables` reste utilisée plus haut pour `construireFeatureFlipsAskAI` — ne pas la supprimer.

- [ ] **Step 2: Vérifier la compilation**

Run: `pnpm lint:tsc && pnpm lint:eslint`
Expected: PASS, sans variable `persistanceActive` inutilisée.

- [ ] **Step 3: Vérifier la persistance dans l'application**

Run: `pnpm dev` avec `NEXT_PUBLIC_FF_HISTORIQUE_ALBERT` absent ou à `false`, poser une question à Albert, puis interroger la base :

```bash
psql "$DATABASE_URL" -c 'select id, titre from chat_conversation order by updated_at desc limit 1;'
```

Expected: une ligne correspondant à la conversation, alors même que le flag est inactif.

- [ ] **Step 4: Commit**

```bash
git add src/app/api/albert/chat/route.ts
git commit -m "feat(ppg): persiste les conversations Albert indépendamment du flag d'historique (PIL-1690)"
```

---

### Task 7: Restauration après rechargement

Le sessionStorage porte l'identifiant et le contexte ; les messages sont relus depuis la base. En cas d'échec, le dock ne réapparaît simplement pas.

**Files:**
- Create: `src/client/components/_commons/ChatUI/conversationMinimiseeStockage.ts`
- Create: `src/client/components/_commons/ChatUI/conversationMinimiseeStockage.unit.test.ts`
- Modify: `src/client/components/_commons/ChatUI/AlbertConversationProvider.tsx`

**Interfaces:**
- Consumes: `AgentContextAlbert` (Task 4).
- Produces:
  - `type ConversationMinimisee = { id: string; agentContext: AgentContextAlbert }`
  - `lireConversationMinimisee(): ConversationMinimisee | null`
  - `ecrireConversationMinimisee(conversation: ConversationMinimisee): void`
  - `effacerConversationMinimisee(): void`

- [ ] **Step 1: Écrire le test qui échoue**

```ts
// src/client/components/_commons/ChatUI/conversationMinimiseeStockage.unit.test.ts
import {
  ecrireConversationMinimisee,
  effacerConversationMinimisee,
  lireConversationMinimisee,
} from "@/components/_commons/ChatUI/conversationMinimiseeStockage";

const conversation = {
  id: "0199a1ce-0000-7000-8000-000000000001",
  agentContext: {
    territoireCode: "NAT-FR",
    jalon: 2025,
    instructions: "Contexte",
  },
};

describe("conversationMinimiseeStockage", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  test("relit ce qui a été écrit", () => {
    // Given
    ecrireConversationMinimisee(conversation);

    // When
    const relue = lireConversationMinimisee();

    // Then
    expect(relue).toStrictEqual(conversation);
  });

  test("retourne null quand rien n'a été écrit", () => {
    // When
    const relue = lireConversationMinimisee();

    // Then
    expect(relue).toStrictEqual(null);
  });

  test("retourne null et nettoie quand le contenu stocké est invalide", () => {
    // Given
    sessionStorage.setItem("albert:conversation", '{"id":"pas-un-uuid"}');

    // When
    const relue = lireConversationMinimisee();

    // Then
    expect(relue).toStrictEqual(null);
    expect(sessionStorage.getItem("albert:conversation")).toStrictEqual(null);
  });

  test("efface l'entrée", () => {
    // Given
    ecrireConversationMinimisee(conversation);

    // When
    effacerConversationMinimisee();

    // Then
    expect(lireConversationMinimisee()).toStrictEqual(null);
  });
});
```

- [ ] **Step 2: Lancer le test pour vérifier qu'il échoue**

Run: `pnpm test:client conversationMinimiseeStockage`
Expected: FAIL — le module n'existe pas.

- [ ] **Step 3: Écrire l'implémentation**

```ts
// src/client/components/_commons/ChatUI/conversationMinimiseeStockage.ts
import { z } from "zod";

const CLE = "albert:conversation";

const conversationMinimiseeSchema = z.object({
  id: z.string().uuid(),
  agentContext: z.object({
    territoireCode: z.string(),
    jalon: z.number(),
    instructions: z.string(),
  }),
});

export type ConversationMinimisee = z.infer<typeof conversationMinimiseeSchema>;

export const lireConversationMinimisee = (): ConversationMinimisee | null => {
  const brut = sessionStorage.getItem(CLE);
  if (!brut) return null;

  try {
    const resultat = conversationMinimiseeSchema.safeParse(JSON.parse(brut));
    if (resultat.success) return resultat.data;
  } catch {
    // Contenu illisible : traité comme une absence.
  }

  sessionStorage.removeItem(CLE);
  return null;
};

export const ecrireConversationMinimisee = (
  conversation: ConversationMinimisee,
): void => {
  sessionStorage.setItem(CLE, JSON.stringify(conversation));
};

export const effacerConversationMinimisee = (): void => {
  sessionStorage.removeItem(CLE);
};
```

- [ ] **Step 4: Lancer les tests pour vérifier qu'ils passent**

Run: `pnpm test:client conversationMinimiseeStockage`
Expected: PASS — 4 tests.

- [ ] **Step 5: Brancher le stockage dans le provider**

Dans `AlbertConversationProvider.tsx` :

- `minimiser` écrit l'entrée :
  ```tsx
  const minimiser = useCallback(() => {
    setConversation((courante) => {
      if (courante) {
        ecrireConversationMinimisee({
          id: courante.chat.id,
          agentContext: courante.agentContext,
        });
      }
      return courante;
    });
    setAffichage("minimise");
  }, []);
  ```
- `fermer` appelle `effacerConversationMinimisee()`.
- Le chargement depuis la base sert deux cas — la restauration au montage et la sélection dans le drawer — qui ne diffèrent que par l'affichage visé. On les modélise avec un seul état :

  ```tsx
  type ChargementConversation = {
    demande: ConversationMinimisee;
    affichageCible: AffichageAlbert;
  };

  const [chargement, setChargement] = useState<ChargementConversation | null>(null);

  useEffect(() => {
    const stockee = lireConversationMinimisee();
    if (stockee) {
      setChargement({ demande: stockee, affichageCible: "minimise" });
    }
  }, []);

  const { data: conversationChargee, isError } =
    api.albert.conversations.recuperer.useQuery(
      { id: chargement?.demande.id ?? "" },
      { enabled: chargement !== null, retry: false },
    );

  useEffect(() => {
    if (!chargement) return;

    if (isError) {
      effacerConversationMinimisee();
      setChargement(null);
      return;
    }

    if (!conversationChargee) return;

    setConversation(
      construire({
        id: chargement.demande.id,
        agentContext: chargement.demande.agentContext,
        messages: conversationChargee.messages,
      }),
    );
    setAffichage(chargement.affichageCible);
    setChargement(null);
  }, [chargement, conversationChargee, isError, construire]);
  ```

- `remplacer` disparaît au profit de deux fonctions distinctes. Le contexte de la nouvelle conversation est repris de la conversation courante — c'est le territoire et le jalon depuis lesquels l'utilisateur a ouvert Albert.

  ```tsx
  const demarrerNouvelleConversation = useCallback(() => {
    if (!conversation) return;
    conversation.chat.stop();
    effacerConversationMinimisee();
    setConversation(
      construire({
        id: crypto.randomUUID(),
        agentContext: conversation.agentContext,
        scenarios: conversation.scenarios,
      }),
    );
    setAffichage("plein-ecran");
  }, [conversation, construire]);

  const selectionnerConversation = useCallback(
    (id: string) => {
      if (!conversation) return;
      conversation.chat.stop();
      effacerConversationMinimisee();
      setChargement({
        demande: { id, agentContext: conversation.agentContext },
        affichageCible: "plein-ecran",
      });
    },
    [conversation],
  );
  ```

  Mettre à jour le `useMemo` de la valeur du contexte pour exposer ces deux fonctions et non plus `remplacer`.

- [ ] **Step 6: Vérifier le comportement dans l'application**

Run: `pnpm dev`, ouvrir Albert, poser une question, attendre la fin de la réponse, minimiser via un lien (ou temporairement via la console : `sessionStorage` sera peuplé après la Task 8), recharger la page.
Expected: le dock réapparaît avec le titre de la conversation ; le restaurer affiche les messages. Si la conversation n'a jamais terminé de tour, aucun dock et aucune erreur en console.

- [ ] **Step 7: Commit**

```bash
git add src/client/components/_commons/ChatUI/conversationMinimiseeStockage.ts \
        src/client/components/_commons/ChatUI/conversationMinimiseeStockage.unit.test.ts \
        src/client/components/_commons/ChatUI/AlbertConversationProvider.tsx
git commit -m "feat(ppg): restaure la conversation minimisée après un rechargement (PIL-1690)"
```

---

### Task 8: Câblage des liens et interception du clic

La jonction entre les deux tickets : les réponses affichent des liens, et cliquer minimise la conversation avant de naviguer.

**Files:**
- Modify: `src/client/components/_commons/ChatUI/ChatContext.tsx`
- Modify: `src/client/components/_commons/ChatUI/ChatUI.tsx`
- Modify: `src/client/components/_commons/ChatUI/AssistantMessageText.tsx`
- Create: `src/client/components/_commons/ChatUI/AssistantMessageText.integration.test.tsx`

**Interfaces:**
- Consumes: `extraireChantiersCites` (Task 1), `construireUrlChantier` (Task 2), `remarkLiensChantiers` + `OptionsLiensChantiers` (Task 3), `useAlbertConversation` (Task 5).
- Produces: `ChatContext` expose `optionsLiensChantiers: OptionsLiensChantiers`.

- [ ] **Step 1: Étendre `ChatContext`**

```tsx
// src/client/components/_commons/ChatUI/ChatContext.tsx
import { createContext, PropsWithChildren, useContext, useMemo } from "react";
import type { ChatStatus } from "ai";
import type { OptionsLiensChantiers } from "@/components/_commons/ChatUI/remarkLiensChantiers";

type ChatContextValue = {
  sendMessage: (params: { text: string }) => void;
  fillInput: (text: string) => void;
  status: ChatStatus;
  error: Error | undefined;
  stop: () => void;
  optionsLiensChantiers: OptionsLiensChantiers;
};
```

et, dans `ChatContextProvider`, ajouter `optionsLiensChantiers` aux paramètres déstructurés, à l'objet du `useMemo` et à son tableau de dépendances. Le reste du fichier est inchangé.

- [ ] **Step 2: Calculer les options dans `ChatUI`**

```tsx
const optionsLiensChantiers = useMemo(() => {
  const contexte = {
    territoireCode: conversation.corpsRequete.agentContext?.territoireCode,
    jalon: conversation.corpsRequete.agentContext?.jalon,
  };
  return {
    chantiers: extraireChantiersCites(messages),
    construireUrl: (chantier: ChantierCite) =>
      construireUrlChantier({ chantier, contexte }),
  };
}, [messages, conversation]);
```

et le passer au `ChatContextProvider`.

- [ ] **Step 3: Écrire le test de rendu qui échoue**

```tsx
// src/client/components/_commons/ChatUI/AssistantMessageText.integration.test.tsx
import { render, screen } from "@testing-library/react";
import { AssistantMessageText } from "@/components/_commons/ChatUI/AssistantMessageText";
import { ChatContextProvider } from "@/components/_commons/ChatUI/ChatContext";
import type { ChantierCite } from "@/components/_commons/ChatUI/extraireChantiersCites";

const chantiers = new Map<string, ChantierCite>([
  ["CH-050", { id: "CH-050", nom: "Sécurité routière" }],
]);

const afficher = (texte: string) =>
  render(
    <ChatContextProvider
      error={undefined}
      fillInput={() => {}}
      optionsLiensChantiers={{
        chantiers,
        construireUrl: (chantier) => `/chantier/${chantier.id}/NAT-FR`,
      }}
      sendMessage={() => {}}
      status="ready"
      stop={() => {}}
    >
      <AssistantMessageText text={texte} />
    </ChatContextProvider>,
  );

describe("AssistantMessageText", () => {
  test("rend un lien interne pour un chantier de la whitelist", () => {
    // Given
    const texte = "Voir **CH-050 — Sécurité routière** pour le détail.";

    // When
    afficher(texte);

    // Then
    expect(
      screen.getByRole("link", { name: "CH-050 — Sécurité routière" }),
    ).toHaveAttribute("href", "/chantier/CH-050/NAT-FR");
  });

  test("laisse en texte un chantier absent de la whitelist", () => {
    // Given
    const texte = "Le chantier CH-999 n'existe pas.";

    // When
    afficher(texte);

    // Then
    expect(screen.queryByRole("link")).toStrictEqual(null);
  });
});
```

Le test a besoin de `next/router` : ajouter en tête du fichier

```tsx
vi.mock("next/router", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));
```

- [ ] **Step 4: Lancer le test pour vérifier qu'il échoue**

Run: `pnpm test:client AssistantMessageText`
Expected: FAIL — aucun lien n'est rendu.

- [ ] **Step 5: Appliquer le plugin et l'override de lien**

Dans `AssistantMessageText.tsx`, remplacer la constante `remarkPlugins` figée et le rendu :

```tsx
const LienMarkdown = ({
  href,
  children,
}: {
  href?: string;
  children?: ReactNode;
}) => {
  const router = useRouter();
  const { minimiser } = useAlbertConversation();

  if (!href?.startsWith("/")) {
    return (
      <a href={href} rel="noopener noreferrer" target="_blank">
        {children}
      </a>
    );
  }

  return (
    <a
      href={href}
      onClick={(event) => {
        // Laisse passer clic-milieu, Ctrl/Cmd-clic et « ouvrir dans un nouvel onglet ».
        if (event.defaultPrevented || event.metaKey || event.ctrlKey) return;
        event.preventDefault();
        minimiser();
        router.push(href);
      }}
    >
      {children}
    </a>
  );
};

const composants = { a: LienMarkdown };

export const AssistantMessageText = memo(function AssistantMessageText({
  text,
}: {
  text: string;
}) {
  const { optionsLiensChantiers } = useChatContext();
  const sanitized = stripParagraphesVides(stripPseudoToolCalls(text));
  const remarkPlugins = useMemo(
    () => [remarkGfm, [remarkLiensChantiers, optionsLiensChantiers]],
    [optionsLiensChantiers],
  );

  return (
    <div className="albert-markdown">
      <ReactMarkdown components={composants} remarkPlugins={remarkPlugins}>
        {sanitized}
      </ReactMarkdown>
    </div>
  );
});
```

`stripPseudoToolCalls` et `stripParagraphesVides` restent inchangés et gardent leurs tests éventuels.

- [ ] **Step 6: Lancer les tests pour vérifier qu'ils passent**

Run: `pnpm test:client AssistantMessageText`
Expected: PASS — 2 tests.

- [ ] **Step 7: Vérifier l'ensemble**

Run: `pnpm lint:tsc && pnpm lint:eslint && pnpm test:client`
Expected: PASS.

- [ ] **Step 8: Vérifier le parcours complet dans l'application**

Run: `pnpm dev`, ouvrir Albert, demander « quels sont les chantiers en retard ? », cliquer sur un chantier cité.
Expected: la modale se ferme, la fiche chantier s'affiche, le dock apparaît en bas à droite ; naviguer encore une fois le laisse en place ; le restaurer retrouve les mêmes messages.

- [ ] **Step 9: Commit**

```bash
git add src/client/components/_commons/ChatUI/ChatContext.tsx \
        src/client/components/_commons/ChatUI/ChatUI.tsx \
        src/client/components/_commons/ChatUI/AssistantMessageText.tsx \
        src/client/components/_commons/ChatUI/AssistantMessageText.integration.test.tsx
git commit -m "feat(ppg): liens internes vers les chantiers cités par Albert (PIL-1693)"
```

---

### Task 9: Test end-to-end du parcours

Couvre les critères d'acceptation comportementaux de PIL-1690 sans dépendre du LLM : la route de chat est interceptée et renvoie un flux figé.

**Files:**
- Modify: `.env.e2e`
- Create: `tests/albert-liens-chantiers.spec.ts`

**Interfaces:**
- Consumes: `AppActions.loginAs()` de `tests/actions/app.actions.ts`.
- Produces: rien.

- [ ] **Step 1: Activer Albert dans l'environnement e2e**

Ajouter à `.env.e2e` — les cinq flips de profil couvrent tous les profils listés dans `FEATURE_FLIP_PAR_PROFIL` (`accesAskAI.ts:13`), donc le test ne dépend pas du profil de `E2E_USERNAME` :

```
NEXT_PUBLIC_FF_ASK_AI=true
NEXT_PUBLIC_FF_ASK_AI_DITP_ADMIN=true
NEXT_PUBLIC_FF_ASK_AI_EQUIPE_DIR_PROJET=true
NEXT_PUBLIC_FF_ASK_AI_DITP_PILOTAGE=true
NEXT_PUBLIC_FF_ASK_AI_COORDINATEUR=true
```

Attention : si `featureFlipAdmin` est actif, une valeur en base écrase l'env (`RecupererToutesLesVariablesContenuUseCase.run`). Vérifier alors que `variable_contenu` ne contient pas ces clés à `false`.

- [ ] **Step 2: Écrire le test**

Le flux respecte le format `UIMessageChunk` de `ai` v7 (`node_modules/ai/dist/index.d.ts:2280`) : un `start`, un tool call complet, puis le texte.

```ts
// tests/albert-liens-chantiers.spec.ts
import { test, expect } from "@playwright/test";
import { AppActions } from "./actions/app.actions";
import { E2ETestContext } from "./e2e-test-context";

const CHANTIER = { id: "CH-050", nom: "Sécurité routière" };

const chunks = [
  { type: "start" },
  { type: "start-step" },
  {
    type: "tool-input-available",
    toolCallId: "appel-1",
    toolName: "search_chantiers",
    input: { query: "sécurité routière" },
  },
  {
    type: "tool-output-available",
    toolCallId: "appel-1",
    output: {
      chantiers: [CHANTIER],
      reasoning: "",
      _output_instructions: "",
    },
  },
  { type: "text-start", id: "texte-1" },
  {
    type: "text-delta",
    id: "texte-1",
    delta: `Le chantier **${CHANTIER.id} — ${CHANTIER.nom}** est concerné.`,
  },
  { type: "text-end", id: "texte-1" },
  { type: "finish-step" },
  { type: "finish" },
];

const corpsFluxSSE = [
  ...chunks.map((chunk) => `data: ${JSON.stringify(chunk)}\n\n`),
  "data: [DONE]\n\n",
].join("");

test.describe("Albert — liens vers les chantiers et conversation minimisée", () => {
  test("cliquer un chantier ouvre sa fiche et conserve la conversation", async ({
    page,
  }) => {
    const actions = new AppActions(page, new E2ETestContext());
    await actions.loginAs();

    await page.route("**/api/albert/chat", (route) =>
      route.fulfill({
        status: 200,
        headers: { "content-type": "text/event-stream" },
        body: corpsFluxSSE,
      }),
    );

    await page.getByRole("button", { name: "Ouvrir Albert" }).first().click();
    await page
      .getByPlaceholder("Posez une question sur ce territoire...")
      .fill("Quels chantiers sur la sécurité routière ?");
    await page.keyboard.press("Enter");

    const lien = page.getByRole("link", {
      name: `${CHANTIER.id} — ${CHANTIER.nom}`,
    });
    await expect(lien).toBeVisible();

    await lien.click();

    await expect(page).toHaveURL(new RegExp(`/chantier/${CHANTIER.id}/`));
    await expect(
      page.getByRole("button", { name: "Reprendre la conversation" }),
    ).toBeVisible();

    await page.getByRole("button", { name: "Reprendre la conversation" }).click();
    await expect(lien).toBeVisible();
  });
});
```

- [ ] **Step 3: Lancer le test**

Run: `pnpm test:e2e albert-liens-chantiers`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add .env.e2e tests/albert-liens-chantiers.spec.ts
git commit -m "test(ppg): e2e du parcours lien chantier et conversation minimisée (PIL-1690 / PIL-1693)"
```

---

## Vérification finale

- [ ] `pnpm lint` (ESLint + tsc) passe.
- [ ] `pnpm test:client` passe.
- [ ] `pnpm test:server` passe — aucune modification serveur n'a de test dédié, mais `route.ts` et `GetChantiersQuery.ts` ont été touchés.
- [ ] `pnpm test:e2e` passe.
- [ ] Relecture manuelle des critères d'acceptation des deux tickets face au comportement observé en `pnpm dev`.
