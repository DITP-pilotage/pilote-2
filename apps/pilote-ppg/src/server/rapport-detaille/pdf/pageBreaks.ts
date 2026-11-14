import { Content, TDocumentDefinitions } from "pdfmake/interfaces";
import { withMarianne } from "@/server/pdf/pdfmake";

type PageBreakRule = NonNullable<TDocumentDefinitions["pageBreakBefore"]>;

type BreakCandidate = {
  id?: string;
  headlineLevel?: number;
  pageBreak?: string;
};

class PageBreakFound {
  constructor(readonly id: string) {}
}

class LayoutChecked {}

function isBreakCandidate(value: object): value is BreakCandidate {
  return "headlineLevel" in value && typeof value.headlineLevel === "number";
}

function collectBreakCandidates(
  value: unknown,
  candidates: Map<string, BreakCandidate>,
  nextId: () => string,
): void {
  if (Array.isArray(value)) {
    value.forEach((item) => collectBreakCandidates(item, candidates, nextId));
    return;
  }
  if (typeof value !== "object" || value === null) return;
  if (isBreakCandidate(value)) {
    value.id ??= nextId();
    candidates.set(value.id, value);
  }
  Object.entries(value).forEach(([key, entry]) => {
    if (key !== "svg") collectBreakCandidates(entry, candidates, nextId);
  });
}

function forgetPreviousEvaluation(value: unknown): void {
  if (Array.isArray(value)) {
    value.forEach(forgetPreviousEvaluation);
    return;
  }
  if (typeof value !== "object" || value === null) return;
  Reflect.deleteProperty(value, "pageBreakCalculated");
  Object.entries(value).forEach(([key, entry]) => {
    if (key !== "svg") forgetPreviousEvaluation(entry);
  });
}

async function findFirstPageBreak(
  document: TDocumentDefinitions,
  rule: PageBreakRule,
  candidates: Map<string, BreakCandidate>,
): Promise<string | null> {
  try {
    await withMarianne()
      .createPdf({
        ...document,
        pageBreakBefore: (node, nodeQueries) => {
          if (
            typeof node.id === "string" &&
            candidates.has(node.id) &&
            rule(node, nodeQueries)
          ) {
            throw new PageBreakFound(node.id);
          }
          if (
            nodeQueries.getFollowingNodesOnPage().length === 0 &&
            nodeQueries.getNodesOnNextPage().length === 0
          ) {
            throw new LayoutChecked();
          }
          return false;
        },
      })
      .getBuffer();
  } catch (error) {
    if (error instanceof PageBreakFound) return error.id;
    if (error instanceof LayoutChecked) return null;
    throw error;
  }
  return null;
}

/**
 * pdfmake ne réévalue jamais `pageBreakBefore` sur un nœud déjà examiné et refait la mise
 * en page de tout le document à chaque saut ajouté. Chaque groupe commence sur une
 * nouvelle page : ses sauts ne dépendent que de lui. On les place donc groupe par groupe,
 * sur un petit document, en réévaluant tout le groupe après chaque saut, puis on fige les
 * sauts trouvés en `pageBreak: "before"` pour le rendu final.
 */
export async function placePageBreaks(
  settings: Omit<TDocumentDefinitions, "content" | "pageBreakBefore">,
  rule: PageBreakRule,
  groups: Content[],
): Promise<void> {
  let candidateCount = 0;
  const nextId = () => `page-break-candidate-${candidateCount++}`;
  for (const group of groups) {
    const candidates = new Map<string, BreakCandidate>();
    collectBreakCandidates(group, candidates, nextId);
    if (candidates.size === 0) continue;
    for (;;) {
      forgetPreviousEvaluation(group);
      const id = await findFirstPageBreak(
        { ...settings, content: group },
        rule,
        candidates,
      );
      const candidate = id === null ? undefined : candidates.get(id);
      if (candidate === undefined) break;
      candidate.pageBreak = "before";
    }
  }
}
