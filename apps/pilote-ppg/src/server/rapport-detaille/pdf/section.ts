import {
  Content,
  ContentStack,
  TDocumentDefinitions,
} from "pdfmake/interfaces";
import { sectionTitlePdf } from "@/server/pdf/primitives";
import { rem } from "@/server/pdf/units";

type PageBreakBefore = NonNullable<TDocumentDefinitions["pageBreakBefore"]>;

const HEADLINE = 1;
const AVOID_BREAK_INSIDE = 2;

export function avoidBreakInside(content: ContentStack): ContentStack {
  return { ...content, headlineLevel: AVOID_BREAK_INSIDE };
}

export function section(titre: string, content: Content): Content {
  return avoidBreakInside({
    stack: [sectionTitlePdf(titre), content],
    margin: [0, rem(1), 0, rem(1)],
  });
}

export const keepHeadlineWithNext: PageBreakBefore = (
  currentNode,
  nodeQueries,
) =>
  currentNode.headlineLevel === HEADLINE &&
  nodeQueries
    .getFollowingNodesOnPage()
    .every((node) => node.stack || node.headlineLevel === HEADLINE);

export const moveOverflowingBlockToNextPage: PageBreakBefore = (
  currentNode,
  nodeQueries,
) => {
  if (currentNode.headlineLevel !== AVOID_BREAK_INSIDE) return false;
  if (currentNode.pageNumbers.length < 2) return false;
  const { pageNumber, top } = currentNode.startPosition;
  return nodeQueries
    .getPreviousNodesOnPage()
    .some(
      (node) =>
        node.startPosition.pageNumber === pageNumber &&
        node.startPosition.top < top,
    );
};

export const rapportDetaillePageBreakBefore: PageBreakBefore = (
  currentNode,
  nodeQueries,
) =>
  keepHeadlineWithNext(currentNode, nodeQueries) ||
  moveOverflowingBlockToNextPage(currentNode, nodeQueries);
