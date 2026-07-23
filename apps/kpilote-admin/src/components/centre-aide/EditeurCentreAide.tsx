import { EditorContent, useEditor, useEditorState } from '@tiptap/react'
import { BubbleMenu } from '@tiptap/react/menus'
import { classesRenduBase } from '@pilote/kpilote-ui/centre-aide'
import { Bold, Italic, Link2, Strikethrough, Underline as UnderlineIcon } from 'lucide-react'
import { useState, type ComponentType } from 'react'

import { estUrlHttp } from '@/components/centre-aide/blocs'
import { extensionsCentreAide } from '@/components/centre-aide/extensions'
import { ModaleVideoFinance } from '@/components/centre-aide/ModaleVideoFinance'
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
      // Empêche le blur de l'éditeur au clic : ProseMirror garde le focus et la
      // sélection courante (sinon l'ancienne sélection reste figée à l'écran).
      onMouseDown={(event) => event.preventDefault()}
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
  // Placeholder « / » sur la ligne vide courante (façon Linear), pas seulement la première.
  '[&_.ProseMirror_.is-empty]:before:pointer-events-none',
  '[&_.ProseMirror_.is-empty]:before:float-left',
  '[&_.ProseMirror_.is-empty]:before:h-0',
  '[&_.ProseMirror_.is-empty]:before:text-text-subtle',
  '[&_.ProseMirror_.is-empty]:before:content-[attr(data-placeholder)]',
)

export function EditeurCentreAide({
  contenu,
  onChange,
}: {
  contenu: string
  onChange: (contenu: string) => void
}) {
  const [modaleVideoFinance, setModaleVideoFinance] = useState(false)

  const editor = useEditor({
    extensions: extensionsCentreAide({ ouvrirVideoFinance: () => setModaleVideoFinance(true) }),
    content: contenu,
    onUpdate: ({ editor: instance }) => onChange(instance.isEmpty ? '' : instance.getHTML()),
  })

  // tiptap v3 ne re-render plus le composant à chaque transaction : on souscrit
  // explicitement aux états actifs pour que la bulle reflète la sélection courante.
  const etats = useEditorState({
    editor,
    selector: ({ editor: instance }) => ({
      bold: instance?.isActive('bold') ?? false,
      italic: instance?.isActive('italic') ?? false,
      underline: instance?.isActive('underline') ?? false,
      strike: instance?.isActive('strike') ?? false,
      link: instance?.isActive('link') ?? false,
    }),
  })

  if (!editor || !etats) return null

  // Depuis la bulle : agit sur le texte sélectionné (poser / retirer le lien).
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
          actif={etats.bold}
          onClick={() => editor.chain().focus().toggleBold().run()}
        />
        <BoutonBulle
          label="Italique"
          Icon={Italic}
          actif={etats.italic}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        />
        <BoutonBulle
          label="Souligné"
          Icon={UnderlineIcon}
          actif={etats.underline}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
        />
        <BoutonBulle
          label="Barré"
          Icon={Strikethrough}
          actif={etats.strike}
          onClick={() => editor.chain().focus().toggleStrike().run()}
        />
        <span className="mx-1 h-5 w-px bg-white/20" aria-hidden />
        <BoutonBulle label="Lien" Icon={Link2} actif={etats.link} onClick={definirLien} />
      </BubbleMenu>

      <EditorContent editor={editor} className={classesContenu} />

      <ModaleVideoFinance
        open={modaleVideoFinance}
        onClose={() => setModaleVideoFinance(false)}
        onValider={(url) => editor.chain().focus().insertVideo({ src: url }).run()}
      />
    </div>
  )
}
