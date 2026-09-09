import {
  remarkChantierLinks,
  type MarkdownNode,
} from "@/components/_commons/ChatUI/remarkChantierLinks";
import type { CitedChantier } from "@/components/_commons/ChatUI/extractCitedChantiers";

const chantiers = new Map<string, CitedChantier>([
  ["CH-050", { id: "CH-050", nom: "Sécurité routière" }],
  ["CH-012", { id: "CH-012", nom: "Handicap [phase 2]" }],
]);

const buildUrl = (chantier: CitedChantier) => `/chantier/${chantier.id}/NAT-FR`;

const apply = (tree: MarkdownNode): void => {
  remarkChantierLinks({ chantiers, buildUrl })(tree);
};

const paragraph = (text: string): MarkdownNode => ({
  type: "root",
  children: [{ type: "paragraph", children: [{ type: "text", value: text }] }],
});

const paragraphChildren = (tree: MarkdownNode) => tree.children?.[0].children;

describe("remarkChantierLinks", () => {
  test("transforme le libellé complet en un seul lien", () => {
    // Given
    const tree = paragraph("Voir CH-050 — Sécurité routière pour le détail.");

    // When
    apply(tree);

    // Then
    expect(paragraphChildren(tree)).toStrictEqual([
      { type: "text", value: "Voir " },
      {
        type: "link",
        url: "/chantier/CH-050/NAT-FR",
        children: [{ type: "text", value: "CH-050 — Sécurité routière" }],
      },
      { type: "text", value: " pour le détail." },
    ]);
  });

  test("retombe sur l'identifiant seul quand le nom ne suit pas", () => {
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

  test("retombe sur l'identifiant seul quand le nom qui suit ne correspond pas", () => {
    // Given
    const tree = paragraph("CH-050 — Autre libellé");

    // When
    apply(tree);

    // Then
    expect(paragraphChildren(tree)).toStrictEqual([
      {
        type: "link",
        url: "/chantier/CH-050/NAT-FR",
        children: [{ type: "text", value: "CH-050" }],
      },
      { type: "text", value: " — Autre libellé" },
    ]);
  });

  test("tolère la casse et les séparateurs alternatifs", () => {
    // Given
    const tree = paragraph("Ch-050 - Sécurité routière");

    // When
    apply(tree);

    // Then
    expect(paragraphChildren(tree)).toStrictEqual([
      {
        type: "link",
        url: "/chantier/CH-050/NAT-FR",
        children: [{ type: "text", value: "Ch-050 - Sécurité routière" }],
      },
    ]);
  });

  test("reconnaît un identifiant écrit avec un tiret insécable", () => {
    // Given
    // The model emits U+2011 inside the id and U+202F before the em dash,
    // instead of the ASCII hyphen and space.
    const tree = paragraph("CH\u2011050\u202f\u2014 Sécurité routière");

    // When
    apply(tree);

    // Then
    expect(paragraphChildren(tree)).toStrictEqual([
      {
        type: "link",
        url: "/chantier/CH-050/NAT-FR",
        children: [
          { type: "text", value: "CH\u2011050\u202f\u2014 Sécurité routière" },
        ],
      },
    ]);
  });

  test("laisse en texte un identifiant absent de la whitelist", () => {
    // Given
    const tree = paragraph("Le chantier CH-999 n'existe pas.");

    // When
    apply(tree);

    // Then
    expect(paragraphChildren(tree)).toStrictEqual([
      { type: "text", value: "Le chantier CH-999 n'existe pas." },
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

  test("gère un nom de chantier contenant des caractères markdown", () => {
    // Given
    const tree = paragraph("CH-012 — Handicap [phase 2] est en cours.");

    // When
    apply(tree);

    // Then
    expect(paragraphChildren(tree)).toStrictEqual([
      {
        type: "link",
        url: "/chantier/CH-012/NAT-FR",
        children: [{ type: "text", value: "CH-012 — Handicap [phase 2]" }],
      },
      { type: "text", value: " est en cours." },
    ]);
  });
});
