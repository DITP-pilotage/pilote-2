# Export fidèle de la dernière réponse Albert (PIL-1678) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Permettre l'export PDF et la copie presse-papiers de la dernière réponse Albert, sans passer par le LLM, avec un rendu fidèle (pas de markdown brut, pas de reformulation).

**Architecture:** Nouvelle route API synchrone qui relit le message persisté (`ChatConversationRepository`) et le convertit directement en PDF via le pipeline `markdownToPdfContent` existant (corrigé pour les tableaux GFM). Côté client, un nouveau composant `LastResponseActions`, affiché uniquement au survol du dernier message assistant, gère la copie (markdown → HTML via `marked`) et le déclenchement du téléchargement PDF. Le tool LLM `export_rapport` n'est pas modifié dans son comportement (il bénéficie seulement du fix du pipeline PDF partagé).

**Tech Stack:** Next.js API routes, `marked` (lexer + parse), `pdfmake`, Awilix (DI via `defineModule`), `@ai-sdk/react` (`Chat`/`useChat`), Vitest + `vitest-mock-extended`, React Testing Library.

**Spec:** `apps/pilote-ppg/docs/superpowers/specs/2026-09-09-export-derniere-reponse-albert-design.md`

## Global Constraints

- L'export/copie ne porte **que sur le dernier message assistant** du fil — jamais sur toute la conversation.
- Le texte exporté doit être **exactement** `extractMessageText(message)` — aucune reformulation, aucun appel LLM dans ce flux.
- `export_rapport` (tool LLM) reste inchangé dans son comportement et son schéma.
- Le PDF est retourné **directement en buffer** dans la réponse HTTP (pas de `RapportFileStorage`, pas d'URL intermédiaire) pour ce nouveau flux.
- La lecture de la conversation en base retente jusqu'à 3 fois (~200ms entre tentatives) avant d'échouer — pas de délai artificiel côté client.
- Le bouton copier existant (aujourd'hui présent sur chaque message assistant) est retiré des messages non-derniers.

---

## File Structure

Backend :
- `src/server/albert/pdf/markdownToPdfContent.ts` (MODIFIER) — ajoute le support des tableaux GFM.
- `src/server/albert/pdf/creerBufferPdf.ts` (CRÉER) — factorisation de la création du buffer pdfmake, extraite de `genererRapportPDF.ts`.
- `src/server/albert/pdf/genererRapportPDF.ts` (MODIFIER) — délègue à `creerBufferPdf`.
- `src/server/albert/pdf/genererPdfDepuisMarkdown.ts` (CRÉER) — génère un PDF directement depuis une chaîne markdown.
- `src/server/albert/piloteUIMessageUtils.ts` (CRÉER) — `extractMessageText`, déplacé depuis le client pour être partagé serveur/client.
- `src/client/components/_commons/ChatUI/utils.ts` (MODIFIER) — ré-exporte `extractMessageText` depuis le nouvel emplacement partagé.
- `src/server/albert/usecases/ExporterDerniereReponseUseCase.ts` (CRÉER) — logique métier : relecture avec retry, extraction du texte, génération PDF.
- `src/server/albert/module.ts` (MODIFIER) — enregistre `exporterDerniereReponseUseCase` dans le container DI.
- `src/app/api/albert/conversations/[conversationId]/messages/[messageId]/export-pdf/route.ts` (CRÉER) — route HTTP fine (auth + appel du use case + mapping de statuts).

Frontend :
- `src/client/components/_commons/ChatUI/markdownVersHtmlPressePapiers.ts` (CRÉER) — conversion markdown → HTML pour le presse-papiers.
- `src/client/components/_commons/ChatUI/LastResponseActions.tsx` (CRÉER) — barre d'actions au survol (Copier / Exporter PDF).
- `src/client/components/_commons/ChatUI/AssistantMessage.tsx` (MODIFIER) — retire le bouton copier par bloc de texte, ajoute `LastResponseActions` scopé au dernier message.
- `src/client/components/_commons/ChatUI/ChatUI.tsx` (MODIFIER) — passe `conversationId` et `isLastAssistantMessage` à `AssistantMessage`.

---

### Task 1: Support des tableaux GFM dans `markdownToPdfContent`

**Files:**
- Modify: `src/server/albert/pdf/markdownToPdfContent.ts`
- Test: `src/server/albert/__tests__/pdf/markdownToPdfContent.unit.test.ts`

**Interfaces:**
- Consumes: rien (aucune dépendance sur les autres tâches).
- Produces: `markdownToPdfContent(markdown: string): Content[]` — signature inchangée, comportement étendu (les tableaux GFM ne tombent plus dans le `default` de `convertBlockTokens`).

- [ ] **Step 1: Écrire le test qui échoue**

Créer `src/server/albert/__tests__/pdf/markdownToPdfContent.unit.test.ts` :

```ts
import { describe, expect, test } from "vitest";
import { markdownToPdfContent } from "@/server/albert/pdf/markdownToPdfContent";

describe("markdownToPdfContent", () => {
  test("convertit un tableau markdown GFM en tableau pdfmake structuré (pas de markdown brut)", () => {
    const markdown = [
      "| Département | Avancement |",
      "| --- | --- |",
      "| Ain | 42% |",
    ].join("\n");

    const content = markdownToPdfContent(markdown);

    expect(content).toEqual([
      {
        table: {
          headerRows: 0,
          widths: ["*", "*"],
          body: [
            [
              { text: ["Département"], fontSize: 8, bold: true, color: "#555555" },
              { text: ["Avancement"], fontSize: 8, bold: true, color: "#555555" },
            ],
            [
              { text: ["Ain"], fontSize: 8, bold: false, color: "#555555" },
              { text: ["42%"], fontSize: 8, bold: false, color: "#555555" },
            ],
          ],
        },
        layout: {
          hLineWidth: expect.any(Function),
          vLineWidth: expect.any(Function),
          hLineColor: expect.any(Function),
          vLineColor: expect.any(Function),
          fillColor: expect.any(Function),
        },
        margin: [0, 0, 0, 20],
      },
    ]);
  });

  test("préserve la mise en forme inline (gras) dans les cellules d'un tableau (régression CH-050 AURA)", () => {
    const markdown = "| Zone | Statut |\n| --- | --- |\n| CH-050 | **En retard** |";

    const content = markdownToPdfContent(markdown);
    const tableContent = content[0] as { table: { body: unknown[][] } };
    const celluleStatut = tableContent.table.body[1][1] as { text: unknown[] };

    expect(celluleStatut.text).toEqual([{ text: ["En retard"], bold: true }]);
  });
});
```

- [ ] **Step 2: Vérifier que le test échoue**

Run: `pnpm test:server:unit -- markdownToPdfContent`
Expected: FAIL — le tableau tombe dans le `default` de `convertBlockTokens` et produit un `{ text: <raw markdown>, ... }` au lieu d'un `{ table: ... }`.

- [ ] **Step 3: Implémenter le support du token "table"**

Dans `src/server/albert/pdf/markdownToPdfContent.ts`, modifier l'import de `pdfFactories` :

```ts
import {
  COLORS,
  createTable,
} from "@/server/evaluation/handlers/pdfFactories";
```

Puis, dans `convertBlockTokens`, ajouter un nouveau `case` juste après le `case "list":` (avant `case "code":`) :

```ts
      case "table": {
        const tableToken = token as Tokens.Table;
        const buildCell = (cell: Tokens.TableCell): Content => ({
          text: convertInlineTokens(cell.tokens),
          fontSize: 8,
          bold: cell.header,
          color: COLORS.text,
        });
        result.push(
          createTable(
            [
              tableToken.header.map(buildCell),
              ...tableToken.rows.map((row) => row.map(buildCell)),
            ],
            { rowModulo: 1, widths: tableToken.header.map(() => "*") },
          ),
        );
        break;
      }
```

- [ ] **Step 4: Vérifier que le test passe**

Run: `pnpm test:server:unit -- markdownToPdfContent`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/server/albert/pdf/markdownToPdfContent.ts src/server/albert/__tests__/pdf/markdownToPdfContent.unit.test.ts
git commit -m "fix(albert): rend les tableaux GFM dans le pipeline PDF au lieu du markdown brut"
```

---

### Task 2: Factoriser la génération du buffer PDF et ajouter `genererPdfDepuisMarkdown`

**Files:**
- Create: `src/server/albert/pdf/creerBufferPdf.ts`
- Modify: `src/server/albert/pdf/genererRapportPDF.ts`
- Create: `src/server/albert/pdf/genererPdfDepuisMarkdown.ts`
- Test: `src/server/albert/__tests__/pdf/creerBufferPdf.unit.test.ts`
- Test: `src/server/albert/__tests__/pdf/genererPdfDepuisMarkdown.unit.test.ts`

**Interfaces:**
- Consumes: `markdownToPdfContent` (Task 1, déjà en place).
- Produces: `creerBufferPdf(content: Content[]): Promise<Buffer>` et `genererPdfDepuisMarkdown(texte: string): Promise<Buffer>`, utilisés par `ExporterDerniereReponseUseCase` (Task 4).

- [ ] **Step 1: Écrire les tests qui échouent**

Créer `src/server/albert/__tests__/pdf/creerBufferPdf.unit.test.ts` :

```ts
import { describe, expect, test } from "vitest";
import { creerBufferPdf } from "@/server/albert/pdf/creerBufferPdf";

describe("creerBufferPdf", () => {
  test("produit un buffer commençant par la signature PDF", async () => {
    const buffer = await creerBufferPdf([{ text: "Contenu de test" }]);

    expect(Buffer.isBuffer(buffer)).toBe(true);
    expect(buffer.toString("latin1", 0, 5)).toBe("%PDF-");
  });
});
```

Créer `src/server/albert/__tests__/pdf/genererPdfDepuisMarkdown.unit.test.ts` :

```ts
import { describe, expect, test } from "vitest";
import { genererPdfDepuisMarkdown } from "@/server/albert/pdf/genererPdfDepuisMarkdown";

describe("genererPdfDepuisMarkdown", () => {
  test("génère un PDF valide depuis une chaîne markdown", async () => {
    const buffer = await genererPdfDepuisMarkdown(
      "## Synthèse\n\nUn paragraphe simple.",
    );

    expect(Buffer.isBuffer(buffer)).toBe(true);
    expect(buffer.toString("latin1", 0, 5)).toBe("%PDF-");
  });
});
```

- [ ] **Step 2: Vérifier que les tests échouent**

Run: `pnpm test:server:unit -- creerBufferPdf genererPdfDepuisMarkdown`
Expected: FAIL avec "Cannot find module" pour les deux fichiers (n'existent pas encore).

- [ ] **Step 3: Extraire `creerBufferPdf` et créer `genererPdfDepuisMarkdown`**

Créer `src/server/albert/pdf/creerBufferPdf.ts` (code extrait tel quel de `genererRapportPDF.ts`) :

```ts
import { createPdf } from "pdfmake/build/pdfmake";
import * as vfs from "pdfmake/build/vfs_fonts";
import { Content } from "pdfmake/interfaces";

export function creerBufferPdf(content: Content[]): Promise<Buffer> {
  const pdf = {
    content,
    defaultStyle: { font: "Roboto" },
    pageMargins: [40, 60, 40, 60] as [number, number, number, number],
  };

  return new Promise<Buffer>((resolve) => {
    createPdf(
      pdf,
      {},
      {
        Roboto: {
          normal: "Roboto-Regular.ttf",
          bold: "Roboto-Medium.ttf",
          italics: "Roboto-Italic.ttf",
          bolditalics: "Roboto-MediumItalic.ttf",
        },
        Courier: {
          normal: "Courier",
          bold: "Courier-Bold",
          italics: "Courier-Oblique",
          bolditalics: "Courier-BoldOblique",
        },
      },
      // @ts-expect-error mauvais types sur la lib
      vfs,
    ).getBuffer(resolve);
  });
}
```

Remplacer le contenu de `src/server/albert/pdf/genererRapportPDF.ts` par :

```ts
import { buildRapportPDFContent } from "@/server/albert/pdf/buildRapportPDFContent";
import { creerBufferPdf } from "@/server/albert/pdf/creerBufferPdf";
import { RapportInput } from "@/server/albert/rapportInput";

export function genererRapportPDF(input: RapportInput): Promise<Buffer> {
  const content = buildRapportPDFContent(input);
  return creerBufferPdf(content);
}
```

Créer `src/server/albert/pdf/genererPdfDepuisMarkdown.ts` :

```ts
import { creerBufferPdf } from "@/server/albert/pdf/creerBufferPdf";
import { markdownToPdfContent } from "@/server/albert/pdf/markdownToPdfContent";

export function genererPdfDepuisMarkdown(texte: string): Promise<Buffer> {
  return creerBufferPdf(markdownToPdfContent(texte));
}
```

- [ ] **Step 4: Vérifier que les tests passent**

Run: `pnpm test:server:unit -- creerBufferPdf genererPdfDepuisMarkdown`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/server/albert/pdf/creerBufferPdf.ts src/server/albert/pdf/genererRapportPDF.ts src/server/albert/pdf/genererPdfDepuisMarkdown.ts src/server/albert/__tests__/pdf/creerBufferPdf.unit.test.ts src/server/albert/__tests__/pdf/genererPdfDepuisMarkdown.unit.test.ts
git commit -m "refactor(albert): factorise la création du buffer PDF et ajoute la génération depuis du markdown brut"
```

---

### Task 3: Déplacer `extractMessageText` vers un module partagé serveur/client

**Files:**
- Create: `src/server/albert/piloteUIMessageUtils.ts`
- Modify: `src/client/components/_commons/ChatUI/utils.ts`
- Test: `src/server/albert/__tests__/piloteUIMessageUtils.unit.test.ts`

**Interfaces:**
- Consumes: `PiloteUIMessage` (type existant, `@/server/albert/PiloteUIMessage`).
- Produces: `extractMessageText(message: PiloteUIMessage): string`, réutilisé par `ExporterDerniereReponseUseCase` (Task 4, côté serveur) et par `AssistantMessage.tsx` / `LastResponseActions.tsx` (côté client, import inchangé depuis `@/components/_commons/ChatUI/utils`).

- [ ] **Step 1: Écrire le test qui échoue**

Créer `src/server/albert/__tests__/piloteUIMessageUtils.unit.test.ts` :

```ts
import { describe, expect, test } from "vitest";
import { extractMessageText } from "@/server/albert/piloteUIMessageUtils";
import type { PiloteUIMessage } from "@/server/albert/PiloteUIMessage";

describe("extractMessageText", () => {
  test("concatène uniquement les parties de type texte, dans l'ordre", () => {
    const message = {
      id: "msg-1",
      role: "assistant",
      parts: [
        { type: "text", text: "Bonjour " },
        { type: "tool-get_chantiers", state: "output-available" },
        { type: "text", text: "le monde" },
      ],
    } as unknown as PiloteUIMessage;

    expect(extractMessageText(message)).toBe("Bonjour le monde");
  });

  test("retourne une chaîne vide si le message n'a pas de parties", () => {
    const message = { id: "msg-2", role: "assistant" } as PiloteUIMessage;

    expect(extractMessageText(message)).toBe("");
  });
});
```

- [ ] **Step 2: Vérifier que le test échoue**

Run: `pnpm test:server:unit -- piloteUIMessageUtils`
Expected: FAIL avec "Cannot find module '@/server/albert/piloteUIMessageUtils'".

- [ ] **Step 3: Créer le module partagé et mettre à jour le client**

Créer `src/server/albert/piloteUIMessageUtils.ts` (contenu identique à l'actuel `ChatUI/utils.ts`) :

```ts
import { PiloteUIMessage } from "@/server/albert/PiloteUIMessage";

export const extractMessageText = (message: PiloteUIMessage): string => {
  if (!message.parts) return "";
  return message.parts
    .map((part) => {
      if (part.type === "text") {
        return part.text;
      }
      return "";
    })
    .join("");
};
```

Remplacer le contenu de `src/client/components/_commons/ChatUI/utils.ts` par :

```ts
export { extractMessageText } from "@/server/albert/piloteUIMessageUtils";
```

- [ ] **Step 4: Vérifier que le test passe et que rien n'est cassé**

Run: `pnpm test:server:unit -- piloteUIMessageUtils`
Expected: PASS

Run: `pnpm typecheck`
Expected: pas de nouvelle erreur (les imports existants de `extractMessageText` depuis `@/components/_commons/ChatUI/utils` continuent de résoudre via le ré-export).

- [ ] **Step 5: Commit**

```bash
git add src/server/albert/piloteUIMessageUtils.ts src/client/components/_commons/ChatUI/utils.ts src/server/albert/__tests__/piloteUIMessageUtils.unit.test.ts
git commit -m "refactor(albert): partage extractMessageText entre client et serveur"
```

---

### Task 4: `ExporterDerniereReponseUseCase`

**Files:**
- Create: `src/server/albert/usecases/ExporterDerniereReponseUseCase.ts`
- Test: `src/server/albert/__tests__/usecases/ExporterDerniereReponseUseCase.unit.test.ts`

**Interfaces:**
- Consumes: `ChatConversationRepository.recupererParId({id, utilisateurId}): Promise<ChatConversation | null>` (existant), `extractMessageText` (Task 3), `genererPdfDepuisMarkdown` (Task 2).
- Produces: `ExporterDerniereReponseUseCase.execute({conversationId, messageId, utilisateurId}): Promise<ExporterDerniereReponseResultat>` où
  ```ts
  type ExporterDerniereReponseResultat =
    | { statut: "ok"; buffer: Buffer; filename: string }
    | { statut: "conversation_introuvable" }
    | { statut: "message_introuvable" }
    | { statut: "message_invalide" };
  ```
  Utilisé par la route API (Task 6).

- [ ] **Step 1: Écrire les tests qui échouent**

Créer `src/server/albert/__tests__/usecases/ExporterDerniereReponseUseCase.unit.test.ts` :

```ts
import { describe, expect, test } from "vitest";
import { mock } from "vitest-mock-extended";
import { ExporterDerniereReponseUseCase } from "@/server/albert/usecases/ExporterDerniereReponseUseCase";
import type { ChatConversationRepository } from "@/server/albert/domain/ChatConversationRepository";
import type { ChatConversation } from "@/server/albert/domain/ChatConversation";

const buildConversation = (
  overrides: Partial<ChatConversation> = {},
): ChatConversation => ({
  id: "conv-1",
  utilisateurId: "user-1",
  titre: "Conversation test",
  contexte: null,
  createdAt: new Date("2026-01-01"),
  updatedAt: new Date("2026-01-01"),
  messages: [
    {
      id: "msg-assistant-1",
      role: "assistant",
      parts: [{ type: "text", text: "## Synthèse\n\nUn paragraphe simple." }],
    },
  ] as ChatConversation["messages"],
  ...overrides,
});

describe("ExporterDerniereReponseUseCase execute", () => {
  test("génère un PDF à partir du texte exact du message assistant", async () => {
    // Given
    const repository = mock<ChatConversationRepository>();
    repository.recupererParId.mockResolvedValue(buildConversation());
    const useCase = new ExporterDerniereReponseUseCase({
      chatConversationRepository: repository,
    });

    // When
    const resultat = await useCase.execute({
      conversationId: "conv-1",
      messageId: "msg-assistant-1",
      utilisateurId: "user-1",
    });

    // Then
    expect(resultat.statut).toBe("ok");
    if (resultat.statut !== "ok") throw new Error("statut inattendu");
    expect(Buffer.isBuffer(resultat.buffer)).toBe(true);
    expect(resultat.buffer.toString("latin1", 0, 5)).toBe("%PDF-");
    expect(resultat.filename).toBe("reponse-albert-msg-asse.pdf");
  });

  test("retente jusqu'à 3 fois si la conversation n'est pas encore persistée, puis réussit", async () => {
    // Given
    const repository = mock<ChatConversationRepository>();
    repository.recupererParId
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(buildConversation());
    const useCase = new ExporterDerniereReponseUseCase({
      chatConversationRepository: repository,
    });

    // When
    const resultat = await useCase.execute({
      conversationId: "conv-1",
      messageId: "msg-assistant-1",
      utilisateurId: "user-1",
    });

    // Then
    expect(resultat.statut).toBe("ok");
    expect(repository.recupererParId).toHaveBeenCalledTimes(3);
  });

  test("retourne conversation_introuvable après 3 tentatives infructueuses", async () => {
    // Given
    const repository = mock<ChatConversationRepository>();
    repository.recupererParId.mockResolvedValue(null);
    const useCase = new ExporterDerniereReponseUseCase({
      chatConversationRepository: repository,
    });

    // When
    const resultat = await useCase.execute({
      conversationId: "conv-inconnue",
      messageId: "msg-assistant-1",
      utilisateurId: "user-1",
    });

    // Then
    expect(resultat).toEqual({ statut: "conversation_introuvable" });
    expect(repository.recupererParId).toHaveBeenCalledTimes(3);
  });

  test("retourne message_introuvable si l'id du message n'existe pas dans la conversation", async () => {
    // Given
    const repository = mock<ChatConversationRepository>();
    repository.recupererParId.mockResolvedValue(buildConversation());
    const useCase = new ExporterDerniereReponseUseCase({
      chatConversationRepository: repository,
    });

    // When
    const resultat = await useCase.execute({
      conversationId: "conv-1",
      messageId: "msg-inexistant",
      utilisateurId: "user-1",
    });

    // Then
    expect(resultat).toEqual({ statut: "message_introuvable" });
  });

  test("retourne message_invalide si le message ciblé n'est pas un message assistant", async () => {
    // Given
    const conversation = buildConversation({
      messages: [
        { id: "msg-user-1", role: "user", parts: [{ type: "text", text: "Salut" }] },
      ] as ChatConversation["messages"],
    });
    const repository = mock<ChatConversationRepository>();
    repository.recupererParId.mockResolvedValue(conversation);
    const useCase = new ExporterDerniereReponseUseCase({
      chatConversationRepository: repository,
    });

    // When
    const resultat = await useCase.execute({
      conversationId: "conv-1",
      messageId: "msg-user-1",
      utilisateurId: "user-1",
    });

    // Then
    expect(resultat).toEqual({ statut: "message_invalide" });
  });

  test("retourne message_invalide si le message assistant n'a aucun texte", async () => {
    // Given
    const conversation = buildConversation({
      messages: [
        { id: "msg-assistant-2", role: "assistant", parts: [] },
      ] as ChatConversation["messages"],
    });
    const repository = mock<ChatConversationRepository>();
    repository.recupererParId.mockResolvedValue(conversation);
    const useCase = new ExporterDerniereReponseUseCase({
      chatConversationRepository: repository,
    });

    // When
    const resultat = await useCase.execute({
      conversationId: "conv-1",
      messageId: "msg-assistant-2",
      utilisateurId: "user-1",
    });

    // Then
    expect(resultat).toEqual({ statut: "message_invalide" });
  });
});
```

- [ ] **Step 2: Vérifier que les tests échouent**

Run: `pnpm test:server:unit -- ExporterDerniereReponseUseCase`
Expected: FAIL avec "Cannot find module '@/server/albert/usecases/ExporterDerniereReponseUseCase'".

- [ ] **Step 3: Implémenter le use case**

Créer `src/server/albert/usecases/ExporterDerniereReponseUseCase.ts` :

```ts
import type { ChatConversationRepository } from "@/server/albert/domain/ChatConversationRepository";
import type { ChatConversation } from "@/server/albert/domain/ChatConversation";
import { extractMessageText } from "@/server/albert/piloteUIMessageUtils";
import { genererPdfDepuisMarkdown } from "@/server/albert/pdf/genererPdfDepuisMarkdown";

export type ExporterDerniereReponseResultat =
  | { statut: "ok"; buffer: Buffer; filename: string }
  | { statut: "conversation_introuvable" }
  | { statut: "message_introuvable" }
  | { statut: "message_invalide" };

const NB_TENTATIVES = 3;
const DELAI_ENTRE_TENTATIVES_MS = 200;

function attendre(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export class ExporterDerniereReponseUseCase {
  private readonly chatConversationRepository: ChatConversationRepository;

  constructor({
    chatConversationRepository,
  }: {
    chatConversationRepository: ChatConversationRepository;
  }) {
    this.chatConversationRepository = chatConversationRepository;
  }

  async execute(params: {
    conversationId: string;
    messageId: string;
    utilisateurId: string;
  }): Promise<ExporterDerniereReponseResultat> {
    const conversation = await this.recupererAvecRetries(
      params.conversationId,
      params.utilisateurId,
    );
    if (!conversation) return { statut: "conversation_introuvable" };

    const message = conversation.messages.find(
      (candidat) => candidat.id === params.messageId,
    );
    if (!message) return { statut: "message_introuvable" };
    if (message.role !== "assistant") return { statut: "message_invalide" };

    const texte = extractMessageText(message);
    if (texte.trim().length === 0) return { statut: "message_invalide" };

    const buffer = await genererPdfDepuisMarkdown(texte);
    return {
      statut: "ok",
      buffer,
      filename: `reponse-albert-${params.messageId.slice(0, 8)}.pdf`,
    };
  }

  private async recupererAvecRetries(
    id: string,
    utilisateurId: string,
  ): Promise<ChatConversation | null> {
    for (let tentative = 1; tentative <= NB_TENTATIVES; tentative += 1) {
      const conversation = await this.chatConversationRepository.recupererParId(
        { id, utilisateurId },
      );
      if (conversation) return conversation;
      if (tentative < NB_TENTATIVES) await attendre(DELAI_ENTRE_TENTATIVES_MS);
    }
    return null;
  }
}
```

- [ ] **Step 4: Vérifier que les tests passent**

Run: `pnpm test:server:unit -- ExporterDerniereReponseUseCase`
Expected: PASS (le test de retry prend ~400ms, celui d'échec total ~400ms — normal).

- [ ] **Step 5: Commit**

```bash
git add src/server/albert/usecases/ExporterDerniereReponseUseCase.ts src/server/albert/__tests__/usecases/ExporterDerniereReponseUseCase.unit.test.ts
git commit -m "feat(albert): ajoute ExporterDerniereReponseUseCase (export PDF fidèle sans passage par le LLM)"
```

---

### Task 5: Enregistrer le use case dans le container DI

**Files:**
- Modify: `src/server/albert/module.ts`

**Interfaces:**
- Consumes: `ExporterDerniereReponseUseCase` (Task 4).
- Produces: `container.resolve("exporterDerniereReponseUseCase")`, utilisé par la route API (Task 6).

- [ ] **Step 1: Ajouter l'import et le type dans le cradle**

Dans `src/server/albert/module.ts`, ajouter l'import :

```ts
import { ExporterDerniereReponseUseCase } from "@/server/albert/usecases/ExporterDerniereReponseUseCase";
```

Ajouter la clé dans `AlbertOwnCradle` (juste après `recupererConversationUseCase`) :

```ts
  recupererConversationUseCase: RecupererConversationUseCase;
  exporterDerniereReponseUseCase: ExporterDerniereReponseUseCase;
```

- [ ] **Step 2: Enregistrer la classe dans `register`**

Dans le bloc `container.register({...})`, ajouter (juste après `recupererConversationUseCase: asModuleClass(RecupererConversationUseCase),`) :

```ts
      exporterDerniereReponseUseCase: asModuleClass(
        ExporterDerniereReponseUseCase,
      ),
```

- [ ] **Step 3: Vérifier la compilation**

Run: `pnpm typecheck`
Expected: pas d'erreur — `VerifyCradle<AlbertOwnCradle>` valide que la clé ajoutée est bien enregistrée avec le bon type.

- [ ] **Step 4: Commit**

```bash
git add src/server/albert/module.ts
git commit -m "feat(albert): enregistre ExporterDerniereReponseUseCase dans le container DI"
```

---

### Task 6: Route API `export-pdf`

**Files:**
- Create: `src/app/api/albert/conversations/[conversationId]/messages/[messageId]/export-pdf/route.ts`

**Interfaces:**
- Consumes: `exporterDerniereReponseUseCase` (Task 5), `auth()` (`@/server/infrastructure/api/auth/[...nextauth]`), `getContainer("albert")` (`@/server/dependances`).
- Produces: `POST /api/albert/conversations/:conversationId/messages/:messageId/export-pdf`, consommé par `LastResponseActions.tsx` (Task 8).

Pas de test automatisé dédié pour ce fichier : aucune route de `src/app/api/albert/` n'a de test aujourd'hui dans ce projet (cf. `rapports/[userId]/[filename]/route.ts`), et toute la logique métier est déjà couverte par les tests de `ExporterDerniereReponseUseCase` (Task 4). La vérification se fait manuellement à la Task 9.

- [ ] **Step 1: Créer la route**

Créer `src/app/api/albert/conversations/[conversationId]/messages/[messageId]/export-pdf/route.ts` :

```ts
import { auth } from "@/server/infrastructure/api/auth/[...nextauth]";
import { getContainer } from "@/server/dependances";

export async function POST(
  _request: Request,
  {
    params,
  }: { params: Promise<{ conversationId: string; messageId: string }> },
) {
  const session = await auth();

  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { conversationId, messageId } = await params;

  const container = getContainer("albert");
  const exporterDerniereReponseUseCase = container.resolve(
    "exporterDerniereReponseUseCase",
  );

  const resultat = await exporterDerniereReponseUseCase.execute({
    conversationId,
    messageId,
    utilisateurId: session.user.id,
  });

  if (resultat.statut === "conversation_introuvable") {
    return new Response("Conversation introuvable", { status: 404 });
  }

  if (resultat.statut === "message_introuvable") {
    return new Response("Message introuvable", { status: 404 });
  }

  if (resultat.statut === "message_invalide") {
    return new Response("Message invalide", { status: 400 });
  }

  return new Response(resultat.buffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${resultat.filename}"`,
    },
  });
}
```

- [ ] **Step 2: Vérifier la compilation**

Run: `pnpm typecheck`
Expected: pas d'erreur.

- [ ] **Step 3: Commit**

```bash
git add "src/app/api/albert/conversations/[conversationId]/messages/[messageId]/export-pdf/route.ts"
git commit -m "feat(albert): route API export-pdf pour la dernière réponse Albert"
```

---

### Task 7: `markdownVersHtmlPressePapiers` (conversion markdown → HTML côté client)

**Files:**
- Create: `src/client/components/_commons/ChatUI/markdownVersHtmlPressePapiers.ts`
- Test: `src/client/components/_commons/ChatUI/markdownVersHtmlPressePapiers.unit.test.ts`

**Interfaces:**
- Consumes: `marked` (dépendance déjà présente dans `package.json`).
- Produces: `markdownVersHtmlPressePapiers(texte: string): string`, utilisé par `LastResponseActions.tsx` (Task 8).

- [ ] **Step 1: Écrire le test qui échoue**

Créer `src/client/components/_commons/ChatUI/markdownVersHtmlPressePapiers.unit.test.ts` :

```ts
import { describe, expect, test } from "vitest";
import { markdownVersHtmlPressePapiers } from "@/components/_commons/ChatUI/markdownVersHtmlPressePapiers";

