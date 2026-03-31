export function plainTextToHtml(text: string): string {
  const escaped = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  const paragraphs = escaped
    .split(/\n\n+/)
    .map((paragraph) => paragraph.replace(/\n/g, "<br>"))
    .map((paragraph) => `<p>${paragraph}</p>`)
    .join("");

  return paragraphs;
}
