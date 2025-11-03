import sanitizeHtml from "sanitize-html";

export class SanitizerHTML {
  static sanitize(html: string): string {
    return sanitizeHtml(html, {
      allowedTags: [
        "p",
        "br",
        "strong",
        "b",
        "em",
        "i",
        "u",
        "s",
        "strike",
        "h1",
        "h2",
        "h3",
        "h4",
        "h5",
        "h6",
        "ul",
        "ol",
        "li",
        "a",
        "img",
        "blockquote",
        "code",
        "pre",
        "hr",
        "span",
      ],
      allowedAttributes: {
        a: ["href", "target", "rel"],
        img: ["src", "alt", "title"],
        span: ["style"],
        p: ["style"],
        h1: ["style"],
        h2: ["style"],
        h3: ["style"],
        h4: ["style"],
        h5: ["style"],
        h6: ["style"],
      },
      allowedStyles: {
        "*": {
          color: [/^#[\dA-Fa-f]{6}$/, /^rgb\((?:\d+,\s*){2}\d+\)$/],
          "text-align": [/^left$/, /^right$/, /^center$/, /^justify$/],
        },
      },
      allowedSchemes: ["http", "https", "mailto"],
      allowedSchemesByTag: {
        img: ["http", "https", "data"],
      },
      disallowedTagsMode: "discard",
    });
  }
}
