import { Editor } from "@tiptap/react";
import { Icone } from "@/components/_commons/Icone";
import { ListOrderedIcon } from "@/components/_commons/Icones/ListOrderedIcon";
import { clsxm } from "@/utils/clsxm";
import { BoldIcon } from "@/components/_commons/Icones/BoldIcon";
import { ItalicIcon } from "@/components/_commons/Icones/ItalicIcon";
import { StrikethroughIcon } from "@/components/_commons/Icones/StrikethroughIcon";
import { UnderlineIcon } from "@/components/_commons/Icones/UnderlineIcon";
import { CodeIcon } from "@/components/_commons/Icones/CodeIcon";
import { ParagraphIcon } from "@/components/_commons/Icones/ParagraphIcon";
import { Heading1Icon } from "@/components/_commons/Icones/Heading1Icon";
import { Heading2Icon } from "@/components/_commons/Icones/Heading2Icon";
import { Heading3Icon } from "@/components/_commons/Icones/Heading3Icon";
import { Heading4Icon } from "@/components/_commons/Icones/Heading4Icon";
import { Heading5Icon } from "@/components/_commons/Icones/Heading5Icon";
import { Heading6Icon } from "@/components/_commons/Icones/Heading6Icon";
import { BulletListIcon } from "@/components/_commons/Icones/BulletListIcon";
import { CodeBlockIcon } from "@/components/_commons/Icones/CodeBlockIcon";
import { BlockquoteIcon } from "@/components/_commons/Icones/BlockquoteIcon";
import { HorizontalRuleIcon } from "@/components/_commons/Icones/HorizontalRuleIcon";
import { LineBreakIcon } from "@/components/_commons/Icones/LineBreakIcon";
import { UndoIcon } from "@/components/_commons/Icones/UndoIcon";
import { RedoIcon } from "@/components/_commons/Icones/RedoIcon";
import { ClearFormatIcon } from "@/components/_commons/Icones/ClearFormatIcon";
import { ClearNodesIcon } from "@/components/_commons/Icones/ClearNodesIcon";

