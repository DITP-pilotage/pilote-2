import type { Editor } from "@tiptap/react";
import type { ComponentType } from "react";
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

const COULEURS_CALLOUT = [
  { color: "info", label: "Info", icone: "InformationPleineIcon" },
  { color: "success", label: "Succès", icone: "CheckLineIcon" },
  { color: "warning", label: "Attention", icone: "WarningIcon" },
  { color: "error", label: "Alerte", icone: "ErrorWarningIcon" },
] as const;

const NIVEAUX_TITRE = [1, 2, 3, 4, 5, 6] as const;

export const construireOptionsBlocs = (
  editor: Editor,
  actions: ActionsBlocs = {},
): OptionBloc[] => [
  {
    label: "Encadré",
    keywords: "callout encadre info alerte",
    Icone: icone("InformationPleineIcon"),
    sousOptions: COULEURS_CALLOUT.map((variante) => ({
      label: variante.label,
      keywords: `callout ${variante.label.toLowerCase()}`,
      Icone: icone(variante.icone),
      run: () =>
        editor.chain().focus().insertCallout({ color: variante.color }).run(),
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
