import { isTextSelection } from "@tiptap/core";
import { NodeSelection } from "@tiptap/pm/state";
import { EditorContent, useEditor, useEditorState } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import { FunctionComponent, ReactNode, useState } from "react";
import { ModaleInsertionIcone } from "@/components/_commons/EditeurRiche/ModaleInsertionIcone";
import { ModaleInsertionUrl } from "@/components/_commons/EditeurRiche/ModaleInsertionUrl";
import { classesRenduContenuHtml } from "@/components/_commons/EditeurRiche/RenduContenuHtml";
import { clsxm } from "@/utils/clsxm";
import { extensionsCentreAide } from "./extensions";

type ModaleOuverte = "image" | "video" | "lien" | "icone" | null;

const BoutonBulle: FunctionComponent<{
  actif: boolean;
  label: string;
  onClick: () => void;
  children: ReactNode;
}> = ({ actif, label, onClick, children }) => (
  <button
    aria-label={label}
    aria-pressed={actif}
    className={clsxm(
      "flex h-8 w-8 items-center justify-center rounded text-white/90 transition-colors hover:bg-white/15",
      actif && "bg-white/20 text-white",
    )}
    // Empêche le blur : ProseMirror garde le focus et la sélection courante.
    onClick={onClick}
    onMouseDown={(event) => event.preventDefault()}
    title={label}
    type="button"
  >
    {children}
  </button>
);

const classesContenu = clsxm(
  classesRenduContenuHtml,
  // prosemirror.css encadre tous les .ProseMirror : ici le document pose sur la
  // page, sans cadre dans le cadre.
  "[&_.ProseMirror]:min-h-[calc(100dvh-20rem)] [&_.ProseMirror]:outline-none",
  "[&_.ProseMirror]:!border-none [&_.ProseMirror]:!p-0",
  "[&_.ProseMirror_.is-empty]:before:pointer-events-none",
  "[&_.ProseMirror_.is-empty]:before:float-left",
  "[&_.ProseMirror_.is-empty]:before:h-0",
  "[&_.ProseMirror_.is-empty]:before:text-gray-400",
  "[&_.ProseMirror_.is-empty]:before:content-[attr(data-placeholder)]",
);

export const EditeurCentreAide: FunctionComponent<{
  contenu: string;
  onChange: (contenu: string) => void;
}> = ({ contenu, onChange }) => {
  const [modale, setModale] = useState<ModaleOuverte>(null);

  const editor = useEditor({
    extensions: extensionsCentreAide({
      ouvrirImage: () => setModale("image"),
      ouvrirVideo: () => setModale("video"),
      ouvrirLien: () => setModale("lien"),
      ouvrirIcone: () => setModale("icone"),
    }),
    content: contenu,
    immediatelyRender: false,
    onUpdate: ({ editor: instance }) =>
      onChange(instance.isEmpty ? "" : instance.getHTML()),
  });

  // tiptap v3 ne re-rend plus le composant à chaque transaction : on souscrit
  // explicitement aux états actifs pour que la bulle suive la sélection.
  const etats = useEditorState({
    editor,
    selector: ({ editor: instance }) => ({
      gras: instance?.isActive("bold") ?? false,
      italique: instance?.isActive("italic") ?? false,
      souligne: instance?.isActive("underline") ?? false,
      barre: instance?.isActive("strike") ?? false,
      lien: instance?.isActive("link") ?? false,
    }),
  });

  if (!editor || !etats) return null;

  const poserLien = (url: string) => {
    if (editor.state.selection.empty) {
      editor
        .chain()
        .focus()
        .insertContent({
          type: "text",
          text: url,
          marks: [{ type: "link", attrs: { href: url } }],
        })
        .run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  const fermerModale = (ouvert: boolean) => {
    if (!ouvert) setModale(null);
  };

  return (
    <div>
      <BubbleMenu
        className="flex items-center gap-0.5 rounded-lg bg-gray-800 p-1 shadow-lg"
        editor={editor}
        shouldShow={({ view, state, from, to }) => {
          // Un média sélectionné est une NodeSelection non vide : sans ce filtre
          // la bulle de texte s'ouvre dessus et chevauche sa barre de mise en
          // page, alors qu'on ne met pas une vidéo en gras.
          if (state.selection instanceof NodeSelection) return false;
          const estBlocTexteVide =
            !state.doc.textBetween(from, to).length &&
            isTextSelection(state.selection);
          return (
            view.hasFocus() &&
            !state.selection.empty &&
            !estBlocTexteVide &&
            editor.isEditable
          );
        }}
      >
        <BoutonBulle
          actif={etats.gras}
          label="Gras"
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <span className="text-sm font-bold">G</span>
        </BoutonBulle>
        <BoutonBulle
          actif={etats.italique}
          label="Italique"
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <span className="text-sm italic">I</span>
        </BoutonBulle>
        <BoutonBulle
          actif={etats.souligne}
          label="Souligné"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
        >
          <span className="text-sm underline">S</span>
        </BoutonBulle>
        <BoutonBulle
          actif={etats.barre}
          label="Barré"
          onClick={() => editor.chain().focus().toggleStrike().run()}
        >
          <span className="text-sm line-through">B</span>
        </BoutonBulle>
        <span aria-hidden className="mx-1 h-5 w-px bg-white/20" />
        <BoutonBulle
          actif={etats.lien}
          label="Lien"
          onClick={() => setModale("lien")}
        >
          <span className="text-sm">🔗</span>
        </BoutonBulle>
      </BubbleMenu>

      <EditorContent className={classesContenu} editor={editor} />

      <ModaleInsertionUrl
        onOpenChange={fermerModale}
        onValider={(url) => editor.chain().focus().setImage({ src: url }).run()}
        open={modale === "image"}
        titre="Insérer une image"
        type="image"
      />
      <ModaleInsertionUrl
        onOpenChange={fermerModale}
        onValider={(url) =>
          editor.chain().focus().insertVideo({ src: url }).run()
        }
        open={modale === "video"}
        titre="Insérer une vidéo"
        type="video"
      />
      <ModaleInsertionUrl
        onOpenChange={fermerModale}
        onValider={poserLien}
        open={modale === "lien"}
        titre="Insérer un lien"
        type="lien"
      />
      <ModaleInsertionIcone
        onOpenChange={fermerModale}
        onValider={(nomIcone) =>
          editor.chain().focus().insertIcone({ type: nomIcone }).run()
        }
        open={modale === "icone"}
      />
    </div>
  );
};