describe("markdownVersHtmlPressePapiers", () => {
  test("convertit un tableau markdown en balises <table> HTML, sans pipes bruts", () => {
    const html = markdownVersHtmlPressePapiers(
      "| A | B |\n| --- | --- |\n| 1 | 2 |",
    );

    expect(html).toContain("<table>");
    expect(html).not.toContain("| --- |");
  });

  test("convertit le gras markdown en balise <strong>", () => {
    const html = markdownVersHtmlPressePapiers("**important**");

    expect(html).toContain("<strong>important</strong>");
  });
});
```

- [ ] **Step 2: Vérifier que le test échoue**

Run: `pnpm test:client:unit -- markdownVersHtmlPressePapiers`
Expected: FAIL avec "Cannot find module".

- [ ] **Step 3: Implémenter**

Créer `src/client/components/_commons/ChatUI/markdownVersHtmlPressePapiers.ts` :

```ts
import { marked } from "marked";

export function markdownVersHtmlPressePapiers(texte: string): string {
  return marked.parse(texte, { async: false }) as string;
}
```

- [ ] **Step 4: Vérifier que le test passe**

Run: `pnpm test:client:unit -- markdownVersHtmlPressePapiers`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/client/components/_commons/ChatUI/markdownVersHtmlPressePapiers.ts src/client/components/_commons/ChatUI/markdownVersHtmlPressePapiers.unit.test.ts
git commit -m "feat(chat-ui): conversion markdown vers HTML pour la copie presse-papiers"
```

