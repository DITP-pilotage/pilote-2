import { Content } from "pdfmake/interfaces";
import { htmlToPdfmake } from "@/server/pdf/htmlToPdfmake";

function plainText(value: unknown): string {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value.map(plainText).join("");
  if (typeof value !== "object" || value === null) return "";
  if ("text" in value) return plainText(value.text);
  if ("stack" in value && Array.isArray(value.stack)) {
    return value.stack.map(plainText).join("\n");
  }
  if ("ul" in value && Array.isArray(value.ul)) {
    return value.ul.map(plainText).join("\n");
  }
  if ("ol" in value && Array.isArray(value.ol)) {
    return value.ol.map(plainText).join("\n");
  }
  if ("table" in value) return plainText(Object.values(value.table ?? {}));
  return "";
}

function inlineSegments(content: Content[]): unknown[] {
  const [paragraph] = content;
  if (
    typeof paragraph === "object" &&
    "text" in paragraph &&
    Array.isArray(paragraph.text)
  ) {
    return paragraph.text.filter((segment) => typeof segment === "object");
  }
  return [];
}

describe("htmlToPdfmake", () => {
  it("rend la mise en forme en ligne", () => {
    const content = htmlToPdfmake(
      "<p>a <strong>b</strong> <em>c</em> <u>d</u> <s>e</s></p>",
    );

    expect(plainText(content)).toBe("a b c d e");
    expect(inlineSegments(content)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ text: ["b"], bold: true }),
        expect.objectContaining({ text: ["c"], italics: true }),
        expect.objectContaining({ text: ["d"], decoration: "underline" }),
        expect.objectContaining({ text: ["e"], decoration: "lineThrough" }),
      ]),
    );
  });

  it("rend les titres en gras aux tailles DSFR", () => {
    const [heading] = htmlToPdfmake("<h3>Titre</h3>");

    expect(heading).toMatchObject({ bold: true, fontSize: 21 });
  });

  it("rend les listes imbriquées", () => {
    const [list] = htmlToPdfmake("<ul><li>x<ul><li>y</li></ul></li></ul>");

    expect(list).toHaveProperty("ul");
    expect(plainText(list)).toContain("y");
  });

  it("rend les listes ordonnées", () => {
    expect(htmlToPdfmake("<ol><li>x</li></ol>")[0]).toHaveProperty("ol");
  });

  it("rend un lien en texte souligné sans lien cliquable", () => {
    const content = htmlToPdfmake(
      '<p><a href="https://exemple.fr">lien</a></p>',
    );

    expect(inlineSegments(content)[0]).toMatchObject({
      decoration: "underline",
      color: "#000091",
    });
    expect(JSON.stringify(content)).not.toContain("exemple.fr");
  });

  it("décode les entités et normalise les espaces insécables", () => {
    expect(
      plainText(htmlToPdfmake("<p>a&nbsp;&amp;&lt;&eacute;&#39; b</p>")),
    ).toBe("a &<é' b");
  });

  it("ignore scripts, images, vidéos et iframes", () => {
    const content = htmlToPdfmake(
      '<script>alert(1)</script><p>ok</p><img src="http://evil"><iframe src="http://x"></iframe><video src="v"></video>',
    );

    expect(plainText(content)).toBe("ok");
    expect(JSON.stringify(content)).not.toContain("evil");
  });

  it("tolère le HTML mal formé", () => {
    expect(plainText(htmlToPdfmake("<p>non fermé"))).toBe("non fermé");
  });

  it("rend les sauts de ligne, citations et séparateurs", () => {
    const content = htmlToPdfmake(
      "<p>a<br>b</p><blockquote>c</blockquote><hr>",
    );

    expect(plainText(content[0])).toBe("a\nb");
    expect(content[1]).toMatchObject({ italics: true });
    expect(content[2]).toHaveProperty("canvas");
  });

  it("rend un encadré callout sur fond bleu clair", () => {
    const [callout] = htmlToPdfmake('<div data-type="callout"><p>x</p></div>');

    expect(JSON.stringify(callout)).toContain("#F5F5FE");
    expect(plainText(callout)).toContain("x");
  });

  it("renvoie un contenu vide pour une chaîne vide", () => {
    expect(htmlToPdfmake("")).toEqual([]);
  });
});
