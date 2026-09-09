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
