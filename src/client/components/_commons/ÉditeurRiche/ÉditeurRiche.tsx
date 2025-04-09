import { useEditor, EditorContent } from '@tiptap/react';
import { StarterKit } from '@tiptap/starter-kit';
import { Link } from '@tiptap/extension-link';
import { Image } from '@tiptap/extension-image';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import { Placeholder } from '@tiptap/extension-placeholder';
import { FunctionComponent } from 'react';
import { ÉditeurRicheStyled } from './ÉditeurRiche.styled';
import { MenuBar } from './MenuBar';

interface ÉditeurRicheProps {
  contenu: string;
  onChange: (contenu: string) => void;
  placeholder?: string;
  estEnLectureSeule?: boolean;
}

export const ÉditeurRiche: FunctionComponent<ÉditeurRicheProps> = ({
  contenu,
  onChange,
  placeholder = 'Saisissez votre texte...',
  estEnLectureSeule = false,
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
    ],
    content: contenu,
    immediatelyRender: true,
    
    editable: !estEnLectureSeule,
    onUpdate: ({ editor: editor2 }) => {
      onChange(editor2.getHTML());
    },
  });

  return (
    <ÉditeurRicheStyled>
      <MenuBar editor={editor} /> 
      <EditorContent editor={editor} />
    </ÉditeurRicheStyled>
  );
};

