import { Content, TDocumentDefinitions } from "pdfmake/interfaces";
import { sectionTitlePdf } from "@/server/pdf/primitives";
import { rem } from "@/server/pdf/units";

export function section(titre: string, content: Content): Content {
  return {
    stack: [sectionTitlePdf(titre), content],
    margin: [0, rem(1), 0, rem(1)],
  };
}

export const keepHeadlineWithNext: TDocumentDefinitions["pageBreakBefore"] = (
  currentNode,
  nodeQueries,
) =>
  currentNode.headlineLevel === 1 &&
  nodeQueries.getFollowingNodesOnPage().length === 0;