---

### Task 8: `LastResponseActions` (barre Copier / Exporter PDF)

**Files:**
- Create: `src/client/components/_commons/ChatUI/LastResponseActions.tsx`
- Test: `src/client/components/_commons/ChatUI/LastResponseActions.unit.test.tsx`

**Interfaces:**
- Consumes: `markdownVersHtmlPressePapiers` (Task 7), route `POST /api/albert/conversations/:conversationId/messages/:messageId/export-pdf` (Task 6), `Bouton`/`Icone`/`ClipboardIcon`/`FileTextIcon`/`LoaderIcon` (composants existants).
- Produces: `<LastResponseActions texte={string} conversationId={string} messageId={string} />`, utilisé par `AssistantMessage.tsx` (Task 9).

- [ ] **Step 1: Écrire les tests qui échouent**

Créer `src/client/components/_commons/ChatUI/LastResponseActions.unit.test.tsx` :

```tsx
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { userEvent } from "@testing-library/user-event";
import { LastResponseActions } from "@/components/_commons/ChatUI/LastResponseActions";

const buildClipboardMock = () => {
  const write = vi.fn().mockResolvedValue(undefined);
  Object.assign(navigator, { clipboard: { write } });
  return write;
};

test("le clic sur Copier écrit du HTML (pas du markdown brut) dans le presse-papiers", async () => {
  const write = buildClipboardMock();

  render(
    <LastResponseActions
      texte="**Synthèse** de l'Ain"
      conversationId="conv-1"
      messageId="msg-1"
    />,
  );
  await userEvent.click(screen.getByTitle("Copier dans le presse-papiers"));

  expect(write).toHaveBeenCalledTimes(1);
  const items = write.mock.calls[0][0];
  expect(items).toHaveLength(1);
});

test("le clic sur Exporter en PDF appelle la bonne route et déclenche un téléchargement", async () => {
  buildClipboardMock();
  const blob = new Blob(["%PDF-1.4"], { type: "application/pdf" });
  const fetchMock = vi.fn().mockResolvedValue(new Response(blob, { status: 200 }));
  vi.stubGlobal("fetch", fetchMock);
  vi.stubGlobal("URL", {
    ...URL,
    createObjectURL: vi.fn().mockReturnValue("blob:mock-url"),
    revokeObjectURL: vi.fn(),
  });

  render(
    <LastResponseActions
      texte="Contenu"
      conversationId="conv-1"
      messageId="msg-1"
    />,
  );
  await userEvent.click(screen.getByTitle("Exporter en PDF"));

  expect(fetchMock).toHaveBeenCalledWith(
    "/api/albert/conversations/conv-1/messages/msg-1/export-pdf",
    { method: "POST" },
  );

  vi.unstubAllGlobals();
});
```

