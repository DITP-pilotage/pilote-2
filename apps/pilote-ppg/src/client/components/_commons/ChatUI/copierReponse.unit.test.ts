import { construireHtmlReponse } from "@/components/_commons/ChatUI/copierReponse";

vi.mock("html-to-image", () => ({
  toPng: async () => "data:image/png;base64,AAAA",
}));

describe("construireHtmlReponse", () => {
  test("assemble le texte et l'image du dashboard dans l'ordre du message", async () => {
    // Given
    const racine = document.createElement("div");
    racine.innerHTML = [
      `<div data-bloc-copiable="texte"><p class="albert-markdown">Introduction</p></div>`,
      `<div data-bloc-copiable="dashboard"><h3>Dashboard Sarthe</h3></div>`,
      `<div data-bloc-copiable="texte"><p>Conclusion</p></div>`,
      `<span>Albert</span>`,
    ].join("");

    // When
    const html = await construireHtmlReponse({ racine });

    // Then
    expect(html).toStrictEqual(
      `<meta charset="utf-8"><p>Introduction</p><p><img src="data:image/png;base64,AAAA" alt="Tableau de bord"></p><p>Conclusion</p>`,
    );
  });

  test("rend absolus les liens internes pour qu'ils restent valides une fois collés", async () => {
    // Given
    const racine = document.createElement("div");
    racine.innerHTML = `<div data-bloc-copiable="texte"><p><a href="/chantier/CH-050/NAT-FR">CH-050</a></p></div>`;

    // When
    const html = await construireHtmlReponse({ racine });

    // Then
    expect(html).toStrictEqual(
      `<meta charset="utf-8"><p><a href="${window.location.origin}/chantier/CH-050/NAT-FR">CH-050</a></p>`,
    );
  });
});
