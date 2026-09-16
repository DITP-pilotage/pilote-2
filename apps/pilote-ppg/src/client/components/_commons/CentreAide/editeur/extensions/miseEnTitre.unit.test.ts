import { Editor } from "@tiptap/core";
import { extensionsCentreAide } from "@/client/components/_commons/CentreAide/editeur/extensions";

it("N'applique le titre qu'au paragraphe sélectionné", () => {
  const editor = new Editor({
    element: document.createElement("div"),
    extensions: extensionsCentreAide(),
    content: "<p>A</p><p>B</p><p>C</p>",
  });

  // Position 4 = à l'intérieur du deuxième paragraphe (B).
  editor.commands.setTextSelection(4);
  editor.chain().focus().toggleHeading({ level: 2 }).run();

  const html = editor.getHTML();
  expect(html).toContain("<h2>B</h2>");
  expect(html).toContain("<p>A</p>");
  expect(html).toContain("<p>C</p>");

  editor.destroy();
});
