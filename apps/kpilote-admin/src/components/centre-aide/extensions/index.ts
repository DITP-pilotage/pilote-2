import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import Underline from '@tiptap/extension-underline'
import type { Extensions } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'

import { AccordeonExtension } from './AccordeonExtension'
import { CalloutExtension } from './CalloutExtension'
import { IconeExtension } from './IconeExtension'
import { SlashCommand } from './SlashCommand'
import { VideoExtension } from './VideoExtension'

export const extensionsCentreAide = (
  placeholder = 'Écrivez, ou tapez « / » pour insérer un bloc…',
): Extensions => [
  // Entrée = nouveau paragraphe (bloc distinct) : la mise en titre ne s'applique
  // qu'au bloc sélectionné, jamais aux lignes adjacentes (PIL-1685 #3).
  StarterKit.configure({ heading: { levels: [2, 3] }, code: false, codeBlock: false }),
  Underline,
  Link.configure({ openOnClick: false }),
  Image.configure({ allowBase64: false, HTMLAttributes: { class: 'max-w-full rounded-md' } }),
  Placeholder.configure({ placeholder }),
  CalloutExtension,
  AccordeonExtension,
  IconeExtension,
  VideoExtension,
  SlashCommand,
]
