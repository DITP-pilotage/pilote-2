import { useEditor, EditorContent } from "@tiptap/react";
import { StarterKit } from "@tiptap/starter-kit";
import { Link } from "@tiptap/extension-link";
import { Image } from "@tiptap/extension-image";
import { TextStyle } from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";
import { Placeholder } from "@tiptap/extension-placeholder";
import { Underline } from "@tiptap/extension-underline";
import { FunctionComponent, RefObject, useImperativeHandle } from "react";
import { TextareaRef } from "@/components/_commons/Textarea";
import { ÉditeurRicheStyled } from "./ÉditeurRiche.styled";
import { MenuBar } from "./MenuBar";

export type EditeurRicheRef = {
  focus: () => void;
};

interface ÉditeurRicheProps {
  contenu: string;
  onChange: (contenu: string) => void;
  onBlur?: () => void;
  onFocus?: () => void;
  placeholder?: string;
  estEnLectureSeule?: boolean;
  editeurRef?: RefObject<TextareaRef | null>;
}

export const EditeurRiche: FunctionComponent<ÉditeurRicheProps> = ({
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
      StarterKit,
      Link.configure({
        openOnClick: false,
      }),
      Image,
      Placeholder.configure({
        placeholder,
      }),
      TextStyle,
      Color,
      Underline,
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
    <ÉditeurRicheStyled className="relative max-h-[650px] overflow-auto !bg-dsfr-contrast-grey">
      <MenuBar editor={editor} />
      <EditorContent editor={editor} />
    </ÉditeurRicheStyled>
  );
};