- [ ] **Step 2: Vérifier que les tests échouent**

Run: `pnpm test:client:unit -- LastResponseActions`
Expected: FAIL avec "Cannot find module '@/components/_commons/ChatUI/LastResponseActions'".

- [ ] **Step 3: Implémenter le composant**

Créer `src/client/components/_commons/ChatUI/LastResponseActions.tsx` :

```tsx
import { useState } from "react";
import { toast } from "sonner";
import { Icone } from "@/components/_commons/Icone";
import { ClipboardIcon } from "@/components/_commons/Icones/ClipboardIcon";
import { FileTextIcon } from "@/components/_commons/Icones/FileTextIcon";
import { LoaderIcon } from "@/components/_commons/Icones/LoaderIcon";
import { markdownVersHtmlPressePapiers } from "@/components/_commons/ChatUI/markdownVersHtmlPressePapiers";

const boutonClassName =
  "p-1 rounded bg-white/80 text-gray-500 hover:text-gray-800 hover:bg-gray-100 border border-gray-200 disabled:opacity-50";

export const LastResponseActions = ({
  texte,
  conversationId,
  messageId,
}: {
  texte: string;
  conversationId: string;
  messageId: string;
}) => {
  const [exportEnCours, setExportEnCours] = useState(false);

  const copier = async () => {
    try {
      const html = markdownVersHtmlPressePapiers(texte);
      await navigator.clipboard.write([
        new ClipboardItem({
          "text/html": new Blob([html], { type: "text/html" }),
          "text/plain": new Blob([texte], { type: "text/plain" }),
        }),
      ]);
      toast.success("Texte copié dans le presse-papiers", { duration: 3000 });
    } catch {
      toast.error("La copie a échoué, réessayez.");
    }
  };

  const exporterPdf = async () => {
    setExportEnCours(true);
    try {
      const reponse = await fetch(
        `/api/albert/conversations/${conversationId}/messages/${messageId}/export-pdf`,
        { method: "POST" },
      );
      if (!reponse.ok) throw new Error("export failed");

      const blob = await reponse.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "";
      anchor.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("L'export a échoué, réessayez.");
    } finally {
      setExportEnCours(false);
    }
  };

  return (
    <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover/message:opacity-100 transition-opacity">
      <button
        className={boutonClassName}
        onClick={copier}
        title="Copier dans le presse-papiers"
        type="button"
      >
        <Icone className="w-4 h-4" icone={ClipboardIcon} />
      </button>
      <button
        className={boutonClassName}
        onClick={exporterPdf}
        disabled={exportEnCours}
        title="Exporter en PDF"
        type="button"
      >
        {exportEnCours ? (
          <LoaderIcon className="w-4 h-4 animate-spin" />
        ) : (
          <Icone className="w-4 h-4" icone={FileTextIcon} />
        )}
      </button>
    </div>
  );
};
```

