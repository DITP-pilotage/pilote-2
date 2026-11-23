import { CALLOUT_VARIANTES, COULEURS_CALLOUT } from '@pilote/kpilote-ui/Callout'
import { registreIcones, TYPES_ICONE } from '@pilote/kpilote-ui/centre-aide'
import type { MediaKind } from '@pilote/kpilote-shared/mediaUrl'
import { estUrlHttpSure } from '@pilote/kpilote-shared/url'
import type { Editor } from '@tiptap/react'
import {
  Heading,
  Heading1,
  Heading2,
  Heading3,
  Heading4,
  Heading5,
  Heading6,
  Image as ImageIcon,
  Info,
  Link2,
  List,
  ListOrdered,
  MessageSquareText,
  Minus,
  Video as VideoIcon,
} from 'lucide-react'
import type { ComponentType } from 'react'

export type OptionBloc = {
  label: string
  keywords: string
  Icon: ComponentType<{ className?: string }>
  run?: () => void
  sousOptions?: OptionBloc[]
}

const LABELS_ICONE: Record<string, string> = {
  info: 'Info',
  success: 'Succès',
  warning: 'Attention',
  error: 'Alerte',
  idea: 'Idée',
  flag: 'Drapeau',
  question: 'Question',
}

export type ActionsBlocs = {
  openMediaModal?: (kind: MediaKind) => void
}

// Source unique des blocs insérables, consommée par la commande « / ». Un bloc
// peut ouvrir un sous-menu de variantes (couleur du callout, source vidéo…).
export const construireOptionsBlocs = (
  editor: Editor,
  actions: ActionsBlocs = {},
): OptionBloc[] => {
  const insererLien = () => {
    const url = window.prompt('URL du lien')
    if (!url || !estUrlHttpSure(url)) return
    // Sélection présente → on pose le lien dessus ; sinon on insère l'URL comme texte lié.
    if (editor.state.selection.empty) {
      editor
        .chain()
        .focus()
        .insertContent({ type: 'text', text: url, marks: [{ type: 'link', attrs: { href: url } }] })
        .run()
    } else {
      editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
    }
  }

  return [
    {
      label: 'Encadré (callout)',
      keywords: 'callout encadre info alerte',
      Icon: MessageSquareText,
      sousOptions: COULEURS_CALLOUT.map((color) => {
        const { label, Icon } = CALLOUT_VARIANTES[color]
        return {
          label,
          keywords: `callout ${label.toLowerCase()}`,
          Icon,
          run: () => editor.chain().focus().insertCallout({ color }).run(),
        }
      }),
    },
    {
      label: 'Accordéon',
      keywords: 'accordeon depliant',
      Icon: List,
      run: () => editor.chain().focus().insertAccordion().run(),
    },
    {
      label: 'Image',
      keywords: 'image photo',
      Icon: ImageIcon,
      run: () => actions.openMediaModal?.('image'),
    },
    {
      label: 'Vidéo',
      keywords: 'video film fichier iframe',
      Icon: VideoIcon,
      run: () => actions.openMediaModal?.('video'),
    },
    { label: 'Lien', keywords: 'lien url link', Icon: Link2, run: insererLien },
    {
      label: 'Icône',
      keywords: 'icone pictogramme',
      Icon: Info,
      sousOptions: TYPES_ICONE.map((type) => ({
        label: LABELS_ICONE[type] ?? type,
        keywords: `icone ${type}`,
        Icon: registreIcones[type] ?? Info,
        run: () => editor.chain().focus().insertIcone({ type }).run(),
      })),
    },
    {
      label: 'Titre',
      keywords: 'titre heading h1 h2 h3 h4 h5 h6',
      Icon: Heading,
      sousOptions: (
        [
          [1, Heading1],
          [2, Heading2],
          [3, Heading3],
          [4, Heading4],
          [5, Heading5],
          [6, Heading6],
        ] as const
      ).map(([niveau, Icone]) => ({
        label: `Titre H${niveau}`,
        keywords: `titre h${niveau}`,
        Icon: Icone,
        run: () => editor.chain().focus().toggleHeading({ level: niveau }).run(),
      })),
    },
    {
      label: 'Liste à puces',
      keywords: 'liste puces bullet',
      Icon: List,
      run: () => editor.chain().focus().toggleBulletList().run(),
    },
    {
      label: 'Liste numérotée',
      keywords: 'liste numerotee ordered',
      Icon: ListOrdered,
      run: () => editor.chain().focus().toggleOrderedList().run(),
    },
    {
      label: 'Séparateur',
      keywords: 'separateur trait ligne horizontal rule hr',
      Icon: Minus,
      run: () => editor.chain().focus().setHorizontalRule().run(),
    },
  ]
}
