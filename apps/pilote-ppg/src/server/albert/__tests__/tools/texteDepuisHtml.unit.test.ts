import { texteDepuisHtml } from "@/server/albert/tools/texteDepuisHtml";

describe("texteDepuisHtml", () => {
  test.each([
    [
      "les retours à la ligne d'un paragraphe",
      "<p>Au 3ème trimestre, hausse.<br>En revanche, baisse.<br/>Vigilance.</p>",
      "Au 3ème trimestre, hausse.\nEn revanche, baisse.\nVigilance.",
    ],
    ["les paragraphes", "<p>Premier.</p><p>Second.</p>", "Premier.\n\nSecond."],
    ["les listes", "<ul><li>Un</li><li>Deux</li></ul>", "• Un\n• Deux"],
    [
      "les entités courantes",
      "L&#39;emploi&nbsp;industriel &amp; l&#x27;agro &lt;3",
      "L'emploi industriel & l'agro <3",
    ],
    [
      "un texte sans balise",
      "Deux postes restent vacants.",
      "Deux postes restent vacants.",
    ],
  ])("convertit %s", (_cas, html, attendu) => {
    // When
    const texte = texteDepuisHtml({ html });

    // Then
    expect(texte).toEqual(attendu);
  });
});
