import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import Underline from '@tiptap/extension-underline'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'

import { MenuBar } from '@/components/editeur-riche/MenuBar'

type EditeurRicheProps = {
  contenu: string
  onChange: (contenu: string) => void
  placeholder?: string
}

const classesContenu = [
  'px-4 py-3 text-sm leading-relaxed text-text',
  '[&_.ProseMirror]:min-h-28 [&_.ProseMirror]:outline-none',
  '[&_.ProseMirror_a]:text-primary [&_.ProseMirror_a]:underline',
  '[&_.ProseMirror_ul]:list-disc [&_.ProseMirror_ul]:pl-5',
  '[&_.ProseMirror_ol]:list-decimal [&_.ProseMirror_ol]:pl-5',
  '[&_.ProseMirror_.is-editor-empty:first-child]:before:pointer-events-none',
  '[&_.ProseMirror_.is-editor-empty:first-child]:before:float-left',
  '[&_.ProseMirror_.is-editor-empty:first-child]:before:h-0',
  '[&_.ProseMirror_.is-editor-empty:first-child]:before:text-text-subtle',
  '[&_.ProseMirror_.is-editor-empty:first-child]:before:content-[attr(data-placeholder)]',
].join(' ')

export function EditeurRiche({ contenu, onChange, placeholder }: EditeurRicheProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        code: false,
        codeBlock: false,
        blockquote: false,
        horizontalRule: false,
      }),
      Link.configure({ openOnClick: false }),
      Underline,
      Placeholder.configure({ placeholder: placeholder ?? 'Saisissez votre commentaire…' }),
    ],
    content: contenu,
    onUpdate: ({ editor: instance }) => {
      onChange(instance.isEmpty ? '' : instance.getHTML())
    },
  })

  if (!editor) return null

  return (
    <div className="overflow-hidden rounded-md border border-primary ring-2 ring-primary-tinted">
      <MenuBar editor={editor} />
      <EditorContent editor={editor} className={classesContenu} />
    </div>
  )
}
