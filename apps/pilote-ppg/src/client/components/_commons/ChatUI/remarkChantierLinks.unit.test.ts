import {
  remarkChantierLinks,
  type MarkdownNode,
} from "@/components/_commons/ChatUI/remarkChantierLinks";

const buildUrl = (chantierId: string) => `/chantier/${chantierId}/NAT-FR`;

const apply = (tree: MarkdownNode): void => {
  remarkChantierLinks({ buildUrl })(tree);
};

const paragraph = (text: string): MarkdownNode => ({
  type: "root",
  children: [{ type: "paragraph", children: [{ type: "text", value: text }] }],
});

const paragraphChildren = (tree: MarkdownNode) => tree.children?.[0].children;

describe("remarkChantierLinks", () => {
  test("transforme un identifiant en lien", () => {
    // Given
    const tree = paragraph("Le chantier CH-050 progresse.");

    // When
    apply(tree);

    // Then
    expect(paragraphChildren(tree)).toStrictEqual([
      { type: "text", value: "Le chantier " },
      {
        type: "link",
        url: "/chantier/CH-050/NAT-FR",
        children: [{ type: "text", value: "CH-050" }],
      },
      { type: "text", value: " progresse." },
    ]);
  });

  test("laisse le libellé qui suit hors du lien", () => {
    // Given
    const tree = paragraph("CH-050 — Sécurité routière");

    // When
    apply(tree);

    // Then
    expect(paragraphChildren(tree)).toStrictEqual([
      {
        type: "link",
        url: "/chantier/CH-050/NAT-FR",
        children: [{ type: "text", value: "CH-050" }],
      },
      { type: "text", value: " — Sécurité routière" },
    ]);
  });

  test("tolère la casse et les tirets Unicode dans l'identifiant", () => {
    // Given
    // The model emits U+2011 inside the id instead of the ASCII hyphen.
    const tree = paragraph("Ch‑050 en cours");

    // When
    apply(tree);

    // Then
    expect(paragraphChildren(tree)).toStrictEqual([
      {
        type: "link",
        url: "/chantier/CH-050/NAT-FR",
        children: [{ type: "text", value: "Ch‑050" }],
      },
      { type: "text", value: " en cours" },
    ]);
  });

  test("crée un lien pour chaque chantier d'une même phrase", () => {
    // Given
    const tree = paragraph("CH-050 et CH-012 sont concernés.");

    // When
    apply(tree);

    // Then
    expect(paragraphChildren(tree)).toStrictEqual([
      {
        type: "link",
        url: "/chantier/CH-050/NAT-FR",
        children: [{ type: "text", value: "CH-050" }],
      },
      { type: "text", value: " et " },
      {
        type: "link",
        url: "/chantier/CH-012/NAT-FR",
        children: [{ type: "text", value: "CH-012" }],
      },
      { type: "text", value: " sont concernés." },
    ]);
  });

  test("descend dans les nœuds imbriqués comme le gras", () => {
    // Given
    const tree: MarkdownNode = {
      type: "root",
      children: [
        {
          type: "paragraph",
          children: [
            { type: "strong", children: [{ type: "text", value: "CH-050" }] },
          ],
        },
      ],
    };

    // When
    apply(tree);

    // Then
    expect(tree.children?.[0].children?.[0].children).toStrictEqual([
      {
        type: "link",
        url: "/chantier/CH-050/NAT-FR",
        children: [{ type: "text", value: "CH-050" }],
      },
    ]);
  });

  test("ne touche ni au code inline ni aux liens existants", () => {
    // Given
    const tree: MarkdownNode = {
      type: "root",
      children: [
        {
          type: "paragraph",
          children: [
            { type: "inlineCode", value: "CH-050" },
            {
              type: "link",
              url: "https://exemple.fr",
              children: [{ type: "text", value: "CH-050" }],
            },
          ],
        },
      ],
    };

    // When
    apply(tree);

    // Then
    expect(paragraphChildren(tree)).toStrictEqual([
      { type: "inlineCode", value: "CH-050" },
      {
        type: "link",
        url: "https://exemple.fr",
        children: [{ type: "text", value: "CH-050" }],
      },
    ]);
  });

  test("laisse le texte intact quand aucun identifiant n'est présent", () => {
    // Given
    const tree = paragraph("Aucun chantier ici.");

    // When
    apply(tree);

    // Then
    expect(paragraphChildren(tree)).toStrictEqual([
      { type: "text", value: "Aucun chantier ici." },
    ]);
  });
});