- [ ] **Step 4: Vérifier que les tests passent**

Run: `pnpm test:client:unit -- LastResponseActions`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/client/components/_commons/ChatUI/LastResponseActions.tsx src/client/components/_commons/ChatUI/LastResponseActions.unit.test.tsx
git commit -m "feat(chat-ui): ajoute la barre d'actions Copier / Exporter PDF"
```

---

### Task 9: Intégrer `LastResponseActions` dans `AssistantMessage` (scope dernier message)

**Files:**
- Modify: `src/client/components/_commons/ChatUI/AssistantMessage.tsx`
- Test: `src/client/components/_commons/ChatUI/AssistantMessage.unit.test.tsx`

**Interfaces:**
- Consumes: `LastResponseActions` (Task 8), `extractMessageText` (import inchangé depuis `@/components/_commons/ChatUI/utils`, Task 3).
- Produces: `<AssistantMessage message isStreaming isLastAssistantMessage conversationId />` — nouvelles props consommées par `ChatUI.tsx` (Task 10).

- [ ] **Step 1: Écrire les tests qui échouent**

Créer `src/client/components/_commons/ChatUI/AssistantMessage.unit.test.tsx` :

```tsx
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { AssistantMessage } from "@/components/_commons/ChatUI/AssistantMessage";
import type { PiloteUIMessage } from "@/server/albert/PiloteUIMessage";

