import { Extension } from '@tiptap/core'
import { ReactRenderer } from '@tiptap/react'
import { Suggestion, type SuggestionKeyDownProps, type SuggestionProps } from '@tiptap/suggestion'
import { forwardRef, useEffect, useImperativeHandle, useState } from 'react'

import { construireOptionsBlocs, type OptionBloc } from '@/components/centre-aide/blocs'
import { clsxm } from '@/lib/clsxm'

type ListeHandle = { onKeyDown: (event: KeyboardEvent) => boolean }

const ListeSlash = forwardRef<ListeHandle, SuggestionProps<OptionBloc>>(
  function ListeSlash(props, ref) {
    const [index, setIndex] = useState(0)
    const [sousListe, setSousListe] = useState<OptionBloc[] | null>(null)
    // Une nouvelle recherche (frappe) réinitialise le sous-menu et la sélection.
    useEffect(() => {
      setSousListe(null)
      setIndex(0)
    }, [props.items])

    const liste = sousListe ?? props.items

    const revenir = (): boolean => {
      if (!sousListe) return false
      setSousListe(null)
      setIndex(0)
      return true
    }

    const choisir = (position: number) => {
      const item = liste[position]
      if (!item) return
      if (item.sousOptions) {
        setSousListe(item.sousOptions)
        setIndex(0)
        return
      }
      props.command(item)
    }

    useImperativeHandle(ref, () => ({
      onKeyDown: (event) => {
        if (event.key === 'Escape' || event.key === 'ArrowLeft' || event.key === 'Backspace') {
          return revenir()
        }
        if (liste.length === 0) return false
        if (event.key === 'ArrowUp') {
          setIndex((courant) => (courant + liste.length - 1) % liste.length)
          return true
        }
        if (event.key === 'ArrowDown') {
          setIndex((courant) => (courant + 1) % liste.length)
          return true
        }
        if (event.key === 'Enter') {
          choisir(index)
          return true
        }
        return false
      },
    }))

    if (liste.length === 0) return null
    return (
      <div className="w-60 overflow-hidden rounded-md border border-border bg-surface shadow-raised">
        {sousListe ? (
          <button
            type="button"
            onClick={revenir}
            className="flex w-full items-center gap-2 border-b border-border px-3 py-1.5 text-left text-xs text-text-muted hover:bg-surface-tinted"
          >
            ← Retour
          </button>
        ) : null}
        {liste.map((item, position) => (
          <button
            key={item.label}
            type="button"
            onMouseEnter={() => setIndex(position)}
            onClick={() => choisir(position)}
            className={clsxm(
              'flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm',
              position === index ? 'bg-surface-tinted' : '',
            )}
          >
            <item.Icon className="size-4 text-text-muted" />
            {item.label}
            {item.sousOptions ? <span className="ml-auto text-text-subtle">›</span> : null}
          </button>
        ))}
      </div>
    )
  },
)

const render = () => {
  let composant: ReactRenderer<ListeHandle, SuggestionProps<OptionBloc>> | null = null
  let boite: HTMLDivElement | null = null

  const placer = (clientRect: (() => DOMRect | null) | null | undefined) => {
    const rect = clientRect?.()
    if (!boite || !rect) return
    boite.style.top = `${rect.bottom + 6}px`
    boite.style.left = `${rect.left}px`
  }

  return {
    onStart: (props: SuggestionProps<OptionBloc>) => {
      composant = new ReactRenderer(ListeSlash, { props, editor: props.editor })
      boite = document.createElement('div')
      boite.style.position = 'fixed'
      boite.style.zIndex = '50'
      boite.appendChild(composant.element)
      document.body.appendChild(boite)
      placer(props.clientRect)
    },
    onUpdate: (props: SuggestionProps<OptionBloc>) => {
      composant?.updateProps(props)
      placer(props.clientRect)
    },
    onKeyDown: (props: SuggestionKeyDownProps) => {
      if (props.event.key === 'Escape') {
        boite?.remove()
        boite = null
        return true
      }
      return composant?.ref?.onKeyDown(props.event) ?? false
    },
    onExit: () => {
      boite?.remove()
      composant?.destroy()
      boite = null
      composant = null
    },
  }
}

export const SlashCommand = Extension.create({
  name: 'slashCommand',

  addProseMirrorPlugins() {
    const editor = this.editor
    return [
      Suggestion<OptionBloc, OptionBloc>({
        editor,
        char: '/',
        items: ({ query }) => {
          const recherche = query.toLowerCase()
          return construireOptionsBlocs(editor).filter(
            (option) =>
              option.label.toLowerCase().includes(recherche) || option.keywords.includes(recherche),
          )
        },
        command: ({ editor: instance, range, props }) => {
          instance.chain().focus().deleteRange(range).run()
          props.run?.()
        },
        render,
      }),
    ]
  },
})