export const MenuBar = ({ editor }: { editor: Editor }) => {
  if (!editor) {
    return null;
  }

  const buttonClass = (isActive: boolean) =>
    clsxm(
      "flex items-center justify-center w-8 h-8 p-0 transition-all duration-150 ease-in-out rounded border",
      {
        "!text-[#000091] !bg-[#e3e3fd] !border-[#000091]": isActive,
        "!text-[#3a3a3a] !bg-transparent !border-transparent": !isActive,
        "!hover:bg-[#e5e5e5] !hover:border-[#ddd] !active:bg-[#d6d6d6]":
          !isActive,
        "!disabled:text-[#929292] !disabled:cursor-not-allowed !disabled:opacity-50": true,
      },
    );

  return (
    <div className="flex z-1 sticky top-0 flex-wrap gap-1 items-center p-2 border border-[#ddd] border-b-0 rounded-t !bg-white">
      {/* Formatage de texte */}
      <div className="flex gap-1 items-center">
        <button
          aria-label="Gras"
          aria-pressed={editor.isActive("bold")}
          className={buttonClass(editor.isActive("bold"))}
          disabled={!editor.can().chain().focus().toggleBold().run()}
          onClick={() => editor.chain().focus().toggleBold().run()}
          title="Gras"
          type="button"
        >
          <Icone icone={BoldIcon} />
        </button>
        <button
          aria-label="Italique"
          aria-pressed={editor.isActive("italic")}
          className={buttonClass(editor.isActive("italic"))}
          disabled={!editor.can().chain().focus().toggleItalic().run()}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          title="Italique"
          type="button"
        >
          <Icone icone={ItalicIcon} />
        </button>
        <button
          aria-label="Barré"
          aria-pressed={editor.isActive("strike")}
          className={buttonClass(editor.isActive("strike"))}
          disabled={!editor.can().chain().focus().toggleStrike().run()}
          onClick={() => editor.chain().focus().toggleStrike().run()}
          title="Barré"
          type="button"
        >
          <Icone icone={StrikethroughIcon} />
        </button>
        <button
          aria-label="Souligné"
          aria-pressed={editor.isActive("underline")}
          className={buttonClass(editor.isActive("underline"))}
          disabled={!editor.can().chain().focus().toggleUnderline().run()}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          title="Souligné"
          type="button"
        >
          <Icone icone={UnderlineIcon} />
        </button>
        <button
          aria-label="Ligne de code"
          aria-pressed={editor.isActive("code")}
          className={buttonClass(editor.isActive("code"))}
          disabled={!editor.can().chain().focus().toggleCode().run()}
          onClick={() => editor.chain().focus().toggleCode().run()}
          title="Ligne de code"
          type="button"
        >
          <Icone icone={CodeIcon} />
        </button>
      </div>

      <div className="w-px h-6 mx-1 bg-[#ddd]" />

      {/* Styles de paragraphe */}
      <div className="flex gap-1 items-center">
        <button
          aria-label="Paragraphe"
          aria-pressed={editor.isActive("paragraph")}
          className={buttonClass(editor.isActive("paragraph"))}
          onClick={() => editor.chain().focus().setParagraph().run()}
          title="Paragraphe"
          type="button"
        >
          <Icone icone={ParagraphIcon} />
        </button>
        <button
          aria-label="Titre 1"
          aria-pressed={editor.isActive("heading", { level: 1 })}
          className={buttonClass(editor.isActive("heading", { level: 1 }))}
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 1 }).run()
          }
          title="Titre 1"
          type="button"
        >
          <Icone icone={Heading1Icon} />
        </button>
        <button
          aria-label="Titre 2"
          aria-pressed={editor.isActive("heading", { level: 2 })}
          className={buttonClass(editor.isActive("heading", { level: 2 }))}
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
          title="Titre 2"
          type="button"
        >
          <Icone icone={Heading2Icon} />
        </button>
        <button
          aria-label="Titre 3"
          aria-pressed={editor.isActive("heading", { level: 3 })}
          className={buttonClass(editor.isActive("heading", { level: 3 }))}
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 3 }).run()
          }
          title="Titre 3"
          type="button"
        >
          <Icone icone={Heading3Icon} />
        </button>
        <button
          aria-label="Titre 4"
          aria-pressed={editor.isActive("heading", { level: 4 })}
          className={buttonClass(editor.isActive("heading", { level: 4 }))}
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 4 }).run()
          }
          title="Titre 4"
          type="button"
        >
          <Icone icone={Heading4Icon} />
        </button>
        <button
          aria-label="Titre 5"
          aria-pressed={editor.isActive("heading", { level: 5 })}
          className={buttonClass(editor.isActive("heading", { level: 5 }))}
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 5 }).run()
          }
          title="Titre 5"
          type="button"
        >
          <Icone icone={Heading5Icon} />
        </button>
        <button
          aria-label="Titre 6"
          aria-pressed={editor.isActive("heading", { level: 6 })}
          className={buttonClass(editor.isActive("heading", { level: 6 }))}
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 6 }).run()
          }
          title="Titre 6"
          type="button"
        >
          <Icone icone={Heading6Icon} />
        </button>
      </div>

      <div className="w-px h-6 mx-1 bg-[#ddd]" />

      {/* Listes */}
      <div className="flex gap-1 items-center">
        <button
          aria-label="Liste à puces"
          aria-pressed={editor.isActive("bulletList")}
          className={buttonClass(editor.isActive("bulletList"))}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          title="Liste à puces"
          type="button"
        >
          <Icone icone={BulletListIcon} />
        </button>
        <button
          aria-label="Liste numérotée"
          aria-pressed={editor.isActive("orderedList")}
          className={buttonClass(editor.isActive("orderedList"))}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          title="Liste numérotée"
          type="button"
        >
          <Icone icone={ListOrderedIcon} />
        </button>
      </div>

      <div className="w-px h-6 mx-1 bg-[#ddd]" />

      {/* Blocs spéciaux */}
      <div className="flex gap-1 items-center">
        <button
          aria-label="Bloc de code"
          aria-pressed={editor.isActive("codeBlock")}
          className={buttonClass(editor.isActive("codeBlock"))}
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          title="Bloc de code"
          type="button"
        >
          <Icone icone={CodeBlockIcon} />
        </button>
        <button
          aria-label="Citation"
          aria-pressed={editor.isActive("blockquote")}
          className={buttonClass(editor.isActive("blockquote"))}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          title="Citation"
          type="button"
        >
          <Icone icone={BlockquoteIcon} />
        </button>
        <button
          aria-label="Ligne horizontale"
          className={buttonClass(false)}
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          title="Ligne horizontale"
          type="button"
        >
          <Icone icone={HorizontalRuleIcon} />
        </button>
        <button
          aria-label="Retour à la ligne"
          className={buttonClass(false)}
          onClick={() => editor.chain().focus().setHardBreak().run()}
          title="Retour à la ligne"
          type="button"
        >
          <Icone icone={LineBreakIcon} />
        </button>
      </div>

      <div className="w-px h-6 mx-1 bg-[#ddd]" />

      {/* Actions */}
      <div className="flex gap-1 items-center">
        <button
          aria-label="Annuler"
          className={buttonClass(false)}
          disabled={!editor.can().chain().focus().undo().run()}
          onClick={() => editor.chain().focus().undo().run()}
          title="Annuler"
          type="button"
        >
          <Icone icone={UndoIcon} />
        </button>
        <button
          aria-label="Rétablir"
          className={buttonClass(false)}
          disabled={!editor.can().chain().focus().redo().run()}
          onClick={() => editor.chain().focus().redo().run()}
          title="Rétablir"
          type="button"
        >
          <Icone icone={RedoIcon} />
        </button>
      </div>

      <div className="w-px h-6 mx-1 bg-[#ddd]" />

      {/* Nettoyage */}
      <div className="flex gap-1 items-center">
        <button
          aria-label="Effacer le formatage"
          className={buttonClass(false)}
          onClick={() => editor.chain().focus().unsetAllMarks().run()}
          title="Effacer le formatage"
          type="button"
        >
          <Icone icone={ClearFormatIcon} />
        </button>
        <button
          aria-label="Effacer les styles de bloc"
          className={buttonClass(false)}
          onClick={() => editor.chain().focus().clearNodes().run()}
          title="Effacer les styles de bloc"
          type="button"
        >
          <Icone icone={ClearNodesIcon} />
        </button>
      </div>
    </div>
  );
};
