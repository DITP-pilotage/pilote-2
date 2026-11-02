import { Node, NodeQueries } from "pdfmake/interfaces";
import {
  avoidBreakInside,
  keepHeadlineWithNext,
  moveOverflowingBlockToNextPage,
} from "@/server/rapport-detaille/pdf/section";

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
  return keepHeadlineWithNext(node, queries);
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

function startingAt(pageNumber: number, top: number) {
  return {
    pageNumber,
    pageOrientation: "portrait" as const,
    pageInnerHeight: 1000,
    pageInnerWidth: 700,
    left: 0,
    top,
    verticalRatio: top / 1000,
    horizontalRatio: 0,
  };
}

const { headlineLevel: avoidBreakInsideLevel } = avoidBreakInside({
  stack: [],
});

function blockToKeepWhole(pageNumbers: number[], top: number): Node {
  return node({
    stack: true,
    headlineLevel: avoidBreakInsideLevel,
    pageNumbers,
    startPosition: startingAt(pageNumbers[0], top),
  });
}

function movesToNextPage(block: Node, previousNodesOnPage: Node[]): boolean {
  const queries: NodeQueries = {
    getFollowingNodesOnPage: () => [],
    getNodesOnNextPage: () => [],
    getPreviousNodesOnPage: () => previousNodesOnPage,
  };
  return moveOverflowingBlockToNextPage(block, queries);
}

describe("moveOverflowingBlockToNextPage", () => {
  const chantierStartingOnPage3 = node({
    stack: true,
    pageNumbers: [3, 4],
    startPosition: startingAt(3, 0),
  });
  const contentAbove = node({
    text: "Responsables",
    pageNumbers: [3],
    startPosition: startingAt(3, 200),
  });

  it("repousse à la page suivante un bloc commencé en cours de page qui déborde", () => {
    expect(
      movesToNextPage(blockToKeepWhole([3, 4], 600), [
        chantierStartingOnPage3,
        contentAbove,
      ]),
    ).toBe(true);
  });

  it("laisse en place un bloc qui tient sur sa page", () => {
    expect(
      movesToNextPage(blockToKeepWhole([3], 600), [
        chantierStartingOnPage3,
        contentAbove,
      ]),
    ).toBe(false);
  });

  it("coupe un bloc trop grand pour une page quand il commence déjà en haut de page", () => {
    expect(
      movesToNextPage(blockToKeepWhole([3, 4], 0), [chantierStartingOnPage3]),
    ).toBe(false);
  });

  it("ignore les blocs qui peuvent être coupés", () => {
    expect(
      movesToNextPage(
        node({
          stack: true,
          pageNumbers: [3, 4],
          startPosition: startingAt(3, 600),
        }),
        [chantierStartingOnPage3, contentAbove],
      ),
    ).toBe(false);
  });
});
