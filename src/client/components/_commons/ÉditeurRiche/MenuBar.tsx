import { Editor } from "@tiptap/react";
import "@gouvfr/dsfr/dist/component/tag/tag.min.css";
import { Icone } from "@/components/_commons/Icone";
import { ListOrderedIcon } from "@/components/_commons/Icones/ListOrderedIcon";

export const MenuBar = ({ editor }: { editor: Editor }) => {
  if (!editor) {
    return null;
  }

  return (
    <div className="control-group fr-my-2w">
      <div className="button-group border-t">
        <button
          aria-pressed={editor.isActive("bold")}
          className="fr-tag fr-mr-1w fr-mb-1w"
          disabled={!editor.can().chain().focus().toggleBold().run()}
          onClick={() => editor.chain().focus().toggleBold().run()}
          type="button"
        >
          {/*Gras*/}
          <Icone icone={ListOrderedIcon} />
        </button>
        <button
          aria-pressed={editor.isActive("italic")}
          className="fr-tag fr-mr-1w fr-mb-1w"
          disabled={!editor.can().chain().focus().toggleItalic().run()}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          type="button"
        >
          {/*Italique*/}
          <Icone icone={ListOrderedIcon} />
        </button>
        <button
          aria-pressed={editor.isActive("strike")}
          className="fr-tag fr-mr-1w fr-mb-1w"
          disabled={!editor.can().chain().focus().toggleStrike().run()}
          onClick={() => editor.chain().focus().toggleStrike().run()}
          type="button"
        >
          {/*Barré*/}
          <Icone icone={ListOrderedIcon} />
        </button>
        <button
          aria-pressed={editor.isActive("code")}
          className="fr-tag fr-mr-1w fr-mb-1w"
          disabled={!editor.can().chain().focus().toggleCode().run()}
          onClick={() => editor.chain().focus().toggleCode().run()}
          type="button"
        >
          {/*ligne de code*/}
          <Icone icone={ListOrderedIcon} />
        </button>
        <button
          aria-pressed={editor.isActive("paragraph")}
          className="fr-tag fr-mr-1w fr-mb-1w"
          onClick={() => editor.chain().focus().setParagraph().run()}
          type="button"
        >
          {/*Paragraphe*/}
          <Icone icone={ListOrderedIcon} />
        </button>
        <button
          aria-pressed={editor.isActive("heading", { level: 1 })}
          className="fr-tag fr-mr-1w fr-mb-1w"
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 1 }).run()
          }
          type="button"
        >
          {/*Titre 1*/}
          <Icone icone={ListOrderedIcon} />
        </button>
        <button
          aria-pressed={editor.isActive("heading", { level: 2 })}
          className="fr-tag fr-mr-1w fr-mb-1w"
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
          type="button"
        >
          {/*Titre 2*/}
          <Icone icone={ListOrderedIcon} />
        </button>
        <button
          aria-pressed={editor.isActive("heading", { level: 3 })}
          className="fr-tag fr-mr-1w fr-mb-1w"
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 3 }).run()
          }
          type="button"
        >
          {/*Titre 3*/}
          <Icone icone={ListOrderedIcon} />
        </button>
        <button
          aria-pressed={editor.isActive("heading", { level: 4 })}
          className="fr-tag fr-mr-1w fr-mb-1w"
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 4 }).run()
          }
          type="button"
        >
          {/*Titre 4*/}
          <Icone icone={ListOrderedIcon} />
        </button>
        <button
          aria-pressed={editor.isActive("heading", { level: 5 })}
          className="fr-tag fr-mr-1w fr-mb-1w"
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 5 }).run()
          }
          type="button"
        >
          {/*Titre 5*/}
          <Icone icone={ListOrderedIcon} />
        </button>
        <button
          aria-pressed={editor.isActive("heading", { level: 6 })}
          className="fr-tag fr-mr-1w fr-mb-1w"
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 6 }).run()
          }
          type="button"
        >
          {/*Titre 6*/}
          <Icone icone={ListOrderedIcon} />
        </button>
        <button
          aria-pressed={editor.isActive("bulletList")}
          className="fr-tag fr-mr-1w fr-mb-1w"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          type="button"
        >
          {/*Liste à puces*/}
          <Icone icone={ListOrderedIcon} />
        </button>
        <button
          aria-pressed={editor.isActive("orderedList")}
          className="fr-tag fr-mr-1w fr-mb-1w"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          type="button"
        >
          {/*Liste numérotée*/}
          <Icone icone={ListOrderedIcon} />
        </button>
        <button
          aria-pressed={editor.isActive("codeBlock")}
          className="fr-tag fr-mr-1w fr-mb-1w"
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          type="button"
        >
          {/*Bloc de code*/}
          <Icone icone={ListOrderedIcon} />
        </button>
        <button
          aria-pressed={editor.isActive("blockquote")}
          className="fr-tag fr-mr-1w fr-mb-1w"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          type="button"
        >
          {/*Citation*/}
          <Icone icone={ListOrderedIcon} />
        </button>
        <button
          className="fr-tag fr-mr-1w fr-mb-1w"
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          type="button"
        >
          {/*Ligne horizontale*/}
          <Icone icone={ListOrderedIcon} />
        </button>
        <button
          className="fr-tag fr-mr-1w fr-mb-1w"
          onClick={() => editor.chain().focus().setHardBreak().run()}
          type="button"
        >
          {/*Retour à la ligne*/}
          <Icone icone={ListOrderedIcon} />
        </button>
        <button
          className="fr-tag fr-mr-1w fr-mb-1w"
          disabled={!editor.can().chain().focus().undo().run()}
          onClick={() => editor.chain().focus().undo().run()}
          type="button"
        >
          {/*Annuler*/}
          <Icone icone={ListOrderedIcon} />
        </button>
        <button
          className="fr-tag fr-mr-1w fr-mb-1w"
          disabled={!editor.can().chain().focus().redo().run()}
          onClick={() => editor.chain().focus().redo().run()}
          type="button"
        >
          {/*Rétablir*/}
          <Icone icone={ListOrderedIcon} />
        </button>
        <button
          className="fr-tag fr-mr-1w fr-mb-1w"
          onClick={() => editor.chain().focus().unsetAllMarks().run()}
          type="button"
        >
          {/*Effacer les marques*/}
          <Icone icone={ListOrderedIcon} />
        </button>
        <button
          className="fr-tag fr-mr-1w fr-mb-1w"
          onClick={() => editor.chain().focus().clearNodes().run()}
          type="button"
        >
          {/*Effacer les nœuds*/}
          <Icone icone={ListOrderedIcon} />
        </button>
        {/*
          <button
            aria-pressed={editor.isActive('textStyle', { color: '#958DF1' })}
            className='fr-tag fr-mr-1w fr-mb-1w'
            onClick={() => editor.chain().focus().setColor('#958DF1').run()}
            type='button'
          >
            Purple
          </button>
         */}
      </div>
    </div>
  );
};
