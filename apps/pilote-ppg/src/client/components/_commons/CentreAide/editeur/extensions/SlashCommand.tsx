import { Extension } from "@tiptap/core";
import { ReactRenderer } from "@tiptap/react";
import {
  Suggestion,
  type SuggestionKeyDownProps,
  type SuggestionProps,
} from "@tiptap/suggestion";
import { forwardRef, useEffect, useImperativeHandle, useState } from "react";
import { clsxm } from "@/utils/clsxm";
import {
  construireOptionsBlocs,
  type ActionsBlocs,
  type OptionBloc,
} from "../blocs";

type ListeHandle = { onKeyDown: (event: KeyboardEvent) => boolean };

const ListeSlash = forwardRef<ListeHandle, SuggestionProps<OptionBloc>>(
  function ListeSlash(props, ref) {
    const [index, setIndex] = useState(0);
    const [sousListe, setSousListe] = useState<OptionBloc[] | null>(null);

    // props.items change de référence à chaque transaction : ne remettre le
    // sous-menu à zéro que sur une frappe, sinon il se referme aussitôt ouvert.
    useEffect(() => {
      // oxlint-disable-next-line react/set-state-in-effect -- remise a zero volontaire du sous-menu, cf. commentaire ci-dessus
      setSousListe(null);
      setIndex(0);
    }, [props.query]);

    const liste = sousListe ?? props.items;

    const revenir = (): boolean => {
      if (!sousListe) return false;
      setSousListe(null);
      setIndex(0);
      return true;
    };

    const choisir = (position: number) => {
      const item = liste[position];
      if (!item) return;
      if (item.sousOptions) {
        setSousListe(item.sousOptions);
        setIndex(0);
        return;
      }
      props.command(item);
    };

    useImperativeHandle(ref, () => ({
      onKeyDown: (event) => {
        if (
          event.key === "Escape" ||
          event.key === "ArrowLeft" ||
          event.key === "Backspace"
        ) {
          return revenir();
        }
        if (liste.length === 0) return false;
        if (event.key === "ArrowUp") {
          setIndex((courant) => (courant + liste.length - 1) % liste.length);
          return true;
        }
        if (event.key === "ArrowDown") {
          setIndex((courant) => (courant + 1) % liste.length);
          return true;
        }
        if (event.key === "Enter" || event.key === "Tab") {
          choisir(index);
          return true;
        }
        if (event.key === "ArrowRight") {
          if (!liste[index]?.sousOptions) return false;
          choisir(index);
          return true;
        }
        return false;
      },
    }));

    if (liste.length === 0) return null;

    return (
      <div className="w-60 overflow-hidden rounded-md border border-gray-200 bg-white shadow-lg">
        {sousListe && (
          <button
            className="flex w-full items-center gap-2 border-b border-gray-200 px-3 py-1.5 text-left text-xs text-gray-500 hover:bg-gray-50"
            onClick={revenir}
            onMouseDown={(event) => event.preventDefault()}
            type="button"
          >
            ← Retour
          </button>
        )}
        {liste.map((item, position) => (
          <button
            className={clsxm(
              "flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm",
              position === index && "bg-gray-100",
            )}
            key={item.label}
            onClick={() => choisir(position)}
            onMouseDown={(event) => event.preventDefault()}
            onMouseEnter={() => setIndex(position)}
            type="button"
          >
            <item.Icone className="w-4 h-4 text-gray-500" fill="currentColor" />
            {item.label}
            {item.sousOptions && (
              <span className="ml-auto text-gray-400">›</span>
            )}
          </button>
        ))}
      </div>
    );
  },
);

const MARGE = 6;

const render = () => {
  let composant: ReactRenderer<
    ListeHandle,
    SuggestionProps<OptionBloc>
  > | null = null;
  let boite: HTMLDivElement | null = null;
  let ancrage: (() => DOMRect | null) | null | undefined = null;

  const placer = () => {
    const rect = ancrage?.();
    if (!boite || !rect) return;

    const hauteur = boite.offsetHeight;
    const placeEnDessous = window.innerHeight - rect.bottom - MARGE;
    const tientAuDessus = rect.top > hauteur + MARGE;
    boite.style.top =
      hauteur > placeEnDessous && tientAuDessus
        ? `${rect.top - hauteur - MARGE}px`
        : `${rect.bottom + MARGE}px`;

    const debordement = window.innerWidth - boite.offsetWidth - MARGE;
    boite.style.left = `${Math.max(MARGE, Math.min(rect.left, debordement))}px`;
  };

  const detruire = () => {
    window.removeEventListener("scroll", placer, true);
    window.removeEventListener("resize", placer);
    boite?.remove();
    boite = null;
    ancrage = null;
  };

  return {
    onStart: (props: SuggestionProps<OptionBloc>) => {
      composant = new ReactRenderer(ListeSlash, {
        props,
        editor: props.editor,
      });
      boite = document.createElement("div");
      boite.style.position = "fixed";
      boite.style.zIndex = "50";
      boite.appendChild(composant.element);
      document.body.appendChild(boite);
      ancrage = props.clientRect;
      // Le scroll ne declenche pas onUpdate : sans ces ecoutes la boite reste
      // la ou elle a ete posee pendant que le curseur, lui, defile.
      window.addEventListener("scroll", placer, true);
      window.addEventListener("resize", placer);
      placer();
      // La liste n'est pas encore montee au premier appel : sa hauteur vaut zero
      // et le retournement ne peut pas etre decide.
      requestAnimationFrame(placer);
    },
    onUpdate: (props: SuggestionProps<OptionBloc>) => {
      composant?.updateProps(props);
      ancrage = props.clientRect;
      placer();
    },
    onKeyDown: (props: SuggestionKeyDownProps) => {
      if (props.event.key === "Escape") {
        detruire();
        return true;
      }
      return composant?.ref?.onKeyDown(props.event) ?? false;
    },
    onExit: () => {
      detruire();
      composant?.destroy();
      composant = null;
    },
  };
};

export const SlashCommand = Extension.create<ActionsBlocs>({
  name: "slashCommand",

  addOptions() {
    return {};
  },

  addProseMirrorPlugins() {
    const editor = this.editor;
    const actions = this.options;

    return [
      Suggestion<OptionBloc, OptionBloc>({
        editor,
        char: "/",
        items: ({ query }) => {
          const recherche = query.toLowerCase();
          return construireOptionsBlocs(editor, actions).filter(
            (option) =>
              option.label.toLowerCase().includes(recherche) ||
              option.keywords.includes(recherche),
          );
        },
        command: ({ editor: instance, range, props }) => {
          instance.chain().focus().deleteRange(range).run();
          props.run?.();
        },
        render,
      }),
    ];
  },
});
