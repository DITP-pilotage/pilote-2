import {
  remarkLiensChantiers,
  type NoeudMarkdown,
} from "@/components/_commons/ChatUI/remarkLiensChantiers";
import type { ChantierCite } from "@/components/_commons/ChatUI/extraireChantiersCites";

const chantiers = new Map<string, ChantierCite>([
  ["CH-050", { id: "CH-050", nom: "Sécurité routière" }],
  ["CH-012", { id: "CH-012", nom: "Handicap [phase 2]" }],
]);

const construireUrl = (chantier: ChantierCite) =>
  `/chantier/${chantier.id}/NAT-FR`;

const appliquer = (tree: NoeudMarkdown): void => {
  remarkLiensChantiers({ chantiers, construireUrl })(tree);
};

const paragraphe = (valeur: string): NoeudMarkdown => ({
  type: "root",
  children: [
    { type: "paragraph", children: [{ type: "text", value: valeur }] },
  ],
});

const enfantsDuParagraphe = (tree: NoeudMarkdown) =>
  tree.children?.[0].children;

describe("remarkLiensChantiers", () => {
  test("transforme le libellé complet en un seul lien", () => {
    // Given
    const tree = paragraphe("Voir CH-050 — Sécurité routière pour le détail.");

    // When
    appliquer(tree);

    // Then
    expect(enfantsDuParagraphe(tree)).toStrictEqual([
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
    const tree = paragraphe("Le chantier CH-050 progresse.");

    // When
    appliquer(tree);

    // Then
    expect(enfantsDuParagraphe(tree)).toStrictEqual([
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
    const tree = paragraphe("CH-050 — Autre libellé");

    // When
    appliquer(tree);

    // Then
    expect(enfantsDuParagraphe(tree)).toStrictEqual([
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
    const tree = paragraphe("Ch-050 - Sécurité routière");

    // When
    appliquer(tree);

    // Then
    expect(enfantsDuParagraphe(tree)).toStrictEqual([
      {
        type: "link",
        url: "/chantier/CH-050/NAT-FR",
        children: [{ type: "text", value: "Ch-050 - Sécurité routière" }],
      },
    ]);
  });

  test("laisse en texte un identifiant absent de la whitelist", () => {
    // Given
    const tree = paragraphe("Le chantier CH-999 n'existe pas.");

    // When
    appliquer(tree);

    // Then
    expect(enfantsDuParagraphe(tree)).toStrictEqual([
      { type: "text", value: "Le chantier CH-999 n'existe pas." },
    ]);
  });

  test("crée un lien pour chaque chantier d'une même phrase", () => {
    // Given
    const tree = paragraphe("CH-050 et CH-012 sont concernés.");

    // When
    appliquer(tree);

    // Then
    expect(enfantsDuParagraphe(tree)).toStrictEqual([
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
    const tree: NoeudMarkdown = {
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
    appliquer(tree);

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
    const tree: NoeudMarkdown = {
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
    appliquer(tree);

    // Then
    expect(enfantsDuParagraphe(tree)).toStrictEqual([
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
    const tree = paragraphe("CH-012 — Handicap [phase 2] est en cours.");

    // When
    appliquer(tree);

    // Then
    expect(enfantsDuParagraphe(tree)).toStrictEqual([
      {
        type: "link",
        url: "/chantier/CH-012/NAT-FR",
        children: [{ type: "text", value: "CH-012 — Handicap [phase 2]" }],
      },
      { type: "text", value: " est en cours." },
    ]);
  });
});
