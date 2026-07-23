import { EditorContent, useEditor } from '@tiptap/react'
import { BubbleMenu } from '@tiptap/react/menus'
import { classesRenduBase } from '@pilote/kpilote-ui/centre-aide'
import {
  Bold,
  Heading2,
  Heading3,
  Italic,
  Link2,
  Strikethrough,
  Underline as UnderlineIcon,
} from 'lucide-react'
import type { ComponentType } from 'react'

import { estUrlHttp } from '@/components/centre-aide/blocs'
import { extensionsCentreAide } from '@/components/centre-aide/extensions'
import { clsxm } from '@/lib/clsxm'

function BoutonBulle({
  actif = false,
  onClick,
  label,
  Icon,
}: {
  actif?: boolean
  onClick: () => void
  label: string
  Icon: ComponentType<{ className?: string }>
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={actif}
      title={label}
      onClick={onClick}
      className={clsxm(
        'flex size-8 items-center justify-center rounded text-white/90 transition-colors hover:bg-white/15',
        actif && 'bg-white/20 text-white',
      )}
    >
      <Icon className="size-4" />
    </button>
  )
}

const classesContenu = clsxm(
  classesRenduBase,
  'text-text',
  // Surface d'édition pleine largeur/hauteur, sans marge ni padding.
  '[&_.ProseMirror]:min-h-[calc(100vh-13rem)] [&_.ProseMirror]:outline-none',
  '[&_.ProseMirror_.is-editor-empty:first-child]:before:pointer-events-none',
  '[&_.ProseMirror_.is-editor-empty:first-child]:before:float-left',
  '[&_.ProseMirror_.is-editor-empty:first-child]:before:h-0',
  '[&_.ProseMirror_.is-editor-empty:first-child]:before:text-text-subtle',
  '[&_.ProseMirror_.is-editor-empty:first-child]:before:content-[attr(data-placeholder)]',
)

export function EditeurCentreAide({
  contenu,
  onChange,
}: {
  contenu: string
  onChange: (contenu: string) => void
}) {
  const editor = useEditor({
    extensions: extensionsCentreAide(),
    content: contenu,
    onUpdate: ({ editor: instance }) => onChange(instance.isEmpty ? '' : instance.getHTML()),
  })

  if (!editor) return null

  const definirLien = () => {
    const precedent = editor.getAttributes('link').href as string | undefined
    const url = window.prompt('URL du lien', precedent ?? '')
    if (url === null) return
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
      return
    }
    if (estUrlHttp(url)) editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
  }

  return (
    <div>
      <BubbleMenu
        editor={editor}
        className="flex items-center gap-0.5 rounded-lg bg-[#1f2430] p-1 shadow-raised"
      >
        <BoutonBulle
          label="Gras"
          Icon={Bold}
          actif={editor.isActive('bold')}
          onClick={() => editor.chain().focus().toggleBold().run()}
        />
        <BoutonBulle
          label="Italique"
          Icon={Italic}
          actif={editor.isActive('italic')}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        />
        <BoutonBulle
          label="Souligné"
          Icon={UnderlineIcon}
          actif={editor.isActive('underline')}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
        />
        <BoutonBulle
          label="Barré"
          Icon={Strikethrough}
          actif={editor.isActive('strike')}
          onClick={() => editor.chain().focus().toggleStrike().run()}
        />
        <span className="mx-1 h-5 w-px bg-white/20" aria-hidden />
        <BoutonBulle
          label="Titre 2"
          Icon={Heading2}
          actif={editor.isActive('heading', { level: 2 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        />
        <BoutonBulle
          label="Titre 3"
          Icon={Heading3}
          actif={editor.isActive('heading', { level: 3 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        />
        <BoutonBulle
          label="Lien"
          Icon={Link2}
          actif={editor.isActive('link')}
          onClick={definirLien}
        />
      </BubbleMenu>

      <EditorContent editor={editor} className={classesContenu} />
    </div>
  )
}
