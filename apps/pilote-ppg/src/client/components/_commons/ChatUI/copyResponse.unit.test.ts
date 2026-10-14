import { buildContentCopy } from "@/components/_commons/ChatUI/copyResponse";

vi.mock("html-to-image", () => ({
  toBlob: async () => new Blob(["png"], { type: "image/png" }),
}));

describe("buildContentCopy", () => {
  test("assemble le texte et l'image du dashboard dans l'ordre du message", async () => {
    // Given
    const root = document.createElement("div");
    root.innerHTML = [
      `<div data-copyable-block="text"><p class="albert-markdown">Introduction</p></div>`,
      `<div data-copyable-block="dashboard"><h3>Dashboard Sarthe</h3></div>`,
      `<div data-copyable-block="text"><p>Conclusion</p></div>`,
      `<span>Albert</span>`,
    ].join("");

    // When
    const copy = buildContentCopy({ root });

    // Then
    expect(await copy?.html).toStrictEqual(
      `<meta charset="utf-8"><p>Introduction</p><p><img src="data:image/png;base64,cG5n" alt="Tableau de bord"></p><p>Conclusion</p>`,
    );
  });

  test("rend absolus les liens internes pour qu'ils restent valides une fois collés", async () => {
    // Given
    const root = document.createElement("div");
    root.innerHTML = [
      `<div data-copyable-block="text"><p><a href="/chantier/CH-050/NAT-FR">CH-050</a></p></div>`,
      `<div data-copyable-block="dashboard"><h3>Dashboard Sarthe</h3></div>`,
    ].join("");

    // When
    const copy = buildContentCopy({ root });

    // Then
    expect(await copy?.html).toStrictEqual(
      `<meta charset="utf-8"><p><a href="${window.location.origin}/chantier/CH-050/NAT-FR">CH-050</a></p><p><img src="data:image/png;base64,cG5n" alt="Tableau de bord"></p>`,
    );
  });

  test("fournit l'image du dashboard pour les applications qui ne lisent pas le HTML", async () => {
    // Given
    const root = document.createElement("div");
    root.innerHTML = [
      `<div data-copyable-block="dashboard"><h3>Dashboard Sarthe</h3></div>`,
      `<div data-copyable-block="text"><p>Voici le tableau de bord demandé.</p></div>`,
    ].join("");

    // When
    const copy = buildContentCopy({ root });

    // Then
    expect((await copy?.image)?.type).toStrictEqual("image/png");
  });

  test("ne prépare pas de copie riche quand la réponse n'a pas de dashboard", () => {
    // Given
    const root = document.createElement("div");
    root.innerHTML = `<div data-copyable-block="text"><p>Réponse</p></div>`;

    // When
    const copy = buildContentCopy({ root });

    // Then
    expect(copy).toBeNull();
  });
});
