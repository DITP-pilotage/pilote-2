import { registreIcones, TYPES_ICONE } from '@pilote/kpilote-ui/centre-aide'
import type { Editor } from '@tiptap/react'
import {
  CircleCheck,
  CircleX,
  Heading,
  Heading1,
  Heading2,
  Heading3,
  Heading4,
  Heading5,
  Heading6,
  Image as ImageIcon,
  Info,
  List,
  ListOrdered,
  MessageSquareText,
  TriangleAlert,
  Video as VideoIcon,
} from 'lucide-react'
import type { ComponentType } from 'react'

export const estUrlHttp = (url: string): boolean => {
  try {
    const parsee = new URL(url)
    return parsee.protocol === 'https:' || parsee.protocol === 'http:'
  } catch {
    return false
  }
}

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

// Source unique des blocs insérables : consommée par le menu « Insérer » (souris)
// et par la commande « / » (clavier). Un bloc peut ouvrir un sous-menu de variantes
// (ex. couleur du callout) plutôt qu'un select dans le composant.
export const construireOptionsBlocs = (editor: Editor): OptionBloc[] => {
  const insererImage = () => {
    const url = window.prompt('URL de l’image')
    if (url && estUrlHttp(url)) editor.chain().focus().setImage({ src: url }).run()
  }
  const insererVideo = () => {
    const url = window.prompt('URL d’intégration de la vidéo (iframe)')
    if (url && estUrlHttp(url)) editor.chain().focus().insertVideo({ src: url }).run()
  }

  const varianteCallout = (
    color: 'info' | 'success' | 'warning' | 'error',
    label: string,
    Icon: ComponentType<{ className?: string }>,
  ): OptionBloc => ({
    label,
    keywords: `callout ${label.toLowerCase()}`,
    Icon,
    run: () => editor.chain().focus().insertCallout({ color }).run(),
  })

  return [
    {
      label: 'Encadré (callout)',
      keywords: 'callout encadre info alerte',
      Icon: MessageSquareText,
      sousOptions: [
        varianteCallout('info', 'Info', Info),
        varianteCallout('success', 'Succès', CircleCheck),
        varianteCallout('warning', 'Attention', TriangleAlert),
        varianteCallout('error', 'Alerte', CircleX),
      ],
    },
    {
      label: 'Accordéon',
      keywords: 'accordeon depliant',
      Icon: List,
      run: () => editor.chain().focus().insertAccordion().run(),
    },
    { label: 'Image', keywords: 'image photo', Icon: ImageIcon, run: insererImage },
    { label: 'Vidéo', keywords: 'video iframe', Icon: VideoIcon, run: insererVideo },
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
  ]
}
