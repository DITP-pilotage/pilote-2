import { useEditor, EditorContent } from "@tiptap/react";
import { type Extensions } from "@tiptap/core";
import { Placeholder } from "@tiptap/extension-placeholder";
import { FunctionComponent, RefObject, useImperativeHandle } from "react";
import { TextareaRef } from "@/components/_commons/Textarea";
import { MenuBar } from "./MenuBar";

export type EditeurRicheRef = {
  focus: () => void;
};

export interface EditeurRicheProps {
  extensions: Extensions;
  contenu: string;
  onChange: (contenu: string) => void;
  onBlur?: () => void;
  onFocus?: () => void;
  placeholder?: string;
  estEnLectureSeule?: boolean;
  editeurRef?: RefObject<TextareaRef | null>;
}

export const EditeurRiche: FunctionComponent<EditeurRicheProps> = ({
  extensions,
  contenu,
  onChange,
  onBlur,
  placeholder = "Saisissez votre texte...",
  estEnLectureSeule = false,
  editeurRef,
  onFocus,
}) => {
  const editor = useEditor({
    extensions: [
      ...extensions.filter((ext) => ext.name !== "placeholder"),
      Placeholder.configure({
        placeholder,
      }),
    ],
    content: contenu,
    immediatelyRender: true,

    editable: !estEnLectureSeule,
    onUpdate: ({ editor: editor2 }) => {
      onChange(editor2.isEmpty ? "" : editor2.getHTML());
    },
    onBlur: onBlur,
    onFocus: onFocus,
  });

  useImperativeHandle(editeurRef, () => ({
    focus: () => {
      editor.commands.focus("end");
    },
  }));

  return (
    <div className="fr-input relative flex flex-1 flex-col min-h-full overflow-y-auto !p-0">
      <MenuBar editor={editor} />
      <EditorContent
        className="flex-1 [&_.tiptap]:min-h-full [&_.tiptap]:p-2"
        editor={editor}
      />
    </div>
  );
};