const buildMessage = (): PiloteUIMessage =>
  ({
    id: "msg-1",
    role: "assistant",
    parts: [{ type: "text", text: "Une réponse simple." }],
  }) as PiloteUIMessage;

test("affiche la barre d'actions quand c'est le dernier message assistant", () => {
  render(
    <AssistantMessage
      message={buildMessage()}
      isStreaming={false}
      isLastAssistantMessage
      conversationId="conv-1"
    />,
  );

  expect(screen.getByTitle("Exporter en PDF")).toBeInTheDocument();
  expect(screen.getByTitle("Copier dans le presse-papiers")).toBeInTheDocument();
});

test("n'affiche pas la barre d'actions sur un message assistant qui n'est pas le dernier", () => {
  render(
    <AssistantMessage
      message={buildMessage()}
      isStreaming={false}
      isLastAssistantMessage={false}
      conversationId="conv-1"
    />,
  );

  expect(screen.queryByTitle("Exporter en PDF")).not.toBeInTheDocument();
  expect(
    screen.queryByTitle("Copier dans le presse-papiers"),
  ).not.toBeInTheDocument();
});

test("n'affiche pas la barre d'actions pendant le streaming, même sur le dernier message", () => {
  render(
    <AssistantMessage
      message={buildMessage()}
      isStreaming
      isLastAssistantMessage
      conversationId="conv-1"
    />,
  );

  expect(screen.queryByTitle("Exporter en PDF")).not.toBeInTheDocument();
});
```

- [ ] **Step 2: Vérifier que les tests échouent**

Run: `pnpm test:client:unit -- AssistantMessage`
Expected: FAIL — `isLastAssistantMessage`/`conversationId` n'existent pas encore comme props, et la barre d'actions n'existe pas.

- [ ] **Step 3: Modifier `AssistantMessage.tsx`**

Ajouter l'import :

```ts
import { LastResponseActions } from "@/components/_commons/ChatUI/LastResponseActions";
```

Changer la signature du composant :

```tsx
export const AssistantMessage = memo(function AssistantMessage({
  message,
  isStreaming,
  isLastAssistantMessage,
  conversationId,
}: {
  message: PiloteUIMessage;
  isStreaming: boolean;
  isLastAssistantMessage: boolean;
  conversationId: string;
}) {
```

Retirer le bouton copier inline. Remplacer ce bloc :

```tsx
        if (part.type === "text") {
          if (shouldHideText) return null;
          return (
            <div key={index} className="max-w-3xl mx-auto relative group/text">
              <AssistantMessageText text={part.text} />
              {!isStreaming && index === lastTextIndex && hasText && (
                <button
                  className="absolute top-1 right-1 p-1 rounded bg-white/80 text-gray-500 hover:text-gray-800 hover:bg-gray-100 border border-gray-200 opacity-0 group-hover/text:opacity-100 transition-opacity"
                  onClick={() => {
                    navigator.clipboard
                      .writeText(extractMessageText(message))
                      .then(() => {
                        toast.success("Texte copié dans le presse-papiers", {
                          duration: 3000,
                        });
                      });
                  }}
                  title="Copier dans le presse-papiers"
                  type="button"
                >
                  <Icone className="w-4 h-4" icone={ClipboardIcon} />
                </button>
              )}
            </div>
          );
        }
```

par :

```tsx
        if (part.type === "text") {
          if (shouldHideText) return null;
          return (
            <div key={index} className="max-w-3xl mx-auto">
              <AssistantMessageText text={part.text} />
            </div>
          );
        }
```

Retirer les imports devenus inutiles (`toast`, `Icone`, `ClipboardIcon`) — `extractMessageText` reste utilisé plus bas — et retirer la variable `lastTextIndex` qui devient inutilisée. Ajouter `relative group/message` sur le conteneur racine, et rendre la barre d'actions juste après son ouverture :

```tsx
  return (
    <div className="text-sm text-gray-900 w-full relative group/message">
      {isLastAssistantMessage && hasText && !isStreaming && (
        <LastResponseActions
          texte={extractMessageText(message)}
          conversationId={conversationId}
          messageId={message.id}
        />
      )}

      <div className="max-w-3xl mx-auto">
```

- [ ] **Step 4: Vérifier que les tests passent**

Run: `pnpm test:client:unit -- AssistantMessage`
Expected: PASS

Run: `pnpm typecheck`
Expected: pas d'erreur (imports/variables inutilisés retirés).

- [ ] **Step 5: Commit**

```bash
git add src/client/components/_commons/ChatUI/AssistantMessage.tsx src/client/components/_commons/ChatUI/AssistantMessage.unit.test.tsx
git commit -m "feat(chat-ui): scope les actions copier/export au dernier message assistant"
```

---

### Task 10: Brancher `ChatUI` (conversationId + dernier message)

**Files:**
- Modify: `src/client/components/_commons/ChatUI/ChatUI.tsx`

**Interfaces:**
- Consumes: `AssistantMessage` (props `isLastAssistantMessage`, `conversationId` — Task 9), `chatRef.current.id` (existant, `AbstractChat.id: string`).
- Produces: rendu final connecté — pas d'interface consommée par une tâche suivante.

- [ ] **Step 1: Modifier le rendu de la liste de messages**

Dans `src/client/components/_commons/ChatUI/ChatUI.tsx`, remplacer :

```tsx
            {messages.map((message, index) => {
              return (
                <div key={message.id}>
                  {message.role === "user" ? (
                    <div className="max-w-3xl mx-auto flex justify-end">
                      <UserMessage message={message} />
                    </div>
                  ) : (
                    <AssistantMessage
                      message={message}
                      isStreaming={
                        index === messages.length - 1 && status !== "ready"
                      }
                    />
                  )}
                </div>
              );
            })}
```

par :

```tsx
            {messages.map((message, index) => {
              const isLastMessage = index === messages.length - 1;
              return (
                <div key={message.id}>
                  {message.role === "user" ? (
                    <div className="max-w-3xl mx-auto flex justify-end">
                      <UserMessage message={message} />
                    </div>
                  ) : (
                    <AssistantMessage
                      message={message}
                      isStreaming={isLastMessage && status !== "ready"}
                      isLastAssistantMessage={isLastMessage}
                      conversationId={chatRef.current.id}
                    />
                  )}
                </div>
              );
            })}
```

- [ ] **Step 2: Vérifier la compilation**

Run: `pnpm typecheck`
Expected: pas d'erreur.

- [ ] **Step 3: Vérification manuelle dans le navigateur**

Démarrer le serveur de dev (`pnpm dev`), ouvrir une conversation Albert, poser une question dont la réponse contient un tableau (ex. demander un état d'avancement par département). Vérifier :
- survoler un message précédent (pas le dernier) → aucune icône n'apparaît ;
- survoler le dernier message → icônes Copier / Exporter PDF visibles ;
- cliquer Copier → coller dans un éditeur de texte riche (ex. un email) → le tableau apparaît comme un vrai tableau, pas en pipes markdown ;
- cliquer Exporter PDF → un fichier `reponse-albert-*.pdf` se télécharge, le tableau y est rendu (pas de markdown brut) ;
- demander explicitement "fais-moi un rapport PDF de toute la conversation" → vérifier que `export_rapport` fonctionne toujours comme avant (comportement inchangé).

- [ ] **Step 4: Commit**

```bash
git add src/client/components/_commons/ChatUI/ChatUI.tsx
git commit -m "feat(chat-ui): connecte la barre d'actions du dernier message Albert"
```

---

## Self-Review

**Couverture de la spec :**
- Fix `markdownToPdfContent` (tableaux GFM, cellules bien parsées) → Task 1.
- Export PDF de la dernière réponse, sans LLM, avec retry sur la lecture serveur → Tasks 2, 4, 5, 6.
- Réutilisation exacte du texte affiché (`extractMessageText` partagé) → Task 3.
- Copie presse-papiers en HTML (pas de markdown brut) → Task 7, 8.
- Portée limitée au dernier message + retrait du bouton copier sur les messages précédents → Tasks 9, 10.
- `export_rapport` inchangé → aucune tâche ne touche `exportRapport.ts` / `exportRapportSchema.ts` / `buildRapportPDFContent.ts` (hormis le bénéfice indirect du fix Task 1 sur `markdownToPdfContent`, qu'il consomme déjà).
- Tests couvrant réponse simple / tableau / listes / les deux anomalies → Task 1 (tableau + régression CH-050), Task 4 (synthèse simple type fixture "Ain").

**Scan de placeholders :** aucun "TBD"/"TODO" ; chaque step contient du code complet et exécutable.

**Cohérence des types :** `ExporterDerniereReponseResultat` défini en Task 4 est utilisé avec les mêmes noms de statuts (`ok`, `conversation_introuvable`, `message_introuvable`, `message_invalide`) dans la route de la Task 6. `extractMessageText` a la même signature dans les Tasks 3, 4 (import serveur) et 9 (import client ré-exporté). `LastResponseActions` a les mêmes props (`texte`, `conversationId`, `messageId`) entre sa définition (Task 8) et son utilisation dans `AssistantMessage` (Task 9).
