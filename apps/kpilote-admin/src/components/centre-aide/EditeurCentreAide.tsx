import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import Underline from '@tiptap/extension-underline'
import { EditorContent, useEditor, type Editor } from '@tiptap/react'
import { BubbleMenu } from '@tiptap/react/menus'
import StarterKit from '@tiptap/starter-kit'
import { classesRenduBase } from '@pilote/kpilote-ui/centre-aide'
import {
  Bold,
  Heading2,
  Heading3,
  Image as ImageIcon,
  Info,
  Italic,
  Link2,
  List,
  ListOrdered,
  MessageSquareText,
  Plus,
  Strikethrough,
  Underline as UnderlineIcon,
  Video as VideoIcon,
} from 'lucide-react'
import { useState, type ComponentType } from 'react'

import { clsxm } from '@/lib/clsxm'
import { AccordeonExtension } from '@/components/centre-aide/extensions/AccordeonExtension'
import { CalloutExtension } from '@/components/centre-aide/extensions/CalloutExtension'
import { IconeExtension } from '@/components/centre-aide/extensions/IconeExtension'
import { VideoExtension } from '@/components/centre-aide/extensions/VideoExtension'

const estUrlHttp = (url: string): boolean => {
  try {
    const parsee = new URL(url)
    return parsee.protocol === 'https:' || parsee.protocol === 'http:'
  } catch {
    return false
  }
}

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

function MenuInsertion({ editor }: { editor: Editor }) {
  const [ouvert, setOuvert] = useState(false)

  const inserer = (action: () => void) => {
    action()
    setOuvert(false)
  }

  const insererImage = () => {
    const url = window.prompt('URL de l’image')
    if (url && estUrlHttp(url)) editor.chain().focus().setImage({ src: url }).run()
  }
  const insererVideo = () => {
    const url = window.prompt('URL d’intégration de la vidéo (iframe)')
    if (url && estUrlHttp(url)) editor.chain().focus().insertVideo({ src: url }).run()
  }

  const options: {
    label: string
    Icon: ComponentType<{ className?: string }>
    onClick: () => void
  }[] = [
    {
      label: 'Encadré (callout)',
      Icon: MessageSquareText,
      onClick: () => editor.chain().focus().insertCallout({ color: 'info' }).run(),
    },
    {
      label: 'Accordéon',
      Icon: List,
      onClick: () => editor.chain().focus().insertAccordion().run(),
    },
    { label: 'Image', Icon: ImageIcon, onClick: insererImage },
    { label: 'Vidéo', Icon: VideoIcon, onClick: insererVideo },
    {
      label: 'Icône',
      Icon: Info,
      onClick: () => editor.chain().focus().insertIcone({ type: 'info' }).run(),
    },
    {
      label: 'Titre H2',
      Icon: Heading2,
      onClick: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
    },
    {
      label: 'Titre H3',
      Icon: Heading3,
      onClick: () => editor.chain().focus().toggleHeading({ level: 3 }).run(),
    },
    {
      label: 'Liste à puces',
      Icon: List,
      onClick: () => editor.chain().focus().toggleBulletList().run(),
    },
    {
      label: 'Liste numérotée',
      Icon: ListOrdered,
      onClick: () => editor.chain().focus().toggleOrderedList().run(),
    },
  ]

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOuvert((prec) => !prec)}
        className="flex items-center gap-1.5 rounded-md border border-border bg-surface px-2.5 py-1.5 text-sm font-medium text-text-muted transition-colors hover:border-primary hover:text-primary"
      >
        <Plus className="size-4" /> Insérer
      </button>
      {ouvert ? (
        <div className="absolute z-10 mt-1 w-56 overflow-hidden rounded-md border border-border bg-surface shadow-raised">
          {options.map((option) => (
            <button
              key={option.label}
              type="button"
              onClick={() => inserer(option.onClick)}
              className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm hover:bg-surface-tinted"
            >
              <option.Icon className="size-4 text-text-muted" />
              {option.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}

const classesContenu = clsxm(
  classesRenduBase,
  'px-4 py-4 text-text',
  '[&_.ProseMirror]:min-h-64 [&_.ProseMirror]:outline-none',
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
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3] }, code: false, codeBlock: false }),
      Underline,
      Link.configure({ openOnClick: false }),
      Image.configure({ allowBase64: false, HTMLAttributes: { class: 'max-w-full rounded-md' } }),
      Placeholder.configure({ placeholder: 'Rédigez votre article…' }),
      CalloutExtension,
      AccordeonExtension,
      IconeExtension,
      VideoExtension,
    ],
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
    <div className="rounded-md border border-border">
      <div className="flex items-center gap-2 border-b border-border bg-surface-tinted px-3 py-2">
        <MenuInsertion editor={editor} />
        <span className="text-xs text-text-subtle">
          Sélectionnez du texte pour la mise en forme
        </span>
      </div>

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
