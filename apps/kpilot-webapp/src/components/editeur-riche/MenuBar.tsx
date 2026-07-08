import type { Editor } from '@tiptap/react'
import {
  Bold,
  Italic,
  Link2,
  List,
  ListOrdered,
  Redo2,
  Strikethrough,
  Underline as UnderlineIcon,
  Undo2,
} from 'lucide-react'
import type { ComponentType } from 'react'

import { clsxm } from '@/lib/clsxm'

function BoutonOutil({
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
        'flex size-8 items-center justify-center rounded-md text-text-muted transition-colors hover:bg-surface-tinted hover:text-text',
        actif && 'bg-primary-tinted text-primary',
      )}
    >
      <Icon className="size-4" />
    </button>
  )
}

export function MenuBar({ editor }: { editor: Editor }) {
  const definirLien = () => {
    const precedent = editor.getAttributes('link').href as string | undefined
    const url = window.prompt('URL du lien', precedent ?? '')
    if (url === null) return
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
      return
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
  }

  return (
    <div className="flex flex-wrap items-center gap-0.5 border-b border-border bg-surface-tinted px-2 py-1.5">
      <BoutonOutil
        label="Gras"
        Icon={Bold}
        actif={editor.isActive('bold')}
        onClick={() => editor.chain().focus().toggleBold().run()}
      />
      <BoutonOutil
        label="Italique"
        Icon={Italic}
        actif={editor.isActive('italic')}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      />
      <BoutonOutil
        label="Souligné"
        Icon={UnderlineIcon}
        actif={editor.isActive('underline')}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
      />
      <BoutonOutil
        label="Barré"
        Icon={Strikethrough}
        actif={editor.isActive('strike')}
        onClick={() => editor.chain().focus().toggleStrike().run()}
      />
      <span className="mx-1 h-5 w-px bg-border" aria-hidden />
      <BoutonOutil
        label="Liste à puces"
        Icon={List}
        actif={editor.isActive('bulletList')}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      />
      <BoutonOutil
        label="Liste numérotée"
        Icon={ListOrdered}
        actif={editor.isActive('orderedList')}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      />
      <span className="mx-1 h-5 w-px bg-border" aria-hidden />
      <BoutonOutil
        label="Lien"
        Icon={Link2}
        actif={editor.isActive('link')}
        onClick={definirLien}
      />
      <span className="mx-1 h-5 w-px bg-border" aria-hidden />
      <BoutonOutil
        label="Annuler"
        Icon={Undo2}
        onClick={() => editor.chain().focus().undo().run()}
      />
      <BoutonOutil
        label="Rétablir"
        Icon={Redo2}
        onClick={() => editor.chain().focus().redo().run()}
      />
    </div>
  )
}
