import { Node, NodeQueries } from "pdfmake/interfaces";
import { keepHeadlineWithNext } from "@/server/rapport-detaille/pdf/section";

function node(overrides: Partial<Node>): Node {
  return {
    pageNumbers: [1],
    pages: 1,
    stack: false,
    startPosition: {
      pageNumber: 1,
      pageOrientation: "portrait",
      pageInnerHeight: 1000,
      pageInnerWidth: 700,
      left: 0,
      top: 0,
      verticalRatio: 0,
      horizontalRatio: 0,
    },
    ...overrides,
  };
}

const container = node({ stack: true });
const headline = (text: string) => node({ text, headlineLevel: 1 });
const paragraph = node({ text: "contenu" });

function breaksBefore(node: Node, followingNodesOnPage: Node[]): boolean {
  const queries: NodeQueries = {
    getFollowingNodesOnPage: () => followingNodesOnPage,
    getNodesOnNextPage: () => [],
    getPreviousNodesOnPage: () => [],
  };
  return keepHeadlineWithNext?.(node, queries) ?? false;
}

describe("keepHeadlineWithNext", () => {
  it("saute une page avant un titre seul en bas de page", () => {
    expect(breaksBefore(headline("Objectifs"), [])).toBe(true);
  });

  it("saute une page avant un titre suivi seulement d'autres titres sur sa page", () => {
    expect(
      breaksBefore(headline("Indicateurs"), [
        container,
        headline("Autres indicateurs (1)"),
        container,
      ]),
    ).toBe(true);
  });

  it("garde un titre suivi de contenu sur sa page", () => {
    expect(
      breaksBefore(headline("Indicateurs"), [
        container,
        headline("Autres indicateurs (1)"),
        container,
        paragraph,
      ]),
    ).toBe(false);
  });

  it("ne déplace jamais un nœud qui n'est pas un titre", () => {
    expect(breaksBefore(paragraph, [])).toBe(false);
  });
});
