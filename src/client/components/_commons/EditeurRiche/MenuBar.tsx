import { Fragment, ReactNode } from "react";
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
import { InformationPleineIcon } from "@/components/_commons/Icones/InformationPleineIcon";
import { ListUnorderedIcon } from "@/components/_commons/Icones/ListUnorderedIcon";
import { EtoileIcon } from "@/components/_commons/Icones/EtoileIcon";

export const MenuBar = ({ editor }: { editor: Editor }) => {
  if (!editor) {
    return null;
  }

  const hasExtension = (name: string) =>
    editor.extensionManager.extensions.some((ext) => ext.name === name);

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

  const formatageTexte = (): ReactNode | null => {
    const boutons: ReactNode[] = [];

    if (hasExtension("bold")) {
      boutons.push(
        <button
          aria-label="Gras"
          aria-pressed={editor.isActive("bold")}
          className={buttonClass(editor.isActive("bold"))}
          disabled={!editor.can().chain().focus().toggleBold().run()}
          key="bold"
          onClick={() => editor.chain().focus().toggleBold().run()}
          title="Gras"
          type="button"
        >
          <Icone icone={BoldIcon} />
        </button>,
      );
    }

    if (hasExtension("italic")) {
      boutons.push(
        <button
          aria-label="Italique"
          aria-pressed={editor.isActive("italic")}
          className={buttonClass(editor.isActive("italic"))}
          disabled={!editor.can().chain().focus().toggleItalic().run()}
          key="italic"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          title="Italique"
          type="button"
        >
          <Icone icone={ItalicIcon} />
        </button>,
      );
    }

    if (hasExtension("strike")) {
      boutons.push(
        <button
          aria-label="Barré"
          aria-pressed={editor.isActive("strike")}
          className={buttonClass(editor.isActive("strike"))}
          disabled={!editor.can().chain().focus().toggleStrike().run()}
          key="strike"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          title="Barré"
          type="button"
        >
          <Icone icone={StrikethroughIcon} />
        </button>,
      );
    }

    if (hasExtension("underline")) {
      boutons.push(
        <button
          aria-label="Souligné"
          aria-pressed={editor.isActive("underline")}
          className={buttonClass(editor.isActive("underline"))}
          disabled={!editor.can().chain().focus().toggleUnderline().run()}
          key="underline"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          title="Souligné"
          type="button"
        >
          <Icone icone={UnderlineIcon} />
        </button>,
      );
    }

    if (hasExtension("code")) {
      boutons.push(
        <button
          aria-label="Ligne de code"
          aria-pressed={editor.isActive("code")}
          className={buttonClass(editor.isActive("code"))}
          disabled={!editor.can().chain().focus().toggleCode().run()}
          key="code"
          onClick={() => editor.chain().focus().toggleCode().run()}
          title="Ligne de code"
          type="button"
        >
          <Icone icone={CodeIcon} />
        </button>,
      );
    }

    if (boutons.length === 0) return null;
    return <div className="flex gap-1 items-center">{boutons}</div>;
  };

  const stylesParagraphe = (): ReactNode | null => {
    const boutons: ReactNode[] = [
      <button
        aria-label="Paragraphe"
        aria-pressed={editor.isActive("paragraph")}
        className={buttonClass(editor.isActive("paragraph"))}
        key="paragraph"
        onClick={() => editor.chain().focus().setParagraph().run()}
        title="Paragraphe"
        type="button"
      >
        <Icone icone={ParagraphIcon} />
      </button>,
    ];

    if (hasExtension("heading")) {
      const headingIcons = [
        Heading1Icon,
        Heading2Icon,
        Heading3Icon,
        Heading4Icon,
        Heading5Icon,
        Heading6Icon,
      ];

      headingIcons.forEach((icon, index) => {
        const level = (index + 1) as 1 | 2 | 3 | 4 | 5 | 6;
        boutons.push(
          <button
            aria-label={`Titre ${level}`}
            aria-pressed={editor.isActive("heading", { level })}
            className={buttonClass(editor.isActive("heading", { level }))}
            key={`heading-${level}`}
            onClick={() =>
              editor.chain().focus().toggleHeading({ level }).run()
            }
            title={`Titre ${level}`}
            type="button"
          >
            <Icone icone={icon} />
          </button>,
        );
      });
    }

    if (boutons.length <= 1 && !hasExtension("heading")) return null;
    return <div className="flex gap-1 items-center">{boutons}</div>;
  };

  const listes = (): ReactNode | null => {
    const boutons: ReactNode[] = [];

    if (hasExtension("bulletList")) {
      boutons.push(
        <button
          aria-label="Liste à puces"
          aria-pressed={editor.isActive("bulletList")}
          className={buttonClass(editor.isActive("bulletList"))}
          key="bulletList"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          title="Liste à puces"
          type="button"
        >
          <Icone icone={BulletListIcon} />
        </button>,
      );
    }

    if (hasExtension("orderedList")) {
      boutons.push(
        <button
          aria-label="Liste numérotée"
          aria-pressed={editor.isActive("orderedList")}
          className={buttonClass(editor.isActive("orderedList"))}
          key="orderedList"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          title="Liste numérotée"
          type="button"
        >
          <Icone icone={ListOrderedIcon} />
        </button>,
      );
    }

    if (boutons.length === 0) return null;
    return <div className="flex gap-1 items-center">{boutons}</div>;
  };

  const blocsSpeciaux = (): ReactNode | null => {
    const boutons: ReactNode[] = [];

    if (hasExtension("codeBlock")) {
      boutons.push(
        <button
          aria-label="Bloc de code"
          aria-pressed={editor.isActive("codeBlock")}
          className={buttonClass(editor.isActive("codeBlock"))}
          key="codeBlock"
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          title="Bloc de code"
          type="button"
        >
          <Icone icone={CodeBlockIcon} />
        </button>,
      );
    }

    if (hasExtension("blockquote")) {
      boutons.push(
        <button
          aria-label="Citation"
          aria-pressed={editor.isActive("blockquote")}
          className={buttonClass(editor.isActive("blockquote"))}
          key="blockquote"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          title="Citation"
          type="button"
        >
          <Icone icone={BlockquoteIcon} />
        </button>,
      );
    }

    if (hasExtension("horizontalRule")) {
      boutons.push(
        <button
          aria-label="Ligne horizontale"
          className={buttonClass(false)}
          key="horizontalRule"
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          title="Ligne horizontale"
          type="button"
        >
          <Icone icone={HorizontalRuleIcon} />
        </button>,
      );
    }

    if (hasExtension("hardBreak")) {
      boutons.push(
        <button
          aria-label="Retour à la ligne"
          className={buttonClass(false)}
          key="hardBreak"
          onClick={() => editor.chain().focus().setHardBreak().run()}
          title="Retour à la ligne"
          type="button"
        >
          <Icone icone={LineBreakIcon} />
        </button>,
      );
    }

    if (boutons.length === 0) return null;
    return <div className="flex gap-1 items-center">{boutons}</div>;
  };

  const actions = (): ReactNode => {
    return (
      <div className="flex gap-1 items-center">
        <button
          aria-label="Annuler"
          className={buttonClass(false)}
          disabled={!editor.can().chain().focus().undo().run()}
          key="undo"
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
          key="redo"
          onClick={() => editor.chain().focus().redo().run()}
          title="Rétablir"
          type="button"
        >
          <Icone icone={RedoIcon} />
        </button>
      </div>
    );
  };

  const composants = (): ReactNode | null => {
    const boutons: ReactNode[] = [];

    if (hasExtension("callout")) {
      boutons.push(
        <button
          aria-label="Callout"
          className={buttonClass(editor.isActive("callout"))}
          key="callout"
          onClick={() => editor.chain().focus().insertCallout().run()}
          title="Insérer un callout"
          type="button"
        >
          <Icone icone={InformationPleineIcon} />
        </button>,
      );
    }

    if (hasExtension("accordionItem")) {
      boutons.push(
        <button
          aria-label="Accordéon"
          className={buttonClass(editor.isActive("accordionItem"))}
          key="accordion"
          onClick={() => editor.chain().focus().insertAccordion().run()}
          title="Insérer un accordéon"
          type="button"
        >
          <Icone icone={ListUnorderedIcon} />
        </button>,
      );
    }

    if (hasExtension("icone")) {
      boutons.push(
        <button
          aria-label="Icône"
          className={buttonClass(false)}
          key="icone"
          onClick={() => editor.chain().focus().insertIcone().run()}
          title="Insérer une icône"
          type="button"
        >
          <Icone icone={EtoileIcon} />
        </button>,
      );
    }

    if (boutons.length === 0) return null;
    return <div className="flex gap-1 items-center">{boutons}</div>;
  };

  const nettoyage = (): ReactNode => {
    return (
      <div className="flex gap-1 items-center">
        <button
          aria-label="Effacer le formatage"
          className={buttonClass(false)}
          key="clearFormat"
          onClick={() => editor.chain().focus().unsetAllMarks().run()}
          title="Effacer le formatage"
          type="button"
        >
          <Icone icone={ClearFormatIcon} />
        </button>
        <button
          aria-label="Effacer les styles de bloc"
          className={buttonClass(false)}
          key="clearNodes"
          onClick={() => editor.chain().focus().clearNodes().run()}
          title="Effacer les styles de bloc"
          type="button"
        >
          <Icone icone={ClearNodesIcon} />
        </button>
      </div>
    );
  };

  const visibleGroups = [
    formatageTexte(),
    stylesParagraphe(),
    listes(),
    blocsSpeciaux(),
    actions(),
    composants(),
    nettoyage(),
  ].filter(Boolean) as ReactNode[];

  return (
    <div className="flex z-1 sticky top-0 flex-wrap gap-1 items-center p-2 border border-[#ddd] border-b-0 rounded-t !bg-white">
      {visibleGroups.map((group, index) => (
        <Fragment key={index}>
          {index > 0 && <div className="w-px h-6 mx-1 bg-[#ddd]" />}
          {group}
        </Fragment>
      ))}
    </div>
  );
};
