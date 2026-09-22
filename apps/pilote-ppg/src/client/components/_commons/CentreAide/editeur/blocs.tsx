import type { Editor } from "@tiptap/react";
import type { ComponentType } from "react";
import { VARIANTES_CALLOUT } from "@/client/components/shared/Callout";
import { registreIcones } from "@/components/_commons/EditeurRiche/registreIcones";

type ComposantIcone = ComponentType<{ className?: string; fill?: string }>;

export type OptionBloc = {
  label: string;
  keywords: string;
  Icone: ComposantIcone;
  run?: () => void;
  sousOptions?: OptionBloc[];
};

export type ActionsBlocs = {
  ouvrirImage?: () => void;
  ouvrirVideo?: () => void;
  ouvrirLien?: () => void;
  ouvrirIcone?: () => void;
};

const icone = (nom: string): ComposantIcone =>
  registreIcones[nom] ?? registreIcones.InformationPleineIcon;

export const NIVEAUX_TITRE = [1, 2, 3, 4, 5, 6] as const;

export const construireOptionsBlocs = (
  editor: Editor,
  actions: ActionsBlocs = {},
): OptionBloc[] => [
  {
    label: "Encadré",
    keywords: "callout encadre info alerte",
    Icone: icone("InformationPleineIcon"),
    sousOptions: VARIANTES_CALLOUT.map(({ couleur, libelle, Icone }) => ({
      label: libelle,
      keywords: `callout ${libelle.toLowerCase()}`,
      Icone,
      run: () => editor.chain().focus().insertCallout({ color: couleur }).run(),
    })),
  },
  {
    label: "Accordéon",
    keywords: "accordeon depliant",
    Icone: icone("ArrowDownCircleIcon"),
    run: () => editor.chain().focus().insertAccordion().run(),
  },
  {
    label: "Image",
    keywords: "image photo",
    Icone: icone("LayoutGridIcon"),
    run: () => actions.ouvrirImage?.(),
  },
  {
    label: "Vidéo",
    keywords: "video film fichier",
    Icone: icone("VideoIcon"),
    run: () => actions.ouvrirVideo?.(),
  },
  {
    label: "Lien",
    keywords: "lien url link",
    Icone: icone("LinkLineIcon"),
    run: () => actions.ouvrirLien?.(),
  },
  {
    label: "Icône",
    keywords: "icone pictogramme",
    Icone: icone("InformationPleineIcon"),
    run: () => actions.ouvrirIcone?.(),
  },
  {
    label: "Paragraphe",
    keywords: "paragraphe texte normal",
    Icone: icone("ParagraphIcon"),
    run: () => editor.chain().focus().setParagraph().run(),
  },
  {
    label: "Titre",
    keywords: "titre heading h1 h2 h3 h4 h5 h6",
    Icone: icone("FontSizeIcon"),
    sousOptions: NIVEAUX_TITRE.map((niveau) => ({
      label: `Titre H${niveau}`,
      keywords: `titre h${niveau}`,
      Icone: icone(`Heading${niveau}Icon`),
      run: () => editor.chain().focus().toggleHeading({ level: niveau }).run(),
    })),
  },
  {
    label: "Citation",
    keywords: "citation quote blockquote",
    Icone: icone("BlockquoteIcon"),
    run: () => editor.chain().focus().toggleBlockquote().run(),
  },
  {
    label: "Liste à puces",
    keywords: "liste puces bullet",
    Icone: icone("BulletListIcon"),
    run: () => editor.chain().focus().toggleBulletList().run(),
  },
  {
    label: "Liste numérotée",
    keywords: "liste numerotee ordered",
    Icone: icone("ListOrderedIcon"),
    run: () => editor.chain().focus().toggleOrderedList().run(),
  },
  {
    label: "Séparateur",
    keywords: "separateur trait ligne horizontal",
    Icone: icone("SeparatorIcon"),
    run: () => editor.chain().focus().setHorizontalRule().run(),
  },
];
