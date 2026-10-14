import { construireContenuCopie } from "@/components/_commons/ChatUI/copierReponse";

vi.mock("html-to-image", () => ({
  toBlob: async () => new Blob(["png"], { type: "image/png" }),
}));

describe("construireContenuCopie", () => {
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
    const { html } = construireContenuCopie({ racine });

    // Then
    expect(await html).toStrictEqual(
      `<meta charset="utf-8"><p>Introduction</p><p><img src="data:image/png;base64,cG5n" alt="Tableau de bord"></p><p>Conclusion</p>`,
    );
  });

  test("rend absolus les liens internes pour qu'ils restent valides une fois collés", async () => {
    // Given
    const racine = document.createElement("div");
    racine.innerHTML = `<div data-bloc-copiable="texte"><p><a href="/chantier/CH-050/NAT-FR">CH-050</a></p></div>`;

    // When
    const { html } = construireContenuCopie({ racine });

    // Then
    expect(await html).toStrictEqual(
      `<meta charset="utf-8"><p><a href="${window.location.origin}/chantier/CH-050/NAT-FR">CH-050</a></p>`,
    );
  });

  test("fournit l'image du dashboard pour les applications qui ne lisent pas le HTML", async () => {
    // Given
    const racine = document.createElement("div");
    racine.innerHTML = [
      `<div data-bloc-copiable="dashboard"><h3>Dashboard Sarthe</h3></div>`,
      `<div data-bloc-copiable="texte"><p>Voici le tableau de bord demandé.</p></div>`,
    ].join("");

    // When
    const { image } = construireContenuCopie({ racine });

    // Then
    expect((await image)?.type).toStrictEqual("image/png");
  });

  test("ne fournit pas d'image quand la réponse n'a pas de dashboard", () => {
    // Given
    const racine = document.createElement("div");
    racine.innerHTML = `<div data-bloc-copiable="texte"><p>Réponse</p></div>`;

    // When
    const { image } = construireContenuCopie({ racine });

    // Then
    expect(image).toBeNull();
  });
});
